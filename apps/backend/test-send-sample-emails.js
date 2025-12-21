import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { getFrontendUrl } from './src/common/utils/serverIp.js';

// Load environment variables
dotenv.config();

// Create transporter directly
const transporter = nodemailer.createTransport({
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

/**
 * Script to send sample emails for testing
 * Run: node test-send-sample-emails.js
 */

const TEST_EMAIL = 'huynhthinh61@gmail.com';
const TEST_USER_NAME = 'Huỳnh Thịnh';

// Sample 1: Uncompleted Task Warning Email
async function sendUncompletedTaskSample() {
  const frontendUrl = getFrontendUrl();
  const plantBoxDetailUrl = `${frontendUrl}/my-plants/sample-id`;
  
  const uncompletedTasks = [
    {
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
      dayLabel: 'Hôm qua',
      actions: [
        {
          time: '07:00',
          description: 'Tưới nước cho cây',
          type: 'watering',
          reason: 'Nhiệt độ cao, cây cần đủ nước để phát triển'
        },
        {
          time: '18:00',
          description: 'Kiểm tra sâu bệnh',
          type: 'monitoring',
          reason: 'Phát hiện sớm để xử lý kịp thời'
        }
      ]
    },
    {
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Day before yesterday
      dayLabel: 'Hôm kia',
      actions: [
        {
          time: '08:00',
          description: 'Bón phân NPK',
          type: 'fertilizing',
          reason: 'Bổ sung dinh dưỡng cho giai đoạn ra hoa'
        },
        {
          time: '16:00',
          description: 'Tỉa cành và lá già',
          type: 'pruning',
          reason: 'Tăng thông thoáng, giảm nguy cơ nấm bệnh'
        },
        {
          time: '19:00',
          description: 'Phun thuốc phòng bệnh',
          type: 'pest_control',
          reason: 'Thời tiết ẩm ướt, dễ phát sinh nấm bệnh'
        }
      ]
    }
  ];
  
  const totalMissedTasks = 5;
  const severityIcon = '🚨';
  const severityColor = '#DC2626';
  const riskMessage = `<strong style="color: #DC2626;">Nguy cơ cao!</strong> Cây của bạn có thể bị bệnh, chết hoặc không phát triển tốt do thiếu chăm sóc.`;
  
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
              Xin chào <strong>${TEST_USER_NAME}</strong>,
            </p>

            <div style="background-color: #FEF2F2; border: 2px solid ${severityColor}; border-radius: 12px; padding: 20px; margin: 25px 0;">
              <p style="color: #1F2937; font-size: 16px; line-height: 1.6; margin: 0;">
                ${riskMessage}
              </p>
            </div>

            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Cây <strong style="color: #059669;">Cà Chua Cherry (Mẫu)</strong> của bạn có <strong style="color: #EF4444;">${totalMissedTasks} công việc chưa hoàn thành</strong> từ các ngày trước:
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
              <strong>📧 Email Mẫu (TEST)</strong><br/>
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
  
  try {
    const result = await transporter.sendMail({
      from: `"GreenGrow 🌱" <${process.env.SMTP_USER}>`,
      to: TEST_EMAIL,
      subject: `${severityIcon} [DEMO] Cảnh báo: ${totalMissedTasks} công việc chưa hoàn thành cho Cà Chua Cherry`,
      html: emailHtml,
    });
    console.log('✅ Sample 1: Uncompleted Task Warning Email sent!', result.messageId);
  } catch (error) {
    console.error('❌ Failed to send Sample 1:', error.message);
  }
}

// Sample 2: Weather Alert Email
async function sendWeatherAlertSample() {
  const frontendUrl = getFrontendUrl();
  const plantBoxDetailUrl = `${frontendUrl}/my-plants/sample-id`;
  
  // Simulate extreme weather
  const extremeWeather = {
    hasExtreme: true,
    alerts: [
      {
        type: 'temperature',
        severity: 'high',
        icon: '🌡️',
        message: 'Nhiệt độ cực cao 38°C',
        color: '#DC2626',
        bgColor: '#FEE2E2'
      },
      {
        type: 'rain',
        severity: 'medium',
        icon: '🌧️',
        message: 'Mưa lớn 65mm dự kiến',
        color: '#2563EB',
        bgColor: '#DBEAFE'
      },
      {
        type: 'humidity',
        severity: 'low',
        icon: '💧',
        message: 'Độ ẩm thấp 25%',
        color: '#F59E0B',
        bgColor: '#FEF3C7'
      }
    ],
    maxSeverity: 'high',
    mainColor: '#DC2626',
    mainIcon: '🚨'
  };
  
  const weather = {
    forecast: [
      {
        date: new Date().toISOString(),
        temperature: 38,
        humidity: 25,
        rain: 65,
        windSpeed: 35,
        condition: 'Nắng nóng, có mưa giông'
      }
    ]
  };
  
  const alertsHtml = extremeWeather.alerts.map(alert => `
    <div style="margin-bottom: 15px; padding: 15px; background-color: ${alert.bgColor}; border-left: 4px solid ${alert.color}; border-radius: 8px;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 32px;">${alert.icon}</span>
        <div style="flex: 1;">
          <div style="font-weight: 600; color: ${alert.color}; font-size: 16px; margin-bottom: 4px;">
            ${alert.message}
          </div>
          <div style="color: #6B7280; font-size: 13px;">
            ${alert.type === 'temperature' ? 'Cây có thể bị stress nhiệt, cần tưới nước thường xuyên' : 
              alert.type === 'rain' ? 'Thoát nước tốt để tránh úng rễ' :
              'Tăng độ ẩm bằng cách phun sương hoặc đặt khay nước'}
          </div>
        </div>
      </div>
    </div>
  `).join('');
  
  const severityBadge = extremeWeather.maxSeverity === 'high' 
    ? '<span style="background-color: #DC2626; color: white; padding: 6px 12px; border-radius: 6px; font-weight: 600; font-size: 14px;">🚨 MỨC ĐỘ CAO</span>'
    : extremeWeather.maxSeverity === 'medium'
    ? '<span style="background-color: #F59E0B; color: white; padding: 6px 12px; border-radius: 6px; font-weight: 600; font-size: 14px;">⚠️ TRUNG BÌNH</span>'
    : '<span style="background-color: #3B82F6; color: white; padding: 6px 12px; border-radius: 6px; font-weight: 600; font-size: 14px;">ℹ️ LƯU Ý</span>';
  
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
          <div style="background: linear-gradient(135deg, ${extremeWeather.mainColor} 0%, #991B1B 100%); padding: 40px 30px; text-align: center;">
            <div style="font-size: 64px; margin-bottom: 15px;">${extremeWeather.mainIcon}</div>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
              Cảnh Báo Thời Tiết Cực Đoan
            </h1>
            <div style="margin-top: 15px;">
              ${severityBadge}
            </div>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 0;">
              Xin chào <strong>${TEST_USER_NAME}</strong>,
            </p>

            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Hệ thống phát hiện điều kiện thời tiết bất thường có thể ảnh hưởng đến cây <strong style="color: #059669;">Sầu Riêng Monthong (Mẫu)</strong> của bạn:
            </p>

            <!-- Weather Info -->
            <div style="background-color: #F3F4F6; border-radius: 12px; padding: 20px; margin: 25px 0;">
              <div style="font-weight: 600; color: #1F2937; margin-bottom: 15px; font-size: 16px;">
                🌤️ Thời tiết hôm nay:
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div style="text-align: center; padding: 12px; background-color: white; border-radius: 8px;">
                  <div style="font-size: 24px; margin-bottom: 5px;">🌡️</div>
                  <div style="color: #6B7280; font-size: 12px; margin-bottom: 3px;">Nhiệt độ</div>
                  <div style="font-weight: 700; color: #DC2626; font-size: 20px;">${weather.forecast[0].temperature}°C</div>
                </div>
                <div style="text-align: center; padding: 12px; background-color: white; border-radius: 8px;">
                  <div style="font-size: 24px; margin-bottom: 5px;">💧</div>
                  <div style="color: #6B7280; font-size: 12px; margin-bottom: 3px;">Độ ẩm</div>
                  <div style="font-weight: 700; color: #F59E0B; font-size: 20px;">${weather.forecast[0].humidity}%</div>
                </div>
                <div style="text-align: center; padding: 12px; background-color: white; border-radius: 8px;">
                  <div style="font-size: 24px; margin-bottom: 5px;">🌧️</div>
                  <div style="color: #6B7280; font-size: 12px; margin-bottom: 3px;">Lượng mưa</div>
                  <div style="font-weight: 700; color: #2563EB; font-size: 20px;">${weather.forecast[0].rain}mm</div>
                </div>
                <div style="text-align: center; padding: 12px; background-color: white; border-radius: 8px;">
                  <div style="font-size: 24px; margin-bottom: 5px;">💨</div>
                  <div style="color: #6B7280; font-size: 12px; margin-bottom: 3px;">Gió</div>
                  <div style="font-weight: 700; color: #6366F1; font-size: 20px;">${weather.forecast[0].windSpeed}km/h</div>
                </div>
              </div>
            </div>

            <!-- Alerts -->
            <div style="margin: 25px 0;">
              <div style="font-weight: 600; color: #1F2937; margin-bottom: 15px; font-size: 16px;">
                ⚠️ Cảnh báo chi tiết:
              </div>
              ${alertsHtml}
            </div>

            <!-- Recommendations -->
            <div style="background-color: #DBEAFE; border-left: 4px solid #2563EB; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <div style="font-weight: 600; color: #1E40AF; margin-bottom: 10px; font-size: 16px;">
                💡 Khuyến nghị hành động:
              </div>
              <ul style="color: #1E3A8A; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li><strong>Tưới nước:</strong> Tăng tần suất tưới do nhiệt độ cao và độ ẩm thấp</li>
                <li><strong>Che chắn:</strong> Sử dụng lưới che để bảo vệ cây khỏi nắng gắt</li>
                <li><strong>Thoát nước:</strong> Kiểm tra hệ thống thoát nước để tránh úng rễ khi mưa</li>
                <li><strong>Phun sương:</strong> Tăng độ ẩm không khí bằng cách phun sương nhẹ</li>
                <li><strong>Theo dõi:</strong> Kiểm tra cây thường xuyên để phát hiện dấu hiệu stress</li>
              </ul>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 35px 0;">
              <a href="${plantBoxDetailUrl}" style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);">
                Xem Kế Hoạch Chăm Sóc Chi Tiết
              </a>
            </div>

            <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-bottom: 0;">
              Hãy chăm sóc cây của bạn cẩn thận trong điều kiện thời tiết này! 🌱
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB;">
            <p style="color: #6B7280; font-size: 13px; margin: 0 0 10px 0;">
              <strong>📧 Email Mẫu (TEST)</strong><br/>
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
  
  try {
    const result = await transporter.sendMail({
      from: `"GreenGrow 🌱" <${process.env.SMTP_USER}>`,
      to: TEST_EMAIL,
      subject: `🚨 [DEMO] Cảnh báo thời tiết cực đoan cho Sầu Riêng Monthong`,
      html: emailHtml,
    });
    console.log('✅ Sample 2: Weather Alert Email sent!', result.messageId);
  } catch (error) {
    console.error('❌ Failed to send Sample 2:', error.message);
  }
}

// Main function
async function main() {
  console.log('📧 Starting to send sample emails...');
  console.log(`📬 Recipient: ${TEST_EMAIL}`);
  console.log('');
  
  // Verify SMTP connection
  console.log('⏳ Verifying SMTP connection...');
  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');
  } catch (error) {
    console.error('❌ SMTP connection failed:', error.message);
    console.error('🔧 Please check your SMTP credentials in .env file');
    process.exit(1);
  }
  console.log('');
  
  console.log('📤 Sending Sample 1: Uncompleted Task Warning...');
  await sendUncompletedTaskSample();
  
  console.log('');
  
  console.log('📤 Sending Sample 2: Weather Alert...');
  await sendWeatherAlertSample();
  
  console.log('');
  console.log('🎉 All sample emails sent! Check your inbox at', TEST_EMAIL);
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

