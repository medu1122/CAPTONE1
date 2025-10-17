import nodemailer from 'nodemailer';
import { httpError } from '../utils/http.js';

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
      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      const verificationUrl = `${appUrl}/verify-email?token=${token}&uid=${userId}`;

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
      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      const resetUrl = `${appUrl}/reset-password?token=${token}&uid=${userId}`;

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
}

// Export singleton instance
const emailService = new EmailService();
export default emailService;
