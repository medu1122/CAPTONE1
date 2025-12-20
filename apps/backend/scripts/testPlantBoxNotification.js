/**
 * Test Script for Plant Box Notification
 * 
 * Script để test gửi email thông báo cho plant box tasks của ngày hôm nay
 * 
 * Usage:
 *   node scripts/testPlantBoxNotification.js
 * 
 * Hoặc với dotenv:
 *   dotenv -e .env -- node scripts/testPlantBoxNotification.js
 */

// Load environment variables FIRST
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from backend root
const envPath = join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// Verify SMTP credentials are loaded
if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.error('❌ [Test] SMTP credentials not found in .env file');
  console.error('   Please set SMTP_USER and SMTP_PASS in .env');
  console.error(`   Looking for .env at: ${envPath}`);
  process.exit(1);
}

console.log('✅ [Test] Environment variables loaded');
console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || 'smtp.gmail.com'}`);
console.log(`   SMTP_USER: ${process.env.SMTP_USER ? '***' + process.env.SMTP_USER.slice(-10) : 'NOT SET'}`);

import { connectDB } from '../src/config/db.js';
import PlantBox from '../src/modules/plantBoxes/plantBox.model.js';
import User from '../src/modules/auth/auth.model.js';
import { getFrontendUrl } from '../src/common/utils/serverIp.js';

// Import emailService AFTER env is loaded
// Note: emailService is a singleton, so it will use the env vars we just loaded
let emailService;
try {
  const emailServiceModule = await import('../src/common/services/emailService.js');
  emailService = emailServiceModule.default;
} catch (error) {
  console.error('❌ [Test] Failed to import emailService:', error.message);
  process.exit(1);
}

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
 * HTML template cho task reminder email
 */
const getTaskReminderEmailTemplate = (userName, plantBox, tasks, plantBoxUrl) => {
  const taskList = tasks.map((task, index) => {
    const taskTime = formatTaskTime(task.taskDateTime);
    const taskDate = formatTaskDate(task.dayDate);
    const actionIcon = getActionIcon(task.action.type);
    
    return `
      <div style="background: #f9f9f9; padding: 15px; margin: 10px 0; border-left: 4px solid #4CAF50; border-radius: 4px;">
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <span style="font-size: 24px; margin-right: 10px;">${actionIcon}</span>
          <div>
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
        .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
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
          <p>Bạn có <strong>${tasks.length}</strong> công việc chăm sóc cây cần làm hôm nay:</p>
          
          <div style="margin: 20px 0;">
            <h4 style="color: #4CAF50; margin-bottom: 15px;">📦 ${plantBox.name || 'Vườn cây của bạn'}</h4>
            ${taskList}
          </div>
          
          <p>Hãy kiểm tra và hoàn thành các công việc này để cây trồng của bạn phát triển tốt nhất!</p>
          
          <a href="${plantBoxUrl}" class="button">Xem chi tiết và đánh dấu hoàn thành</a>
          
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
const getTaskReminderEmailText = (userName, plantBox, tasks, plantBoxUrl) => {
  const taskList = tasks.map((task, index) => {
    const taskTime = formatTaskTime(task.taskDateTime);
    const taskDate = formatTaskDate(task.dayDate);
    const actionIcon = getActionIcon(task.action.type);
    
    return `
${index + 1}. ${actionIcon} ${task.action.description || 'Chăm sóc cây'}
   📅 ${taskDate} lúc ${taskTime}
   ${task.action.reason ? `   Lý do: ${task.action.reason}` : ''}
   ${task.action.products && task.action.products.length > 0 ? `   Sản phẩm: ${task.action.products.join(', ')}` : ''}
    `;
  }).join('\n');
  
  return `
Xin chào ${userName}!

Bạn có ${tasks.length} công việc chăm sóc cây cần làm hôm nay:

📦 ${plantBox.name || 'Vườn cây của bạn'}
${taskList}

Hãy kiểm tra và hoàn thành các công việc này để cây trồng của bạn phát triển tốt nhất!

Xem chi tiết: ${plantBoxUrl}

💡 Mẹo: Bạn có thể tắt thông báo email trong phần Cài đặt nếu không muốn nhận email này.

© 2024 GreenGrow. Tất cả quyền được bảo lưu.
Email này được gửi tự động, vui lòng không trả lời.
  `;
};

/**
 * Tìm tất cả tasks của ngày hôm nay
 */
const findTodayTasks = (plantBox) => {
  const todayTasks = [];
  
  if (!plantBox.careStrategy || !plantBox.careStrategy.next7Days) {
    return todayTasks;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (const day of plantBox.careStrategy.next7Days) {
    const dayDate = new Date(day.date);
    dayDate.setHours(0, 0, 0, 0);
    
    // Chỉ lấy tasks của ngày hôm nay
    if (dayDate.getTime() !== today.getTime()) {
      continue;
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
        
        todayTasks.push({
          action,
          dayDate: dayDate,
          taskDateTime: taskDateTime,
          dayIndex: 0,
        });
      }
    }
  }
  
  return todayTasks;
};

