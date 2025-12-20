import crypto from 'crypto';
import PlantBox from './plantBox.model.js';
import User from '../auth/auth.model.js';
import TaskCompletionToken from './taskCompletionToken.model.js';
import emailService from '../../common/services/emailService.js';
import { getFrontendUrl } from '../../common/utils/serverIp.js';
import { broadcastNotification } from '../notifications/notification.stream.controller.js';
import { createNotification } from '../notifications/notification.service.js';

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

export default {
  sendTaskReminders,
};

