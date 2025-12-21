import crypto from 'crypto';
import PlantBox from './plantBox.model.js';
import User from '../auth/auth.model.js';
import TaskCompletionToken from './taskCompletionToken.model.js';
import emailService from '../../common/services/emailService.js';
import { getFrontendUrl } from '../../common/utils/serverIp.js';
import { broadcastNotification } from '../notifications/notification.stream.controller.js';
import { createNotification } from '../notifications/notification.service.js';
import { getWeatherData } from '../weather/weather.service.js';

/**
 * Plant Box Notification Service
 * Gửi email thông báo cho người dùng khi đến giờ làm task
 */

/**
 * Kiểm tra và gửi email reminder cho tasks sắp đến
 * @param {number} minutesBefore - Số phút trước khi task bắt đầu để gửi reminder (default: 15)
 * @returns {Promise<object>} Kết quả gửi email
 */
export const sendTaskReminders = async (minutesBefore = 15) => {
  try {
    console.log(`📧 [PlantBox Notification] Checking for tasks in the next ${minutesBefore} minutes...`);
    
    const now = new Date();
    const reminderTime = new Date(now.getTime() + minutesBefore * 60 * 1000);
    
    // Lấy tất cả plant boxes có notifications enabled
    const plantBoxes = await PlantBox.find({
      'notifications.enabled': true,
      'notifications.email': true,
      'careStrategy.next7Days': { $exists: true, $ne: [] },
    }).populate('user', 'name email settings.emailNotifications');
    
    if (!plantBoxes || plantBoxes.length === 0) {
      console.log('📧 [PlantBox Notification] No plant boxes with email notifications enabled');
      return { sent: 0, skipped: 0, errors: 0 };
    }
    
    let sentCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const plantBox of plantBoxes) {
      try {
        // Kiểm tra user settings
        const user = plantBox.user;
        if (!user || !user.email) {
          skippedCount++;
          continue;
        }
        
        // Kiểm tra user có bật email notifications không
        if (user.settings && user.settings.emailNotifications === false) {
          skippedCount++;
          continue;
        }
        
        // Tìm tasks sắp đến trong khoảng thời gian reminder
        const upcomingTasks = findUpcomingTasks(plantBox, now, reminderTime);
        
        if (upcomingTasks.length === 0) {
          continue; // Không có task nào sắp đến
        }
        
        // Gửi email reminder với completion links
        await sendTaskReminderEmail(user, plantBox, upcomingTasks);
        sentCount++;
        
        console.log(`✅ [PlantBox Notification] Sent reminder to ${user.email} for ${upcomingTasks.length} task(s)`);
      } catch (error) {
        console.error(`❌ [PlantBox Notification] Error processing plant box ${plantBox._id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`📧 [PlantBox Notification] Completed: ${sentCount} sent, ${skippedCount} skipped, ${errorCount} errors`);
    
    return {
      sent: sentCount,
      skipped: skippedCount,
      errors: errorCount,
    };
  } catch (error) {
    console.error('❌ [PlantBox Notification] Error in sendTaskReminders:', error.message);
    throw error;
  }
};

/**
 * Tìm các tasks sắp đến trong khoảng thời gian
 * @param {object} plantBox - PlantBox document
 * @param {Date} now - Thời gian hiện tại
 * @param {Date} reminderTime - Thời gian reminder (now + minutesBefore)
 * @returns {Array} Danh sách tasks sắp đến
 */
const findUpcomingTasks = (plantBox, now, reminderTime) => {
  const upcomingTasks = [];
  
  if (!plantBox.careStrategy || !plantBox.careStrategy.next7Days) {
    return upcomingTasks;
  }
  
  for (const day of plantBox.careStrategy.next7Days) {
    const dayDate = new Date(day.date);
    dayDate.setHours(0, 0, 0, 0);
    
    // Chỉ xét tasks trong 7 ngày tới
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((dayDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0 || daysDiff > 6) {
      continue; // Bỏ qua ngày quá khứ hoặc quá xa
    }
    
    // Kiểm tra từng action trong ngày
    if (day.actions && Array.isArray(day.actions)) {
      for (const action of day.actions) {
        // Bỏ qua task đã hoàn thành
        if (action.completed) {
          continue;
        }
        
        // Parse time (format: "08:00")
        const [hours, minutes] = action.time.split(':').map(Number);
        const taskDateTime = new Date(dayDate);
        taskDateTime.setHours(hours, minutes || 0, 0, 0);
        
        // Kiểm tra task có trong khoảng thời gian reminder không
        if (taskDateTime >= now && taskDateTime <= reminderTime) {
          upcomingTasks.push({
            action,
            dayDate: dayDate,
            taskDateTime: taskDateTime,
            dayIndex: daysDiff,
          });
        }
      }
    }
  }
  
  return upcomingTasks;
};

/**
 * Generate completion token for a task
 * @param {string} plantBoxId - Plant box ID
 * @param {number} dayIndex - Day index
 * @param {string} actionId - Action ID
 * @returns {Promise<string>} Completion token
 */
const generateCompletionToken = async (plantBoxId, dayIndex, actionId) => {
  try {
    // Generate random token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    // Set expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Save token to database
    await TaskCompletionToken.create({
      plantBoxId,
      dayIndex,
      actionId,
      tokenHash,
      expiresAt,
      used: false,
    });
    
    return token;
  } catch (error) {
    console.error('❌ [TaskCompletionToken] Error generating token:', error);
    throw error;
  }
};

/**
 * Gửi email reminder cho tasks
 * @param {object} user - User document
 * @param {object} plantBox - PlantBox document
 * @param {Array} tasks - Danh sách tasks sắp đến
 * @returns {Promise<object>} Kết quả gửi email
 */
const sendTaskReminderEmail = async (user, plantBox, tasks) => {
  try {
    const appUrl = getFrontendUrl(5173);
    
    // Generate completion tokens for each task
    const tasksWithTokens = await Promise.all(
      tasks.map(async (task) => {
        const token = await generateCompletionToken(
          plantBox._id,
          task.dayIndex,
          task.action._id
        );
        const completionUrl = `${appUrl}/api/v1/plant-boxes/complete-task?token=${token}`;
        return {
          ...task,
          completionUrl,
        };
      })
    );
    
    const subject = `🌱 Nhắc nhở: ${tasks.length} công việc chăm sóc cây sắp đến`;
    const htmlContent = getTaskReminderEmailTemplate(user.name, plantBox, tasksWithTokens);
    const textContent = getTaskReminderEmailText(user.name, plantBox, tasksWithTokens);
    
    // Use emailService to send email
    const result = await emailService.sendCustomEmail(
      user.email,
      user.name,
      htmlContent,
      textContent,
      subject
    );
    
    return {
      success: true,
      messageId: result.messageId,
      to: user.email,
    };
  } catch (error) {
    console.error(`❌ [PlantBox Notification] Failed to send email to ${user.email}:`, error.message);
    throw error;
  }
};

/**
 * HTML template cho task reminder email
 */
const getTaskReminderEmailTemplate = (userName, plantBox, tasks) => {
  const taskList = tasks.map((task, index) => {
    const taskTime = formatTaskTime(task.taskDateTime);
    const taskDate = formatTaskDate(task.dayDate);
    const actionIcon = getActionIcon(task.action.type);
    
    return `
      <div style="background: #f9f9f9; padding: 15px; margin: 10px 0; border-left: 4px solid #4CAF50; border-radius: 4px;">
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <span style="font-size: 24px; margin-right: 10px;">${actionIcon}</span>
          <div style="flex: 1;">
            <h3 style="margin: 0; color: #333;">${task.action.description || 'Chăm sóc cây'}</h3>
            <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
              📅 ${taskDate} lúc ${taskTime}
            </p>
          </div>
        </div>
        ${task.action.reason ? `<p style="margin: 10px 0 0 0; color: #555; font-style: italic;">${task.action.reason}</p>` : ''}
        ${task.action.products && task.action.products.length > 0 ? `
          <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
            <strong>Sản phẩm đề xuất:</strong> ${task.action.products.join(', ')}
          </p>
        ` : ''}
        <div style="margin-top: 15px;">
          <a href="${task.completionUrl}" style="display: inline-block; background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            ✅ Đánh dấu hoàn thành
          </a>
        </div>
      </div>
    `;
  }).join('');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nhắc nhở chăm sóc cây</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌱 GreenGrow</h1>
          <h2>Nhắc nhở chăm sóc cây</h2>
        </div>
        <div class="content">
          <h3>Xin chào ${userName}!</h3>
          <p>Bạn có <strong>${tasks.length}</strong> công việc chăm sóc cây sắp đến:</p>
          
          <div style="margin: 20px 0;">
            <h4 style="color: #4CAF50; margin-bottom: 15px;">📦 ${plantBox.name || 'Vườn cây của bạn'}</h4>
            ${taskList}
          </div>
          
          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
            💡 <strong>Mẹo:</strong> Bạn có thể tắt thông báo email trong phần Cài đặt nếu không muốn nhận email này.
          </p>
        </div>
        <div class="footer">
          <p>© 2024 GreenGrow. Tất cả quyền được bảo lưu.</p>
          <p>Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Text template cho task reminder email
 */
const getTaskReminderEmailText = (userName, plantBox, tasks) => {
  const taskList = tasks.map((task, index) => {
    const taskTime = formatTaskTime(task.taskDateTime);
    const taskDate = formatTaskDate(task.dayDate);
    const actionIcon = getActionIcon(task.action.type);
    
    return `
${index + 1}. ${actionIcon} ${task.action.description || 'Chăm sóc cây'}
   📅 ${taskDate} lúc ${taskTime}
   ${task.action.reason ? `   Lý do: ${task.action.reason}` : ''}
   ${task.action.products && task.action.products.length > 0 ? `   Sản phẩm: ${task.action.products.join(', ')}` : ''}
   ✅ Đánh dấu hoàn thành: ${task.completionUrl}
    `;
  }).join('\n');
  
  return `
Xin chào ${userName}!

Bạn có ${tasks.length} công việc chăm sóc cây sắp đến:

📦 ${plantBox.name || 'Vườn cây của bạn'}
${taskList}

Hãy click vào link "Đánh dấu hoàn thành" để hoàn thành công việc ngay!

💡 Mẹo: Bạn có thể tắt thông báo email trong phần Cài đặt nếu không muốn nhận email này.

© 2024 GreenGrow. Tất cả quyền được bảo lưu.
Email này được gửi tự động, vui lòng không trả lời.
  `;
};

/**
 * Format task time
 */
const formatTaskTime = (dateTime) => {
  return dateTime.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
};

/**
 * Format task date
 */
const formatTaskDate = (date) => {
  return date.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
};

/**
 * Get icon for action type
 */
const getActionIcon = (type) => {
  const icons = {
    water: '💧',
    fertilize: '🌿',
    prune: '✂️',
    check: '🔍',
    protect: '🛡️',
  };
  return icons[type] || '📋';
};

/**
 * Check if weather is extreme
 * @param {object} weather - Weather data
 * @returns {object|null} - Extreme weather info or null
 */
const checkExtremeWeather = (weather) => {
  if (!weather || !weather.current) {
    return null;
  }

  const { temperature, humidity, windSpeed, rain, description } = weather.current;
  const extremes = [];

  // Temperature extremes
  if (temperature > 38) {
    extremes.push({
      type: 'heat',
      severity: 'high',
      message: `Nhiệt độ rất cao (${temperature}°C)`,
      icon: '🌡️',
      warning: 'Cây có thể bị héo, cháy lá. Cần tưới nước thường xuyên và che bóng mát.',
      recommendations: ['Tưới nước sáng sớm và chiều mát', 'Che bóng mát nếu có thể', 'Kiểm tra độ ẩm đất thường xuyên']
    });
  } else if (temperature < 5) {
    extremes.push({
      type: 'cold',
      severity: 'high',
      message: `Nhiệt độ rất thấp (${temperature}°C)`,
      icon: '❄️',
      warning: 'Cây có nguy cơ bị tổn thương do lạnh. Cần bảo vệ khỏi sương giá.',
      recommendations: ['Che phủ cây vào ban đêm', 'Tránh tưới nước vào buổi tối', 'Di chuyển cây vào trong nhà nếu trồng chậu']
    });
  }

  // Heavy rain
  if (rain && rain > 50) {
    extremes.push({
      type: 'heavy_rain',
      severity: 'medium',
      message: `Mưa lớn (${rain}mm)`,
      icon: '🌧️',
      warning: 'Mưa lớn có thể gây úng nước, làm rễ cây bị thối.',
      recommendations: ['Kiểm tra hệ thống thoát nước', 'Tạm ngưng tưới nước', 'Theo dõi dấu hiệu úng nước']
    });
  }

  // Strong wind
  if (windSpeed && windSpeed > 40) {
    extremes.push({
      type: 'strong_wind',
      severity: 'medium',
      message: `Gió mạnh (${windSpeed}km/h)`,
      icon: '💨',
      warning: 'Gió mạnh có thể làm gãy cành, đổ cây.',
      recommendations: ['Chống đỡ cây yếu', 'Cắt tỉa cành yếu', 'Di chuyển cây chậu vào nơi kín gió']
    });
  }

  // Very low humidity
  if (humidity < 30) {
    extremes.push({
      type: 'low_humidity',
      severity: 'low',
      message: `Độ ẩm thấp (${humidity}%)`,
      icon: '🏜️',
      warning: 'Độ ẩm thấp làm cây mất nước nhanh.',
      recommendations: ['Tưới nước thường xuyên hơn', 'Phun sương cho lá', 'Đặt khay nước gần cây']
    });
  }

  return extremes.length > 0 ? {
    hasExtreme: true,
    extremes,
    weatherSummary: description || 'Thời tiết bất thường'
  } : null;
};

/**
 * Send weather alert email for a plant box
 * @param {object} user - User document
 * @param {object} plantBox - PlantBox document
 * @param {object} extremeWeather - Extreme weather info
 * @returns {Promise<object>} - Email result
 */
const sendWeatherAlertEmail = async (user, plantBox, extremeWeather) => {
  try {
    const appUrl = getFrontendUrl(5173);
    const plantBoxUrl = `${appUrl}/my-plants/${plantBox._id}`;

    const subject = `⚠️ Cảnh báo thời tiết: ${plantBox.name}`;
    const htmlContent = getWeatherAlertEmailTemplate(user.name, plantBox, extremeWeather, plantBoxUrl);
    const textContent = getWeatherAlertEmailText(user.name, plantBox, extremeWeather, plantBoxUrl);

    const result = await emailService.sendCustomEmail(
      user.email,
      user.name,
      htmlContent,
      textContent,
      subject
    );

    return {
      success: true,
      messageId: result.messageId,
      to: user.email,
    };
  } catch (error) {
    console.error(`❌ [PlantBox Weather Alert] Failed to send email to ${user.email}:`, error.message);
    throw error;
  }
};

/**
 * HTML template for weather alert email
 */
const getWeatherAlertEmailTemplate = (userName, plantBox, extremeWeather, plantBoxUrl) => {
  const extremesList = extremeWeather.extremes.map((extreme) => `
    <div style="background-color: ${extreme.severity === 'high' ? '#FEE2E2' : '#FEF3C7'}; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid ${extreme.severity === 'high' ? '#DC2626' : '#F59E0B'};">
      <h3 style="margin: 0 0 10px 0; color: #1F2937; font-size: 18px;">
        ${extreme.icon} ${extreme.message}
      </h3>
      <p style="margin: 0 0 10px 0; color: #4B5563; font-weight: 500;">
        ⚠️ ${extreme.warning}
      </p>
      <div style="margin-left: 20px;">
        <p style="margin: 5px 0; font-weight: 600; color: #059669;">Khuyến nghị:</p>
        ${extreme.recommendations.map(rec => `<p style="margin: 5px 0; color: #4B5563;">• ${rec}</p>`).join('')}
      </div>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #DC2626 0%, #F59E0B 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Cảnh Báo Thời Tiết</h1>
    <p style="color: #FEE2E2; margin: 10px 0 0 0; font-size: 16px;">Bảo vệ cây trồng của bạn</p>
  </div>
  
  <div style="background-color: #ffffff; padding: 30px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; color: #4B5563; margin-bottom: 20px;">
      Xin chào <strong>${userName}</strong>!
    </p>
    
    <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <p style="margin: 0; color: #374151;">
        <strong style="color: #059669;">🌱 Cây trồng:</strong> ${plantBox.name}
      </p>
      <p style="margin: 10px 0 0 0; color: #374151;">
        <strong style="color: #059669;">📍 Vị trí:</strong> ${plantBox.location?.province || 'Không xác định'}
      </p>
    </div>
    
    <p style="font-size: 16px; color: #DC2626; font-weight: 600; margin-bottom: 20px;">
      Hệ thống phát hiện thời tiết bất thường có thể ảnh hưởng đến cây của bạn:
    </p>
    
    ${extremesList}
    
    <div style="background-color: #DBEAFE; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #3B82F6;">
      <p style="margin: 0; color: #1E40AF; font-weight: 500;">
        💡 <strong>Lưu ý:</strong> Hãy theo dõi cây thường xuyên và điều chỉnh chăm sóc phù hợp với điều kiện thời tiết.
      </p>
    </div>
    
    <div style="text-align: center; margin-top: 30px;">
      <a href="${plantBoxUrl}" style="display: inline-block; background-color: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        🌱 Xem Chi Tiết Cây Trồng
      </a>
    </div>
    
    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #6B7280; text-align: center;">
      © 2024 GreenGrow. Tất cả quyền được bảo lưu.<br/>
      Email này được gửi tự động, vui lòng không trả lời.
    </p>
  </div>
</body>
</html>
  `;
};

/**
 * Text template for weather alert email
 */
const getWeatherAlertEmailText = (userName, plantBox, extremeWeather, plantBoxUrl) => {
  const extremesList = extremeWeather.extremes.map((extreme, index) => {
    const recommendations = extreme.recommendations.map(rec => `   - ${rec}`).join('\n');
    return `
${index + 1}. ${extreme.icon} ${extreme.message}
   ⚠️ ${extreme.warning}
   
   💡 Khuyến nghị:
${recommendations}
    `;
  }).join('\n');

  return `
Xin chào ${userName}!

⚠️ CẢNH BÁO THỜI TIẾT

🌱 Cây trồng: ${plantBox.name}
📍 Vị trí: ${plantBox.location?.province || 'Không xác định'}

Hệ thống phát hiện thời tiết bất thường có thể ảnh hưởng đến cây của bạn:

${extremesList}

💡 Lưu ý: Hãy theo dõi cây thường xuyên và điều chỉnh chăm sóc phù hợp với điều kiện thời tiết.

Xem chi tiết: ${plantBoxUrl}

---
© 2024 GreenGrow. Tất cả quyền được bảo lưu.
Email này được gửi tự động, vui lòng không trả lời.
  `;
};

/**
 * Check and send weather alerts for all plant boxes
 * @returns {Promise<object>} - Result summary
 */
export const sendWeatherAlerts = async () => {
  try {
    console.log('🌤️ [Weather Alert] Checking weather conditions for all plant boxes...');

    const plantBoxes = await PlantBox.find({
      'notifications.enabled': true,
      'notifications.email': true,
      'location.coordinates': { $exists: true },
    }).populate('user', 'name email settings.emailNotifications');

    if (!plantBoxes || plantBoxes.length === 0) {
      console.log('🌤️ [Weather Alert] No plant boxes to check');
      return { sent: 0, skipped: 0, errors: 0 };
    }

    let sentCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const plantBox of plantBoxes) {
      try {
        const user = plantBox.user;
        if (!user || !user.email) {
          skippedCount++;
          continue;
        }

        if (user.settings && user.settings.emailNotifications === false) {
          skippedCount++;
          continue;
        }

        // Get current weather
        const weather = await getWeatherData({
          lat: plantBox.location.coordinates.lat,
          lon: plantBox.location.coordinates.lon,
        });

        // Check for extreme conditions
        const extremeWeather = checkExtremeWeather(weather);

        if (extremeWeather && extremeWeather.hasExtreme) {
          await sendWeatherAlertEmail(user, plantBox, extremeWeather);
          sentCount++;
          console.log(`✅ [Weather Alert] Sent to ${user.email} for ${plantBox.name}`);
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ [Weather Alert] Error processing plant box ${plantBox._id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`🌤️ [Weather Alert] Completed: ${sentCount} sent, ${skippedCount} skipped, ${errorCount} errors`);
    return { sent: sentCount, skipped: skippedCount, errors: errorCount };
  } catch (error) {
    console.error('❌ [Weather Alert] Failed:', error);
    throw error;
  }
};

/**
 * Gửi email cảnh báo về công việc chưa hoàn thành
 * @returns {Promise<object>} Kết quả gửi email
 */
export const sendUncompletedTaskWarnings = async () => {
  try {
    console.log('⚠️ [Uncompleted Tasks] Checking for missed tasks...');
    
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Lấy plant boxes với strategy active và email enabled
    const plantBoxes = await PlantBox.find({
      type: 'active',
      'notifications.enabled': true,
      'notifications.email': true,
      'careStrategy.next7Days': { $exists: true, $ne: [] },
    }).populate('user', 'name email settings.emailNotifications');
    
    if (!plantBoxes || plantBoxes.length === 0) {
      console.log('⚠️ [Uncompleted Tasks] No plant boxes to check');
      return { sent: 0, skipped: 0, errors: 0 };
    }
    
    let sentCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const plantBox of plantBoxes) {
      try {
        const user = plantBox.user;
        if (!user || !user.email) {
          skippedCount++;
          continue;
        }
        
        if (user.settings && user.settings.emailNotifications === false) {
          skippedCount++;
          continue;
        }
        
        // Check if there are any uncompleted tasks from past days
        const uncompletedTasks = [];
        
        for (const day of plantBox.careStrategy.next7Days) {
          const dayDateStr = new Date(day.date).toISOString().split('T')[0];
          const dayDate = new Date(dayDateStr);
          const today = new Date(todayStr);
          
          // Only check past days (not today or future)
          if (dayDate >= today) {
            continue;
          }
          
          // Check for uncompleted actions
          if (day.actions && day.actions.length > 0) {
            const missedActions = day.actions.filter(action => !action.completed);
            
            if (missedActions.length > 0) {
              uncompletedTasks.push({
                date: day.date,
                dayLabel: formatDateLabel(day.date),
                actions: missedActions.map(action => ({
                  time: action.time,
                  description: action.description,
                  type: action.type,
                  reason: action.reason,
                })),
              });
            }
          }
        }
        
        // If there are uncompleted tasks, send warning email
        if (uncompletedTasks.length > 0) {
          const totalMissedTasks = uncompletedTasks.reduce((sum, day) => sum + day.actions.length, 0);
          
          await sendUncompletedTaskWarningEmail(user, plantBox, uncompletedTasks, totalMissedTasks);
          sentCount++;
          console.log(`✅ [Uncompleted Tasks] Sent warning to ${user.email} for ${plantBox.name} (${totalMissedTasks} missed tasks)`);
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ [Uncompleted Tasks] Error processing plant box ${plantBox._id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`⚠️ [Uncompleted Tasks] Completed: ${sentCount} sent, ${skippedCount} skipped, ${errorCount} errors`);
    return { sent: sentCount, skipped: skippedCount, errors: errorCount };
  } catch (error) {
    console.error('❌ [Uncompleted Tasks] Failed:', error);
    throw error;
  }
};

/**
 * Gửi email cảnh báo về tasks chưa hoàn thành
 */
async function sendUncompletedTaskWarningEmail(user, plantBox, uncompletedTasks, totalMissedTasks) {
  const frontendUrl = getFrontendUrl();
  const plantBoxDetailUrl = `${frontendUrl}/my-plants/${plantBox._id}`;
  
  // Generate task list HTML
  const tasksHtml = uncompletedTasks.map(day => `
    <div style="margin-bottom: 20px; padding: 15px; background-color: #FEF2F2; border-left: 4px solid #EF4444; border-radius: 8px;">
      <div style="font-weight: 600; color: #B91C1C; margin-bottom: 10px;">
        📅 ${day.dayLabel}
      </div>
      ${day.actions.map(action => `
        <div style="margin-left: 15px; margin-bottom: 10px; padding: 10px; background-color: white; border-radius: 6px;">
          <div style="font-weight: 600; color: #1F2937; margin-bottom: 5px;">
            ⏰ ${action.time} - ${action.description}
          </div>
          <div style="color: #6B7280; font-size: 13px;">
            Lý do: ${action.reason}
          </div>
        </div>
      `).join('')}
    </div>
  `).join('');
  
  // Determine severity and risk message based on number of missed tasks
  let severityIcon, severityColor, riskMessage;
  
  if (totalMissedTasks >= 5) {
    severityIcon = '🚨';
    severityColor = '#DC2626';
    riskMessage = `<strong style="color: #DC2626;">Nguy cơ cao!</strong> Cây của bạn có thể bị bệnh, chết hoặc không phát triển tốt do thiếu chăm sóc.`;
  } else if (totalMissedTasks >= 3) {
    severityIcon = '⚠️';
    severityColor = '#F59E0B';
    riskMessage = `<strong style="color: #F59E0B;">Cần chú ý!</strong> Cây đang thiếu chăm sóc và có thể gặp vấn đề nếu tiếp tục bỏ lỡ công việc.`;
  } else {
    severityIcon = '⏳';
    severityColor = '#3B82F6';
    riskMessage = `<strong style="color: #3B82F6;">Nhắc nhở!</strong> Một số công việc chăm sóc đã bị bỏ lỡ. Hãy hoàn thành sớm nhất có thể.`;
  }
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F3F4F6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); padding: 40px 30px; text-align: center;">
            <div style="font-size: 64px; margin-bottom: 15px;">${severityIcon}</div>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
              Cảnh Báo: Công Việc Chưa Hoàn Thành
            </h1>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 0;">
              Xin chào <strong>${user.name}</strong>,
            </p>

            <div style="background-color: #FEF2F2; border: 2px solid ${severityColor}; border-radius: 12px; padding: 20px; margin: 25px 0;">
              <p style="color: #1F2937; font-size: 16px; line-height: 1.6; margin: 0;">
                ${riskMessage}
              </p>
            </div>

            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Cây <strong style="color: #059669;">${plantBox.name}</strong> của bạn có <strong style="color: #EF4444;">${totalMissedTasks} công việc chưa hoàn thành</strong> từ các ngày trước:
            </p>

            ${tasksHtml}

            <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <div style="font-weight: 600; color: #92400E; margin-bottom: 10px; font-size: 16px;">
                💡 Khuyến nghị:
              </div>
              <ul style="color: #78350F; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li>Hoàn thành các công việc bị bỏ lỡ ngay hôm nay nếu có thể</li>
                <li>Kiểm tra tình trạng cây để phát hiện sớm vấn đề</li>
                <li>Đặt lịch nhắc nhở để không bỏ lỡ công việc tiếp theo</li>
                <li>Nếu cây có biểu hiện bất thường, hãy kiểm tra và xử lý ngay</li>
              </ul>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 35px 0;">
              <a href="${plantBoxDetailUrl}" style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);">
                Xem Chi Tiết & Hoàn Thành Công Việc
              </a>
            </div>

            <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-bottom: 0;">
              Hãy chăm sóc cây của bạn đều đặn để có được kết quả tốt nhất! 🌱
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB;">
            <p style="color: #6B7280; font-size: 13px; margin: 0 0 10px 0;">
              Email này được gửi tự động từ hệ thống GreenGrow
            </p>
            <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
              © 2024 GreenGrow. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  await emailService.sendEmail({
    to: user.email,
    subject: `${severityIcon} Cảnh báo: ${totalMissedTasks} công việc chưa hoàn thành cho ${plantBox.name}`,
    html: emailHtml,
  });
}

/**
 * Format date label for email
 */
function formatDateLabel(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    return 'Hôm qua';
  } else if (diffDays === 2) {
    return 'Hôm kia';
  } else {
    const dayOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][date.getDay()];
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${dayOfWeek} (${day}/${month})`;
  }
}

export default {
  sendTaskReminders,
  sendWeatherAlerts,
  sendUncompletedTaskWarnings,
};

