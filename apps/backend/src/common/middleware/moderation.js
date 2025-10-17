import { httpError } from '../utils/http.js';

/**
 * Agricultural-related keywords for content validation
 */
const AGRICULTURAL_KEYWORDS = [
  // Plants
  'cây', 'plant', 'cây trồng', 'thực vật', 'vegetable', 'fruit', 'herb',
  'cà chua', 'tomato', 'dưa hấu', 'watermelon', 'lúa', 'rice', 'ngô', 'corn',
  'khoai', 'potato', 'cà rốt', 'carrot', 'rau', 'vegetable', 'củ', 'root',
  
  // Diseases
  'bệnh', 'disease', 'sâu bệnh', 'pest', 'nấm', 'fungus', 'vi khuẩn', 'bacteria',
  'đốm lá', 'leaf spot', 'thán thư', 'anthracnose', 'sương mai', 'downy mildew',
  'rỉ sắt', 'rust', 'thối rễ', 'root rot', 'héo', 'wilt',
  
  // Care
  'chăm sóc', 'care', 'tưới nước', 'watering', 'bón phân', 'fertilizer',
  'đất', 'soil', 'ánh sáng', 'light', 'nhiệt độ', 'temperature',
  'cắt tỉa', 'pruning', 'thu hoạch', 'harvest', 'gieo hạt', 'planting',
  
  // Tools & Products
  'dụng cụ', 'tool', 'thuốc', 'pesticide', 'phân bón', 'fertilizer',
  'chậu', 'pot', 'đất trồng', 'potting soil', 'bình tưới', 'watering can',
  'kéo', 'scissors', 'xẻng', 'shovel', 'cuốc', 'hoe',
];

/**
 * Spam/invalid keywords to filter out
 */
const SPAM_KEYWORDS = [
  'spam', 'scam', 'fake', 'giả', 'lừa đảo', 'tiền', 'money',
  'cá độ', 'gambling', 'cờ bạc', 'sex', 'porn', 'xxx',
  'hack', 'crack', 'virus', 'malware', 'phishing',
];

/**
 * Validate text content for agricultural relevance
 * @param {string} text - Text to validate
 * @returns {object} Validation result
 */
const validateTextContent = (text) => {
  if (!text || typeof text !== 'string') {
    return { isValid: false, reason: 'Invalid text content' };
  }

  const textLower = text.toLowerCase().trim();
  
  // Check minimum length
  if (textLower.length < 3) {
    return { isValid: false, reason: 'Text too short' };
  }

  // Check maximum length
  if (textLower.length > 4000) {
    return { isValid: false, reason: 'Text too long' };
  }

  // Check for spam keywords
  const hasSpamKeywords = SPAM_KEYWORDS.some(keyword => 
    textLower.includes(keyword.toLowerCase())
  );
  
  if (hasSpamKeywords) {
    return { isValid: false, reason: 'Content contains spam keywords' };
  }

  // Check for agricultural relevance
  const hasAgriculturalKeywords = AGRICULTURAL_KEYWORDS.some(keyword => 
    textLower.includes(keyword.toLowerCase())
  );

  // Allow general questions even without specific agricultural keywords
  const generalQuestionKeywords = [
    'hỏi', 'ask', 'câu hỏi', 'question', 'giúp', 'help', 'tư vấn', 'advice',
    'làm sao', 'how', 'tại sao', 'why', 'khi nào', 'when', 'ở đâu', 'where',
    'cách', 'method', 'phương pháp', 'kỹ thuật', 'technique'
  ];

  const hasGeneralKeywords = generalQuestionKeywords.some(keyword => 
    textLower.includes(keyword.toLowerCase())
  );

  if (!hasAgriculturalKeywords && !hasGeneralKeywords) {
    return { 
      isValid: false, 
      reason: 'Content not related to agriculture or gardening' 
    };
  }

  return { isValid: true, reason: 'Valid agricultural content' };
};

/**
 * Validate image file for agricultural content
 * @param {object} file - File object
 * @returns {object} Validation result
 */
const validateImageFile = (file) => {
  if (!file) {
    return { isValid: false, reason: 'No file provided' };
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.mimetype)) {
    return { isValid: false, reason: 'Invalid file type. Only JPG, PNG, WebP allowed' };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { isValid: false, reason: 'File too large. Maximum 10MB allowed' };
  }

  // Check minimum file size (min 1KB)
  const minSize = 1024; // 1KB
  if (file.size < minSize) {
    return { isValid: false, reason: 'File too small. Minimum 1KB required' };
  }

  return { isValid: true, reason: 'Valid image file' };
};

/**
 * Middleware to validate text content
 */
export const validateTextModeration = (req, res, next) => {
  try {
    const { message, content } = req.body;
    const textToValidate = message || content;

    if (!textToValidate) {
      return next(); // Skip if no text content
    }

    const validation = validateTextContent(textToValidate);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.reason,
        code: 'CONTENT_MODERATION_FAILED',
      });
    }

    // Add validation info to request
    req.moderation = {
      textValidated: true,
      validationResult: validation,
    };

    next();
  } catch (error) {
    console.error('Text moderation error:', error);
    next(); // Continue on moderation errors
  }
};

/**
 * Middleware to validate image content
 */
export const validateImageModeration = (req, res, next) => {
  try {
    if (!req.file && !req.files) {
      return next(); // Skip if no file
    }

    const file = req.file || (req.files && req.files[0]);
    const validation = validateImageFile(file);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.reason,
        code: 'IMAGE_MODERATION_FAILED',
      });
    }

    // Add validation info to request
    req.moderation = {
      ...req.moderation,
      imageValidated: true,
      imageValidationResult: validation,
    };

    next();
  } catch (error) {
    console.error('Image moderation error:', error);
    next(); // Continue on moderation errors
  }
};

/**
 * Combined moderation middleware for chat messages
 */
export const chatModeration = (req, res, next) => {
  try {
    const { message, attachments } = req.body;

    // Validate text message
    if (message) {
      const textValidation = validateTextContent(message);
      if (!textValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: textValidation.reason,
          code: 'CHAT_MODERATION_FAILED',
        });
      }
    }

    // Validate attachments if any
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        if (attachment.mimeType && !attachment.mimeType.startsWith('image/')) {
          return res.status(400).json({
            success: false,
            message: 'Only image attachments are allowed',
            code: 'INVALID_ATTACHMENT_TYPE',
          });
        }
      }
    }

    // Add moderation info
    req.moderation = {
      chatValidated: true,
      textValid: !!message,
      hasAttachments: !!(attachments && attachments.length > 0),
    };

    next();
  } catch (error) {
    console.error('Chat moderation error:', error);
    next(); // Continue on moderation errors
  }
};

/**
 * Rate limiting for moderation (prevent spam)
 */
export const moderationRateLimit = (req, res, next) => {
  // Simple in-memory rate limiting (in production, use Redis)
  const userKey = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 10; // Max 10 requests per minute

  if (!global.moderationRateLimit) {
    global.moderationRateLimit = new Map();
  }

  const userRequests = global.moderationRateLimit.get(userKey) || [];
  const recentRequests = userRequests.filter(time => now - time < windowMs);

  if (recentRequests.length >= maxRequests) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  }

  recentRequests.push(now);
  global.moderationRateLimit.set(userKey, recentRequests);

  next();
};

export default {
  validateTextModeration,
  validateImageModeration,
  chatModeration,
  moderationRateLimit,
};
