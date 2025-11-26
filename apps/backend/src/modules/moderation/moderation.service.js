import axios from 'axios';
import { httpError } from '../../common/utils/http.js';

/**
 * Content Moderation Service
 * Uses OpenAI API directly with dedicated moderation prompt
 * Separate from chatbot AI to ensure focused moderation logic
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Call OpenAI API directly for content moderation
 * @param {string} content - Content to moderate
 * @param {string} type - Type of content: 'post' or 'comment'
 * @returns {Promise<object>} Moderation result
 */
const callOpenAIForModeration = async (content, type = 'post') => {
  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Build different prompts for posts vs comments
    let systemPrompt;
    
    if (type === 'comment') {
      // Comment moderation: ONLY check for offensive language, ignore length/spam
      systemPrompt = `Bạn là HỆ THỐNG KIỂM DUYỆT BÌNH LUẬN chuyên dụng cho cộng đồng nông nghiệp GreenGrow.

⚠️ QUAN TRỌNG: Đây là hệ thống moderation riêng biệt, KHÔNG phải chatbot AI. Bạn CHỈ có nhiệm vụ kiểm duyệt bình luận, KHÔNG trả lời câu hỏi hay tư vấn nông nghiệp.

MỤC TIÊU DUY NHẤT: Kiểm tra xem bình luận có chứa từ ngữ TỤC TĨU, XÚC PHẠM hay không.

🚫 CHỈ CHẶN CÁC HÀNH VI SAU:
1. **Xúc phạm, lăng mạ**: Từ ngữ thô tục, chửi bới, xúc phạm người khác (ví dụ: "đồ ngu", "thằng ngu", "con chó", "đồ khùng", "điên", "ngu xuẩn", "dốt"...)
2. **Phân biệt đối xử**: Phân biệt giới tính, dân tộc, tôn giáo, vùng miền
3. **Phá hoại**: Cố ý gây rối, tấn công cá nhân, đe dọa
4. **Bạo lực, khiêu dâm**: Nội dung bạo lực hoặc khiêu dâm

✅ CÁC TRƯỜNG HỢP ĐƯỢC CHẤP NHẬN:
- Bình luận NGẮN hoặc DÀI đều được, KHÔNG quan trọng độ dài
- "Ok", "Cảm ơn", "Hay quá", "Đúng rồi" → ĐƯỢC CHẤP NHẬN (ngắn nhưng không xúc phạm)
- "Hi", "Hello", "👍" → ĐƯỢC CHẤP NHẬN (ngắn nhưng không xúc phạm)
- Câu hỏi ngắn: "Cây này là gì?", "Cách chữa?" → ĐƯỢC CHẤP NHẬN
- Bình luận dài về nông nghiệp → ĐƯỢC CHẤP NHẬN
- Spam nhẹ (nhưng không xúc phạm) → CÓ THỂ CHẤP NHẬN (chỉ từ chối nếu spam nặng + quảng cáo rõ ràng)

⚠️ QUY TẮC ĐẶC BIỆT CHO BÌNH LUẬN:
- KHÔNG từ chối vì nội dung quá ngắn
- KHÔNG từ chối vì không liên quan đến nông nghiệp (bình luận có thể là giao tiếp xã hội)
- CHỈ từ chối nếu có từ ngữ TỤC TĨU, XÚC PHẠM, hoặc nội dung BẠO LỰC/KHIÊU DÂM
- Spam quảng cáo rõ ràng (link mua bán, quảng cáo sản phẩm) → Từ chối
- Spam nhẹ (emoji, ký tự lặp lại) → Có thể chấp nhận nếu không xúc phạm`;
    } else {
      // Post moderation: Full check including length, spam, relevance
      systemPrompt = `Bạn là HỆ THỐNG KIỂM DUYỆT BÀI ĐĂNG chuyên dụng cho cộng đồng nông nghiệp GreenGrow.

⚠️ QUAN TRỌNG: Đây là hệ thống moderation riêng biệt, KHÔNG phải chatbot AI. Bạn CHỈ có nhiệm vụ kiểm duyệt bài đăng, KHÔNG trả lời câu hỏi hay tư vấn nông nghiệp.

MỤC TIÊU DUY NHẤT: Kiểm tra xem bài đăng có phù hợp với cộng đồng nông nghiệp hay không, và đưa ra phản hồi chi tiết nếu không phù hợp.

🚫 CÁC HÀNH VI CẦN CHẶN:
1. **Xúc phạm, lăng mạ**: Từ ngữ thô tục, chửi bới, xúc phạm người khác
2. **Phân biệt đối xử**: Phân biệt giới tính, dân tộc, tôn giáo, vùng miền
3. **Spam**: Quảng cáo, link spam, nội dung không liên quan
4. **Phá hoại**: Cố ý gây rối, tấn công cá nhân, đe dọa
5. **Nội dung không phù hợp**: Bạo lực, khiêu dâm, chính trị nhạy cảm
6. **Nội dung quá ngắn/không có giá trị**: Bài đăng quá ngắn, không cung cấp thông tin hữu ích

✅ NỘI DUNG PHÙ HỢP:
- Câu hỏi về nông nghiệp, cây trồng, bệnh cây
- Chia sẻ kinh nghiệm, mẹo hay
- Thảo luận về kỹ thuật trồng trọt
- Hỏi đáp về thuốc, phân bón
- Nội dung liên quan đến nông nghiệp`;
    }
    
    // Common format and rules
    const commonRules = `

📋 FORMAT RESPONSE (JSON ONLY - NO MARKDOWN, NO CODE BLOCKS):
{
  "approved": true/false,
  "reason": "Lý do phê duyệt/từ chối",
  "issues": [
    {
      "type": "offensive_language" | "spam" | "discrimination" | "harassment" | "inappropriate",
      "severity": "low" | "medium" | "high",
      "location": "Vị trí trong nội dung (ví dụ: 'từ thứ 5-10', 'dòng 2')",
      "suggestion": "Gợi ý sửa đổi cụ thể"
    }
  ],
  "suggestedContent": "Nội dung đã được đề xuất sửa đổi (nếu có, null nếu không cần)"
}

⚠️ QUAN TRỌNG - QUY TẮC KIỂM DUYỆT:
- Trả về CHỈ JSON, không có markdown, không có code blocks
- KHÔNG trả lời câu hỏi, KHÔNG tư vấn, CHỈ kiểm duyệt nội dung
- Nếu nội dung PHÙ HỢP → approved: true, reason: "Nội dung phù hợp với cộng đồng"
- Nếu nội dung KHÔNG PHÙ HỢP → approved: false, reason: "Lý do cụ thể", issues: [...]
- Luôn đưa ra gợi ý sửa đổi cụ thể trong "suggestion"
- Nếu có thể, cung cấp "suggestedContent" với nội dung đã được sửa đổi

VÍ DỤ CHO ${type === 'comment' ? 'BÌNH LUẬN' : 'BÀI ĐĂNG'}:`;

    // Add examples based on type
    if (type === 'comment') {
      systemPrompt += `
Input: "Đồ ngu, cây này trồng như thế nào?"
Output: {"approved": false, "reason": "Nội dung chứa từ ngữ xúc phạm", "issues": [{"type": "offensive_language", "severity": "high", "location": "từ 'Đồ ngu'", "suggestion": "Thay thế bằng: 'Xin chào, cây này trồng như thế nào?'"}], "suggestedContent": "Xin chào, cây này trồng như thế nào?"}

Input: "Ok"
Output: {"approved": true, "reason": "Nội dung phù hợp", "issues": [], "suggestedContent": null}

Input: "Hi"
Output: {"approved": true, "reason": "Nội dung phù hợp", "issues": [], "suggestedContent": null}

Input: "Cảm ơn bạn"
Output: {"approved": true, "reason": "Nội dung phù hợp", "issues": [], "suggestedContent": null}

Input: "Cây lúa bị bệnh đốm lá, ai biết cách chữa không?"
Output: {"approved": true, "reason": "Nội dung phù hợp với cộng đồng nông nghiệp", "issues": [], "suggestedContent": null}`;
    } else {
      systemPrompt += `
Input: "Đồ ngu, cây này trồng như thế nào?"
Output: {"approved": false, "reason": "Nội dung chứa từ ngữ xúc phạm", "issues": [{"type": "offensive_language", "severity": "high", "location": "từ 'Đồ ngu'", "suggestion": "Thay thế bằng: 'Xin chào, cây này trồng như thế nào?'"}], "suggestedContent": "Xin chào, cây này trồng như thế nào?"}

Input: "hi"
Output: {"approved": false, "reason": "Nội dung quá ngắn và không cung cấp thông tin hữu ích cho cộng đồng nông nghiệp", "issues": [{"type": "spam", "severity": "low", "location": "toàn bộ nội dung", "suggestion": "Cung cấp thêm thông tin hoặc câu hỏi liên quan đến nông nghiệp"}], "suggestedContent": "Xin chào, tôi muốn hỏi về kỹ thuật trồng cây nào đó."}

Input: "Cây lúa bị bệnh đốm lá, ai biết cách chữa không?"
Output: {"approved": true, "reason": "Nội dung phù hợp với cộng đồng nông nghiệp", "issues": [], "suggestedContent": null}`;
    }
    
    systemPrompt = systemPrompt + commonRules;

    const userMessage = `Kiểm tra nội dung sau (${type === 'post' ? 'bài đăng' : 'bình luận'}):

"${content}"

Trả về CHỈ JSON theo format đã định nghĩa. KHÔNG có markdown, KHÔNG có code blocks, CHỈ JSON thuần túy.`;

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4o-mini', // Use cheaper model for moderation
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.3, // Lower temperature for more consistent moderation
        max_tokens: 1000,
        response_format: { type: 'json_object' } // Force JSON response
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      }
    );

    const responseText = response.data.choices[0]?.message?.content || '';
    
    // Parse JSON response
    let moderationResult;
    try {
      moderationResult = JSON.parse(responseText);
    } catch (parseError) {
      console.warn('⚠️ [moderation] Failed to parse JSON, trying to extract...', parseError);
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        moderationResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in response');
      }
    }

    return moderationResult;

  } catch (error) {
    console.error('❌ [moderation] OpenAI API error:', error);
    throw error;
  }
};

