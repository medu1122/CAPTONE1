import axios from 'axios';
import { httpError } from '../utils/http.js';

/**
 * SMS Service using eSMS.vn API
 * Documentation: https://developers.esms.vn
 */
class SMSService {
  constructor() {
    this.apiBaseUrl = process.env.ESMS_API_BASE_URL || 'https://rest.esms.vn/MainService.svc/json';
    this.apiKey = process.env.ESMS_API_KEY;
    this.secretKey = process.env.ESMS_SECRET_KEY;
    // Only set brandname if explicitly configured in .env
    // If not set, will use long code (default sender number)
    this.brandname = process.env.ESMS_BRANDNAME || null;
    this.sandbox = process.env.ESMS_SANDBOX === 'true';
  }

  /**
   * Normalize phone number to Vietnamese format
   * @param {string} phone - Phone number
   * @returns {string} Normalized phone (e.g., "0912345678")
   */
  normalizePhone(phone) {
    if (!phone) return null;
    
    // Remove spaces, dashes, parentheses
    let normalized = phone.replace(/[\s\-\(\)]/g, '');
    
    // Convert +84 to 0
    if (normalized.startsWith('+84')) {
      normalized = '0' + normalized.substring(3);
    }
    
    // Remove leading 84 and add 0
    if (normalized.startsWith('84') && normalized.length === 11) {
      normalized = '0' + normalized.substring(2);
    }
    
    // Ensure starts with 0
    if (!normalized.startsWith('0')) {
      normalized = '0' + normalized;
    }
    
    // Validate Vietnamese phone format (10 digits starting with 0)
    if (!/^0[3|5|7|8|9][0-9]{8}$/.test(normalized)) {
      throw httpError(400, `Invalid Vietnamese phone number: ${phone}`);
    }
    
    return normalized;
  }

  /**
   * Get error message by error code according to eSMS.vn documentation
   * @param {string} errorCode - Error code from API
   * @returns {string} Error message
   */
  getErrorMessage(errorCode) {
    const errorMessages = {
      '100': 'Request hợp lệ',
      '101': 'Sai thông tin ApiKey/SecretKey',
      '104': 'Brandname truyền chưa đúng hoặc chưa được active',
      '124': 'RequestId đã tồn tại',
      '146': 'Template CSKH chưa được đăng ký',
      '99': 'Kiểm tra lại thông tin kết nối hoặc liên hệ bộ phận chăm sóc khách hàng',
    };
    return errorMessages[errorCode] || `Lỗi không xác định (Code: ${errorCode})`;
  }

