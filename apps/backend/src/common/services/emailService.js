import nodemailer from 'nodemailer';
import { httpError } from '../utils/http.js';
import { getFrontendUrl } from '../utils/serverIp.js';

/**
 * Email Service với Gmail SMTP
 * Hỗ trợ gửi email verification, password reset, notifications
 */

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Khởi tạo Nodemailer transporter với Gmail SMTP
   */
  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true' || false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false, // Cho development
        },
      });

      // Verify connection configuration
      this.verifyConnection();
    } catch (error) {
      console.error('❌ Email Service initialization failed:', error.message);
    }
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection verified successfully');
    } catch (error) {
      console.error('❌ SMTP connection failed:', error.message);
      console.error('🔧 Please check your SMTP credentials in .env file');
    }
  }

  /**
   * Gửi email verification
   * @param {string} to - Email người nhận
   * @param {string} name - Tên người dùng
   * @param {string} token - Raw verification token
   * @param {string} userId - User ID
   * @returns {Promise<object>} Kết quả gửi email
   */
  async sendVerificationEmail(to, name, token, userId) {
    try {
      // Tự động lấy IP server hiện tại để tạo URL
      const appUrl = getFrontendUrl(5173);
      const verificationUrl = `${appUrl}/verify-email?token=${token}&uid=${userId}`;
      
      console.log(`📧 Verification URL: ${verificationUrl}`);

      const mailOptions = {
        from: process.env.FROM_EMAIL || 'GreenGrow <noreply@greengrow.com>',
        to: to,
        subject: '🌱 Xác thực tài khoản GreenGrow',
        html: this.getVerificationEmailTemplate(name, verificationUrl),
        text: this.getVerificationEmailText(name, verificationUrl),
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ Verification email sent to ${to}`);
      return {
        success: true,
        messageId: result.messageId,
        to: to,
      };
    } catch (error) {
      console.error('❌ Failed to send verification email:', error.message);
      throw httpError(500, 'Failed to send verification email');
    }
  }

  /**
   * Gửi email password reset
   * @param {string} to - Email người nhận
   * @param {string} name - Tên người dùng
   * @param {string} token - Raw reset token
   * @param {string} userId - User ID
   * @returns {Promise<object>} Kết quả gửi email
   */
  async sendPasswordResetEmail(to, name, token, userId) {
    try {
      // Tự động lấy IP server hiện tại để tạo URL
      const appUrl = getFrontendUrl(5173);
      const resetUrl = `${appUrl}/reset-password?token=${token}&uid=${userId}`;
      
      console.log(`📧 Password reset URL: ${resetUrl}`);

      const mailOptions = {
        from: process.env.FROM_EMAIL || 'GreenGrow <noreply@greengrow.com>',
        to: to,
        subject: '🔐 Đặt lại mật khẩu GreenGrow',
        html: this.getPasswordResetEmailTemplate(name, resetUrl),
        text: this.getPasswordResetEmailText(name, resetUrl),
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ Password reset email sent to ${to}`);
      return {
        success: true,
        messageId: result.messageId,
        to: to,
      };
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error.message);
      throw httpError(500, 'Failed to send password reset email');
    }
  }

  /**
   * Gửi email welcome sau khi verify
   * @param {string} to - Email người nhận
   * @param {string} name - Tên người dùng
   * @returns {Promise<object>} Kết quả gửi email
   */
  async sendWelcomeEmail(to, name) {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'GreenGrow <noreply@greengrow.com>',
        to: to,
        subject: '🎉 Chào mừng đến với GreenGrow!',
        html: this.getWelcomeEmailTemplate(name),
        text: this.getWelcomeEmailText(name),
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ Welcome email sent to ${to}`);
      return {
        success: true,
        messageId: result.messageId,
        to: to,
      };
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error.message);
      throw httpError(500, 'Failed to send welcome email');
    }
  }

  /**
   * HTML template cho email verification
   */
  getVerificationEmailTemplate(name, verificationUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Xác thực tài khoản GreenGrow</title>
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
            <h2>Xác thực tài khoản của bạn</h2>
          </div>
          <div class="content">
            <h3>Xin chào ${name}!</h3>
            <p>Cảm ơn bạn đã đăng ký tài khoản GreenGrow. Để hoàn tất quá trình đăng ký, vui lòng xác thực email của bạn.</p>
            <p>Nhấn vào nút bên dưới để xác thực tài khoản:</p>
            <a href="${verificationUrl}" class="button">Xác thực tài khoản</a>
            <p>Hoặc copy link này vào trình duyệt:</p>
            <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 4px;">${verificationUrl}</p>
            <p><strong>Lưu ý:</strong> Link này sẽ hết hạn sau 24 giờ.</p>
          </div>
          <div class="footer">
            <p>© 2024 GreenGrow. Tất cả quyền được bảo lưu.</p>
            <p>Nếu bạn không yêu cầu email này, vui lòng bỏ qua.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Text template cho email verification
   */
  getVerificationEmailText(name, verificationUrl) {
    return `
Xin chào ${name}!

Cảm ơn bạn đã đăng ký tài khoản GreenGrow. Để hoàn tất quá trình đăng ký, vui lòng xác thực email của bạn.

Nhấn vào link này để xác thực tài khoản:
${verificationUrl}

Lưu ý: Link này sẽ hết hạn sau 24 giờ.

© 2024 GreenGrow. Tất cả quyền được bảo lưu.
Nếu bạn không yêu cầu email này, vui lòng bỏ qua.
    `;
  }

  /**
   * HTML template cho password reset
   */
  getPasswordResetEmailTemplate(name, resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Đặt lại mật khẩu GreenGrow</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FF9800; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #FF9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 GreenGrow</h1>
            <h2>Đặt lại mật khẩu</h2>
          </div>
          <div class="content">
            <h3>Xin chào ${name}!</h3>
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản GreenGrow của bạn.</p>
            <p>Nhấn vào nút bên dưới để đặt lại mật khẩu:</p>
            <a href="${resetUrl}" class="button">Đặt lại mật khẩu</a>
            <p>Hoặc copy link này vào trình duyệt:</p>
            <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 4px;">${resetUrl}</p>
            <p><strong>Lưu ý:</strong> Link này sẽ hết hạn sau 1 giờ.</p>
            <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
          </div>
          <div class="footer">
            <p>© 2024 GreenGrow. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Text template cho password reset
   */
  getPasswordResetEmailText(name, resetUrl) {
    return `
Xin chào ${name}!

Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản GreenGrow của bạn.

Nhấn vào link này để đặt lại mật khẩu:
${resetUrl}

Lưu ý: Link này sẽ hết hạn sau 1 giờ.

Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.

© 2024 GreenGrow. Tất cả quyền được bảo lưu.
    `;
  }

  /**
   * HTML template cho welcome email
   */
  getWelcomeEmailTemplate(name) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chào mừng đến với GreenGrow</title>
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
            <h1>🎉 GreenGrow</h1>
            <h2>Chào mừng bạn!</h2>
          </div>
          <div class="content">
            <h3>Xin chào ${name}!</h3>
            <p>Chúc mừng! Tài khoản GreenGrow của bạn đã được xác thực thành công.</p>
            <p>Bây giờ bạn có thể:</p>
            <ul>
              <li>🌱 Phân tích cây trồng với AI</li>
              <li>💬 Chat với chuyên gia nông nghiệp</li>
              <li>📚 Học cách chăm sóc cây</li>
              <li>👥 Tham gia cộng đồng nông dân</li>
            </ul>
            <p>Hãy bắt đầu hành trình trồng cây thông minh của bạn!</p>
          </div>
          <div class="footer">
            <p>© 2024 GreenGrow. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Text template cho welcome email
   */
  getWelcomeEmailText(name) {
    return `
Xin chào ${name}!

Chúc mừng! Tài khoản GreenGrow của bạn đã được xác thực thành công.

Bây giờ bạn có thể:
- Phân tích cây trồng với AI
- Chat với chuyên gia nông nghiệp  
- Học cách chăm sóc cây
- Tham gia cộng đồng nông dân

Hãy bắt đầu hành trình trồng cây thông minh của bạn!

© 2024 GreenGrow. Tất cả quyền được bảo lưu.
    `;
  }

  /**
   * Gửi email thông báo khi đổi mật khẩu thành công
   * @param {string} to - Email người nhận
   * @param {string} name - Tên người dùng
   * @param {string} ipAddress - IP address của request (optional)
   * @param {string} userAgent - User agent của request (optional)
   * @returns {Promise<object>} Kết quả gửi email
   */
  async sendPasswordChangeEmail(to, name, ipAddress = null, userAgent = null) {
    try {
      const timestamp = new Date().toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const mailOptions = {
        from: process.env.FROM_EMAIL || 'GreenGrow <noreply@greengrow.com>',
        to: to,
        subject: '🔐 Mật khẩu của bạn đã được thay đổi',
        html: this.getPasswordChangeEmailTemplate(name, timestamp, ipAddress, userAgent),
        text: this.getPasswordChangeEmailText(name, timestamp, ipAddress, userAgent),
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ Password change notification email sent to ${to}`);
      return {
        success: true,
        messageId: result.messageId,
        to: to,
      };
    } catch (error) {
      console.error('❌ Failed to send password change email:', error.message);
      // Don't throw error - password change is still successful
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * HTML template cho password change notification
   */
  getPasswordChangeEmailTemplate(name, timestamp, ipAddress, userAgent) {
    const deviceInfo = userAgent ? `<p><strong>Thiết bị:</strong> ${userAgent}</p>` : '';
    const ipInfo = ipAddress ? `<p><strong>Địa chỉ IP:</strong> ${ipAddress}</p>` : '';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thông báo thay đổi mật khẩu</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FF6B6B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: #fff; border-left: 4px solid #FF6B6B; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #FFF3CD; border: 1px solid #FFC107; padding: 15px; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 GreenGrow</h1>
            <h2>Thông báo thay đổi mật khẩu</h2>
          </div>
          <div class="content">
            <h3>Xin chào ${name}!</h3>
            <p>Mật khẩu tài khoản GreenGrow của bạn đã được thay đổi thành công.</p>
            
            <div class="info-box">
              <p><strong>Thời gian:</strong> ${timestamp}</p>
              ${ipInfo}
              ${deviceInfo}
            </div>

            <div class="warning">
              <p><strong>⚠️ Lưu ý quan trọng:</strong></p>
              <p>Nếu bạn không thực hiện thay đổi này, vui lòng:</p>
              <ul>
                <li>Đổi lại mật khẩu ngay lập tức</li>
                <li>Kiểm tra hoạt động đăng nhập gần đây</li>
                <li>Liên hệ với chúng tôi nếu bạn nghi ngờ có người khác truy cập tài khoản</li>
              </ul>
            </div>

            <p>Để bảo mật tài khoản của bạn, chúng tôi khuyến nghị:</p>
            <ul>
              <li>✅ Sử dụng mật khẩu mạnh và duy nhất</li>
              <li>✅ Không chia sẻ mật khẩu với người khác</li>
              <li>✅ Đổi mật khẩu định kỳ</li>
            </ul>
          </div>
          <div class="footer">
            <p>© 2024 GreenGrow. Tất cả quyền được bảo lưu.</p>
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Gửi email OTP cho đổi mật khẩu
   * @param {string} to - Email người nhận
   * @param {string} name - Tên người dùng
   * @param {string} otp - OTP code (6 digits)
   * @returns {Promise<object>} Kết quả gửi email
   */
  async sendPasswordChangeOTPEmail(to, name, otp) {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'GreenGrow <noreply@greengrow.com>',
        to: to,
        subject: '🔐 Mã xác thực đổi mật khẩu GreenGrow',
        html: this.getPasswordChangeOTPEmailTemplate(name, otp),
        text: this.getPasswordChangeOTPEmailText(name, otp),
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ Password change OTP email sent to ${to}`);
      return {
        success: true,
        messageId: result.messageId,
        to: to,
      };
    } catch (error) {
      console.error('❌ Failed to send password change OTP email:', error.message);
      throw httpError(500, 'Failed to send OTP email');
    }
  }

  /**
   * HTML template cho password change OTP
   */
  getPasswordChangeOTPEmailTemplate(name, otp) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mã xác thực đổi mật khẩu</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #22c55e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .otp-box { background: #fff; border: 2px dashed #22c55e; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #22c55e; letter-spacing: 8px; font-family: 'Courier New', monospace; }
          .info-box { background: #fff; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #FFF3CD; border: 1px solid #FFC107; padding: 15px; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌱 GreenGrow</h1>
            <h2>Mã xác thực đổi mật khẩu</h2>
          </div>
          <div class="content">
            <h3>Xin chào ${name}!</h3>
            <p>Bạn đang thực hiện thay đổi mật khẩu cho tài khoản GreenGrow của mình.</p>
            
            <div class="otp-box">
              <p style="margin: 0 0 10px 0; color: #666;">Mã xác thực của bạn là:</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Mã này có hiệu lực trong 10 phút</p>
            </div>

            <div class="info-box">
              <p><strong>⚠️ Lưu ý bảo mật:</strong></p>
              <ul>
                <li>Không chia sẻ mã này với bất kỳ ai</li>
                <li>Mã chỉ có hiệu lực trong 10 phút</li>
                <li>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này</li>
              </ul>
            </div>

            <div class="warning">
              <p><strong>🔒 Bảo mật tài khoản:</strong></p>
              <p>Nếu bạn không thực hiện yêu cầu đổi mật khẩu này, vui lòng:</p>
              <ul>
                <li>Kiểm tra hoạt động đăng nhập gần đây</li>
                <li>Đổi mật khẩu ngay lập tức nếu nghi ngờ</li>
                <li>Liên hệ với chúng tôi nếu cần hỗ trợ</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>© 2024 GreenGrow. Tất cả quyền được bảo lưu.</p>
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Text template cho password change OTP
   */
  getPasswordChangeOTPEmailText(name, otp) {
    return `
Xin chào ${name}!

Bạn đang thực hiện thay đổi mật khẩu cho tài khoản GreenGrow của mình.

Mã xác thực của bạn là: ${otp}
Mã này có hiệu lực trong 10 phút.

⚠️ LƯU Ý BẢO MẬT:
- Không chia sẻ mã này với bất kỳ ai
- Mã chỉ có hiệu lực trong 10 phút
- Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này

🔒 BẢO MẬT TÀI KHOẢN:
Nếu bạn không thực hiện yêu cầu đổi mật khẩu này, vui lòng:
- Kiểm tra hoạt động đăng nhập gần đây
- Đổi mật khẩu ngay lập tức nếu nghi ngờ
- Liên hệ với chúng tôi nếu cần hỗ trợ

© 2024 GreenGrow. Tất cả quyền được bảo lưu.
Email này được gửi tự động, vui lòng không trả lời.
    `;
  }

  /**
   * Text template cho password change notification
   */
  getPasswordChangeEmailText(name, timestamp, ipAddress, userAgent) {
    const deviceInfo = userAgent ? `Thiết bị: ${userAgent}\n` : '';
    const ipInfo = ipAddress ? `Địa chỉ IP: ${ipAddress}\n` : '';
    
    return `
Xin chào ${name}!

Mật khẩu tài khoản GreenGrow của bạn đã được thay đổi thành công.

Thông tin:
Thời gian: ${timestamp}
${ipInfo}${deviceInfo}

⚠️ LƯU Ý QUAN TRỌNG:
Nếu bạn không thực hiện thay đổi này, vui lòng:
- Đổi lại mật khẩu ngay lập tức
- Kiểm tra hoạt động đăng nhập gần đây
- Liên hệ với chúng tôi nếu bạn nghi ngờ có người khác truy cập tài khoản

Để bảo mật tài khoản của bạn, chúng tôi khuyến nghị:
- Sử dụng mật khẩu mạnh và duy nhất
- Không chia sẻ mật khẩu với người khác
- Đổi mật khẩu định kỳ

© 2024 GreenGrow. Tất cả quyền được bảo lưu.
Email này được gửi tự động, vui lòng không trả lời.
    `;
  }
}

// Export singleton instance
const emailService = new EmailService();
export default emailService;