/**
 * Gửi email reminder cho tasks
 */
const sendTaskReminderEmail = async (user, plantBox, tasks) => {
  try {
    // Verify SMTP credentials before sending
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS in .env');
    }
    
    const appUrl = getFrontendUrl(5173);
    const plantBoxUrl = `${appUrl}/my-plants/${plantBox._id}`;
    
    const subject = `🌱 Nhắc nhở: ${tasks.length} công việc chăm sóc cây hôm nay`;
    const htmlContent = getTaskReminderEmailTemplate(user.name, plantBox, tasks, plantBoxUrl);
    const textContent = getTaskReminderEmailText(user.name, plantBox, tasks, plantBoxUrl);
    
    // Create transporter directly to ensure env vars are loaded
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true' || false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    
    // Send email
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'GreenGrow <noreply@greengrow.com>',
      to: user.email,
      subject: subject,
      html: htmlContent,
      text: textContent,
    };
    
    const result = await transporter.sendMail(mailOptions);
    
    console.log(`✅ [Test] Email sent successfully. MessageId: ${result.messageId}`);
    
    return {
      success: true,
      messageId: result.messageId,
      to: user.email,
    };
  } catch (error) {
    console.error(`❌ [Test] Failed to send email to ${user.email}:`, error.message);
    if (error.message.includes('credentials') || error.message.includes('PLAIN')) {
      console.error('   Please check your .env file for SMTP_USER and SMTP_PASS');
      console.error(`   Current SMTP_USER: ${process.env.SMTP_USER ? 'SET' : 'NOT SET'}`);
      console.error(`   Current SMTP_PASS: ${process.env.SMTP_PASS ? 'SET' : 'NOT SET'}`);
    }
    throw error;
  }
};

/**
 * Main test function
 */
const testNotification = async () => {
  try {
    console.log('🔍 [Test] Connecting to database...');
    await connectDB();
    
    console.log('📧 [Test] Finding plant boxes with email notifications enabled...');
    
    // Lấy tất cả plant boxes có notifications enabled
    const plantBoxes = await PlantBox.find({
      'notifications.enabled': true,
      'notifications.email': true,
      'careStrategy.next7Days': { $exists: true, $ne: [] },
    }).populate('user', 'name email settings.emailNotifications');
    
    if (!plantBoxes || plantBoxes.length === 0) {
      console.log('❌ [Test] No plant boxes found with email notifications enabled');
      console.log('💡 [Test] Please create a plant box with email notifications enabled first');
      process.exit(0);
    }
    
    console.log(`📦 [Test] Found ${plantBoxes.length} plant box(es)\n`);
    
    let sentCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const plantBox of plantBoxes) {
      try {
        // Kiểm tra user settings
        const user = plantBox.user;
        if (!user || !user.email) {
          console.log(`⏭️  [Test] Skipping ${plantBox.name}: No user email`);
          skippedCount++;
          continue;
        }
        
        // Kiểm tra user có bật email notifications không
        if (user.settings && user.settings.emailNotifications === false) {
          console.log(`⏭️  [Test] Skipping ${plantBox.name}: User email notifications disabled`);
          skippedCount++;
          continue;
        }
        
        // Tìm tasks của ngày hôm nay
        const todayTasks = findTodayTasks(plantBox);
        
        if (todayTasks.length === 0) {
          console.log(`⏭️  [Test] Skipping ${plantBox.name}: No tasks for today`);
          skippedCount++;
          continue;
        }
        
        console.log(`📧 [Test] Sending email to ${user.email}...`);
        console.log(`   Plant Box: ${plantBox.name}`);
        console.log(`   Tasks: ${todayTasks.length} task(s) for today`);
        
        // Gửi email reminder
        await sendTaskReminderEmail(user, plantBox, todayTasks);
        sentCount++;
        
        console.log(`✅ [Test] Email sent successfully to ${user.email}\n`);
      } catch (error) {
        console.error(`❌ [Test] Error processing plant box ${plantBox.name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 [Test] Summary:');
    console.log(`  ✅ Sent: ${sentCount}`);
    console.log(`  ⏭️  Skipped: ${skippedCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    
    if (sentCount > 0) {
      console.log('\n✅ [Test] Test completed successfully!');
      console.log('   Check your email inbox to see the notification.');
    } else {
      console.log('\n⚠️  [Test] No emails were sent.');
      console.log('   Make sure you have:');
      console.log('   - Plant boxes with email notifications enabled');
      console.log('   - Tasks scheduled for today (not completed)');
      console.log('   - User email notifications enabled');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ [Test] Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

// Run test
testNotification();