  /**
   * Get account balance
   * @returns {Promise<object>} Balance information
   */
  async getBalance() {
    try {
      if (!this.apiKey || !this.secretKey) {
        throw httpError(500, 'SMS service not configured. Please set ESMS_API_KEY and ESMS_SECRET_KEY in .env');
      }

      const response = await axios.post(
        `${this.apiBaseUrl}/GetBalance_json`,
        {
          ApiKey: this.apiKey,
          SecretKey: this.secretKey,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.CodeResponse === '100') {
        return {
          success: true,
          balance: response.data.Balance,
          userId: response.data.UserID,
        };
      } else {
        throw new Error(response.data.ErrorMessage || 'Failed to get balance');
      }
    } catch (error) {
      console.error('❌ Failed to get eSMS balance:', error.message);
      if (error.statusCode) throw error;
      throw httpError(500, `Failed to get balance: ${error.message}`);
    }
  }

  /**
   * Send SMS
   * @param {string} phone - Phone number
   * @param {string} message - SMS message
   * @param {object} options - Additional options
   * @returns {Promise<object>} Send result
   */
  async send(phone, message, options = {}) {
    try {
      if (!this.apiKey || !this.secretKey) {
        throw httpError(500, 'SMS service not configured. Please set ESMS_API_KEY and ESMS_SECRET_KEY in .env');
      }

      // Normalize phone number
      const normalizedPhone = this.normalizePhone(phone);
      
      // Validate message length (SMS max 160 chars for single message)
      if (!message || message.trim().length === 0) {
        throw httpError(400, 'Message cannot be empty');
      }

      // Prepare request body according to eSMS.vn documentation
      // Documentation: https://developers.esms.vn/esms-api/ham-gui-tin/tin-nhan-sms-otp-cskh
      const requestBody = {
        ApiKey: this.apiKey,
        SecretKey: this.secretKey,
        Phone: normalizedPhone,
        Content: message,
        SmsType: String(options.smsType || 2), // "2" = CSKH (Customer Care)
        IsUnicode: message.match(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i) ? "1" : "0", // Auto-detect Unicode
      };

      // Only add Brandname if it's explicitly configured in .env
      // If no Brandname, API will use long code (default sender number)
      const hasBrandname = this.brandname && this.brandname.trim() !== '';
      
      if (hasBrandname) {
        requestBody.Brandname = this.brandname;
        console.log(`📱 [eSMS] Using Brandname: ${this.brandname}`);
      } else {
        console.log(`📱 [eSMS] No Brandname configured - will use long code (default sender)`);
      }

      // Add Sandbox mode if explicitly enabled (for testing)
      if (this.sandbox || options.sandbox) {
        requestBody.Sandbox = "1"; // Use sandbox mode for testing (no real SMS sent, no charge)
        console.log(`⚠️ [eSMS] Using Sandbox mode (no real SMS will be sent)`);
      }

      // Generate unique RequestId to prevent duplicate requests
      if (!options.requestId) {
        requestBody.RequestId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      } else {
        requestBody.RequestId = options.requestId;
      }

      console.log(`📤 [eSMS] Sending SMS to ${normalizedPhone}...`);
      console.log(`📤 [eSMS] Request body:`, JSON.stringify(requestBody, null, 2));

      // According to eSMS.vn documentation, the correct endpoint is:
      // POST https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/
      // Content-Type: application/json
      try {
        const functionName = 'SendMultipleMessage_V4_post_json';
        console.log(`📤 [eSMS] Using official endpoint: ${functionName}`);
        
        const response = await axios.post(
          `${this.apiBaseUrl}/${functionName}/`, // Note: trailing slash as per documentation
          requestBody,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        console.log(`📥 [eSMS] Response:`, JSON.stringify(response.data, null, 2));

        // Check response according to documentation
        // CodeResult "100" = Request hợp lệ (success)
        if (response.data.CodeResult === '100') {
          console.log(`✅ [eSMS] SMS sent successfully. SMSID: ${response.data.SMSID}`);
          return {
            success: true,
            phone: normalizedPhone,
            messageId: response.data.SMSID || 'unknown',
            codeResult: response.data.CodeResult,
          };
        } else {
          // Handle error codes according to documentation
          const errorCode = response.data.CodeResult;
          const errorMessage = response.data.ErrorMessage || this.getErrorMessage(errorCode);
          console.error(`❌ [eSMS] SMS send failed. Code: ${errorCode}, Message: ${errorMessage}`);
          
          // Special handling for Brandname error
          if (errorCode === '104') {
            const detailedMessage = `Brandname is required. ${errorMessage}. ` +
              `Please either: 1) Register a Brandname with eSMS.vn, ` +
              `2) Contact eSMS.vn (0901.888.484) for a test Brandname, ` +
              `or 3) Use Sandbox mode (ESMS_SANDBOX=true) for testing.`;
            throw new Error(detailedMessage);
          }
          
          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error('❌ [eSMS] SMS sending error:', error.message);
        if (error.response) {
          console.error('❌ [eSMS] Response status:', error.response.status);
          console.error('❌ [eSMS] Response data:', JSON.stringify(error.response.data, null, 2));
        }
        if (error.statusCode) throw error;
        if (error.response?.data) {
          const errorMsg = error.response.data.ErrorMessage || error.response.data.message || error.message;
          throw httpError(500, `SMS sending failed: ${errorMsg}`);
        }
        throw httpError(500, `SMS sending failed: ${error.message}`);
      }


      // If all functions failed
      if (lastError) {
        throw lastError;
      }

      // This should never be reached, but just in case
      throw new Error('All SMS API functions failed');
    } catch (error) {
      console.error('❌ [eSMS] SMS sending error:', error.message);
      if (error.response) {
        console.error('❌ [eSMS] Response status:', error.response.status);
        console.error('❌ [eSMS] Response data:', JSON.stringify(error.response.data, null, 2));
      }
      if (error.statusCode) throw error;
      if (error.response?.data) {
        const errorMsg = error.response.data.ErrorMessage || error.response.data.message || error.message;
        throw httpError(500, `SMS sending failed: ${errorMsg}`);
      }
      throw httpError(500, `SMS sending failed: ${error.message}`);
    }
  }

  /**
   * Send OTP for phone verification
   * @param {string} phone - Phone number
   * @param {string} otp - OTP code (6 digits)
   * @returns {Promise<object>} Send result
   */
  async sendOTP(phone, otp) {
    const message = `🌱 GreenGrow - Ma xac thuc cua ban la: ${otp}. Ma co hieu luc trong 10 phut. Khong chia se ma nay voi ai.`;
    return await this.send(phone, message, { smsType: 2 });
  }
}

// Export singleton instance
const smsService = new SMSService();
export default smsService;