/**
 * Check if content is appropriate
 * @param {object} params - Parameters
 * @param {string} params.content - Content to check (title + content for posts, or just content for comments)
 * @param {string} params.type - Type of content: 'post' or 'comment'
 * @returns {Promise<object>} Moderation result
 */
export const moderateContent = async ({ content, type = 'post' }) => {
  try {
    console.log(`🔍 [moderation] Checking ${type} content...`);
    console.log(`   Content preview: ${content.substring(0, 100)}...`);

    // Call OpenAI API directly for moderation (separate from chatbot)
    let moderationResult;
    try {
      moderationResult = await callOpenAIForModeration(content, type);
      console.log(`🤖 [moderation] OpenAI response received`);
    } catch (error) {
      console.warn('⚠️ [moderation] OpenAI API failed, using fallback:', error.message);
      // Fallback: check if response contains keywords
      const hasOffensiveKeywords = /đồ ngu|thằng ngu|con chó|đồ khùng|điên|ngu xuẩn|dốt/i.test(content);
      
      if (type === 'comment') {
        // For comments: ONLY check offensive language, ignore spam/length
        moderationResult = {
          approved: !hasOffensiveKeywords,
          reason: hasOffensiveKeywords 
            ? 'Nội dung chứa từ ngữ không phù hợp'
            : 'Nội dung phù hợp',
          issues: hasOffensiveKeywords ? [{
            type: 'offensive_language',
            severity: 'high',
            location: 'toàn bộ nội dung',
            suggestion: 'Vui lòng sử dụng ngôn từ lịch sự, tôn trọng'
          }] : [],
          suggestedContent: null
        };
      } else {
        // For posts: check both offensive language and spam
        const hasSpam = /http:\/\/|https:\/\/|www\.|mua ngay|giá rẻ|khuyến mãi|quảng cáo/i.test(content);
        
        moderationResult = {
          approved: !hasOffensiveKeywords && !hasSpam,
          reason: hasOffensiveKeywords 
            ? 'Nội dung chứa từ ngữ không phù hợp'
            : hasSpam
            ? 'Nội dung có dấu hiệu spam'
            : 'Nội dung phù hợp',
          issues: hasOffensiveKeywords ? [{
            type: 'offensive_language',
            severity: 'high',
            location: 'toàn bộ nội dung',
            suggestion: 'Vui lòng sử dụng ngôn từ lịch sự, tôn trọng'
          }] : [],
          suggestedContent: null
        };
      }
    }

    // Validate moderation result
    if (typeof moderationResult.approved !== 'boolean') {
      console.warn('⚠️ [moderation] Invalid moderation result, defaulting to approved');
      moderationResult = {
        approved: true,
        reason: 'Không thể kiểm tra, đã được phê duyệt tự động',
        issues: [],
        suggestedContent: null
      };
    }

    console.log(`✅ [moderation] Result: ${moderationResult.approved ? 'APPROVED' : 'REJECTED'}`);
    if (!moderationResult.approved && moderationResult.issues?.length > 0) {
      console.log(`   Issues found: ${moderationResult.issues.length}`);
      moderationResult.issues.forEach((issue, idx) => {
        console.log(`   ${idx + 1}. ${issue.type} (${issue.severity}): ${issue.suggestion}`);
      });
    }

    return moderationResult;

  } catch (error) {
    console.error('❌ [moderation] Error:', error);
    // On error, approve by default to avoid blocking legitimate content
    // But log the error for monitoring
    return {
      approved: true,
      reason: 'Lỗi hệ thống kiểm duyệt, đã được phê duyệt tự động',
      issues: [],
      suggestedContent: null,
      error: error.message
    };
  }
};

/**
 * Moderate post content (title + content)
 * @param {object} params - Parameters
 * @param {string} params.title - Post title
 * @param {string} params.content - Post content
 * @returns {Promise<object>} Moderation result
 */
export const moderatePost = async ({ title, content }) => {
  const fullContent = `${title}\n\n${content}`;
  return await moderateContent({ content: fullContent, type: 'post' });
};

/**
 * Moderate comment content
 * @param {object} params - Parameters
 * @param {string} params.content - Comment content
 * @returns {Promise<object>} Moderation result
 */
export const moderateComment = async ({ content }) => {
  return await moderateContent({ content, type: 'comment' });
};

