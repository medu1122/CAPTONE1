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
      // Comment moderation: ONLY check for offensive language
      systemPrompt = `Bạn là HỆ THỐNG KIỂM DUYỆT BÌNH LUẬN đơn giản.

⚠️ QUAN TRỌNG: CHỈ kiểm duyệt bình luận, KHÔNG trả lời câu hỏi hay tư vấn.

🚫 CHỈ CHẶN 2 TRƯỜNG HỢP SAU:
1. **Từ ngữ công kích, xúc phạm**: "ngu", "dốt", "đần", "độn", "ngu dốt", "đần độn", "khùng", "điên", "chó", "lợn", "súc vật", "đồ ngu", "thằng ngu", "con chó", "đồ khùng", "mất dạy", "vô học"
2. **Từ tục tĩu**: Các từ ngữ tục tĩu, chửi thề, khiêu dâm

✅ TẤT CẢ CÁC TRƯỜNG HỢP KHÁC ĐỀU ĐƯỢC CHẤP NHẬN:
- Bình luận ngắn, dài, bất kỳ độ dài nào → OK
- Bất kỳ nội dung nào (nông nghiệp, không liên quan, spam nhẹ) → OK  
- Bất kỳ ngôn ngữ nào (địa phương, viết tắt, tiếng lóng) → OK
- "Hi", "Ok", "👍", "Cảm ơn", bất kỳ từ ngắn nào → OK
- Link, quảng cáo nhẹ → OK (chỉ chặn nếu có từ xúc phạm)

⚠️ QUY TẮC TUYỆT ĐỐI:
- CHỈ từ chối nếu có TỪ XÚC PHẠM/TỤC TĨU trong danh sách trên
- MỌI thứ khác → approved: true`;
    } else {
      // Post moderation: Only check offensive language and very short content
      systemPrompt = `Bạn là HỆ THỐNG KIỂM DUYỆT BÀI ĐĂNG đơn giản.

⚠️ QUAN TRỌNG: CHỈ kiểm duyệt bài đăng, KHÔNG trả lời câu hỏi hay tư vấn.

🚫 CHỈ CHẶN 3 TRƯỜNG HỢP SAU:
1. **Từ ngữ công kích, xúc phạm**: "ngu", "dốt", "đần", "độn", "ngu dốt", "đần độn", "khùng", "điên", "chó", "lợn", "súc vật", "đồ ngu", "thằng ngu", "con chó", "đồ khùng", "mất dạy", "vô học"
2. **Từ tục tĩu**: Các từ ngữ tục tĩu, chửi thề, khiêu dâm
3. **Bài đăng quá ngắn**: Title + Content cộng lại chỉ có 1-2 ký tự (ví dụ: "a", "ab", "1", "12")

✅ TẤT CẢ CÁC TRƯỜNG HỢP KHÁC ĐỀU ĐƯỢC CHẤP NHẬN:
- Bất kỳ nội dung nào (nông nghiệp, game, phim, thể thao, giải trí, bất kỳ chủ đề gì) → OK
- Bất kỳ độ dài nào (từ 3 ký tự trở lên) → OK
- Bất kỳ ngôn ngữ nào (địa phương, viết tắt, tiếng lóng, emoji) → OK
- Link, quảng cáo, spam → OK (chỉ chặn nếu có từ xúc phạm)
- Nội dung không liên quan đến nông nghiệp → OK
- "Hi", "Ok", "👍", "abc", bất kỳ từ 3 ký tự trở lên → OK

⚠️ QUY TẮC TUYỆT ĐỐI:
- CHỈ từ chối nếu: (1) có TỪ XÚC PHẠM/TỤC TĨU trong danh sách, HOẶC (2) tổng độ dài title + content ≤ 2 ký tự
- MỌI thứ khác → approved: true`;
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

📝 QUY TẮC TẠO "suggestedContent":
- CHỈ loại bỏ/thay thế phần VÀN VẤN ĐỀ (từ xúc phạm, spam, link)
- GIỮ NGUYÊN ý nghĩa và nội dung CHÍNH của bài viết/bình luận
- GIỮ NGUYÊN phong cách thân thiện (ae, bạn, mọi người)
- KHÔNG thêm thông tin mới, KHÔNG thay đổi ý nghĩa
- KHÔNG thêm lời chào dài dòng, chỉ cần sửa phần có vấn đề
- suggestedContent phải HOÀN TOÀN sạch sẽ, không chứa bất kỳ từ ngữ không phù hợp nào
- Nếu KHÔNG thể sửa được (quá nhiều vấn đề), đặt "suggestedContent": null

VÍ DỤ CHO ${type === 'comment' ? 'BÌNH LUẬN' : 'BÀI ĐĂNG'}:`;

    // Add examples based on type
    if (type === 'comment') {
      systemPrompt += `
Input: "Thằng ngu, cây này trồng thế nào?"
Output: {"approved": false, "reason": "Bình luận chứa từ ngữ xúc phạm", "issues": [{"type": "offensive_language", "severity": "high", "location": "từ 'Thằng ngu'", "suggestion": "Loại bỏ từ xúc phạm"}], "suggestedContent": "Cây này trồng thế nào?"}

Input: "Đồ khùng à, tôi hỏi cách chăm sóc cây lúa đây"
Output: {"approved": false, "reason": "Bình luận chứa từ ngữ xúc phạm", "issues": [{"type": "offensive_language", "severity": "high", "location": "từ 'Đồ khùng'", "suggestion": "Loại bỏ từ xúc phạm"}], "suggestedContent": "Tôi hỏi cách chăm sóc cây lúa đây"}

Input: "Ok"
Output: {"approved": true, "reason": "Nội dung phù hợp", "issues": [], "suggestedContent": null}

Input: "Hi"
Output: {"approved": true, "reason": "Nội dung phù hợp", "issues": [], "suggestedContent": null}

Input: "Xem phim chưa?"
Output: {"approved": true, "reason": "Nội dung phù hợp", "issues": [], "suggestedContent": null}

Input: "Link mua hàng: https://example.com"
Output: {"approved": true, "reason": "Nội dung phù hợp", "issues": [], "suggestedContent": null}

Input: "Cây lúa bị bệnh đốm lá, ai biết cách chữa không?"
Output: {"approved": true, "reason": "Nội dung phù hợp", "issues": [], "suggestedContent": null}`;
    } else {
      systemPrompt += `
Input: Title: "Thằng ngu", Content: "Cách trồng lúa đúng như thế nào ae?"
Output: {"approved": false, "reason": "Tiêu đề chứa từ ngữ xúc phạm", "issues": [{"type": "offensive_language", "severity": "high", "location": "tiêu đề", "suggestion": "Đổi tiêu đề phù hợp"}], "suggestedContent": "Hỏi về cách trồng lúa\n\nCách trồng lúa đúng như thế nào ae?"}

Input: Title: "Hỏi về cây", Content: "Đồ khùng, ai biết cách trồng cây này không?"
Output: {"approved": false, "reason": "Nội dung chứa từ ngữ xúc phạm", "issues": [{"type": "offensive_language", "severity": "high", "location": "từ 'Đồ khùng'", "suggestion": "Loại bỏ từ xúc phạm"}], "suggestedContent": "Hỏi về cây\n\nAi biết cách trồng cây này không?"}

Input: Title: "a", Content: "b"
Output: {"approved": false, "reason": "Nội dung quá ngắn (chỉ có 2 ký tự)", "issues": [{"type": "inappropriate", "severity": "medium", "location": "toàn bộ", "suggestion": "Vui lòng viết ít nhất 3 ký tự"}], "suggestedContent": null}

Input: Title: "hi", Content: ""
Output: {"approved": false, "reason": "Nội dung quá ngắn (chỉ có 2 ký tự)", "issues": [{"type": "inappropriate", "severity": "medium", "location": "toàn bộ", "suggestion": "Vui lòng viết ít nhất 3 ký tự"}], "suggestedContent": null}

Input: Title: "abc", Content: "Bất kỳ nội dung gì"
Output: {"approved": true, "reason": "Nội dung phù hợp", "issues": [], "suggestedContent": null}

Input: Title: "Xem phim Marvel", Content: "Ai xem phim mới chưa?"
Output: {"approved": true, "reason": "Nội dung phù hợp", "issues": [], "suggestedContent": null}

Input: Title: "Mua bán", Content: "Link: https://example.com, giá rẻ, khuyến mãi"
Output: {"approved": true, "reason": "Nội dung phù hợp", "issues": [], "suggestedContent": null}

Input: Title: "cách trồng lúa sao vậy ae", Content: "Ai biết chỉ tôi với"
Output: {"approved": true, "reason": "Nội dung phù hợp", "issues": [], "suggestedContent": null}

Input: Title: "cây của tôi", Content: "cây này đẹp quá"
Output: {"approved": true, "reason": "Nội dung phù hợp", "issues": [], "suggestedContent": null}`;
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
 * @param {boolean} params.skipSuggestedValidation - Skip validation of suggestedContent (to prevent infinite recursion)
 * @returns {Promise<object>} Moderation result
 */
export const moderateContent = async ({ content, type = 'post', skipSuggestedValidation = false }) => {
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
      // Fallback: simple keyword check for offensive language
      const hasOffensiveKeywords = /\b(ngu|dốt|đần|độn|ngu dốt|đần độn|khùng|điên|chó|lợn|súc vật|đồ ngu|thằng ngu|con chó|đồ khùng|mất dạy|vô học)\b/i.test(content);
      
      if (type === 'comment') {
        // For comments: ONLY check offensive language
        moderationResult = {
          approved: !hasOffensiveKeywords,
          reason: hasOffensiveKeywords 
            ? 'Nội dung chứa từ ngữ xúc phạm'
            : 'Nội dung phù hợp',
          issues: hasOffensiveKeywords ? [{
            type: 'offensive_language',
            severity: 'high',
            location: 'toàn bộ nội dung',
            suggestion: 'Vui lòng loại bỏ từ ngữ xúc phạm'
          }] : [],
          suggestedContent: null
        };
      } else {
        // For posts: check offensive language AND very short content (1-2 chars)
        const isTooShort = content.trim().length <= 2;
        
        moderationResult = {
          approved: !hasOffensiveKeywords && !isTooShort,
          reason: hasOffensiveKeywords 
            ? 'Nội dung chứa từ ngữ xúc phạm'
            : isTooShort
            ? 'Nội dung quá ngắn (chỉ có 1-2 ký tự)'
            : 'Nội dung phù hợp',
          issues: hasOffensiveKeywords ? [{
            type: 'offensive_language',
            severity: 'high',
            location: 'toàn bộ nội dung',
            suggestion: 'Vui lòng loại bỏ từ ngữ xúc phạm'
          }] : isTooShort ? [{
            type: 'inappropriate',
            severity: 'medium',
            location: 'toàn bộ nội dung',
            suggestion: 'Vui lòng viết ít nhất 3 ký tự'
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
      
      // Validate suggestedContent before returning it to user (only if not already validating)
      if (!skipSuggestedValidation && moderationResult.suggestedContent && moderationResult.suggestedContent.trim()) {
        console.log(`   🔍 Validating suggested content...`);
        try {
          // Recursively check if suggestedContent is also appropriate (with flag to prevent infinite recursion)
          const suggestedValidation = await moderateContent({ 
            content: moderationResult.suggestedContent, 
            type,
            skipSuggestedValidation: true // Prevent infinite recursion
          });
          
          if (!suggestedValidation.approved) {
            console.warn(`   ⚠️ Suggested content also failed moderation, removing it`);
            moderationResult.suggestedContent = null;
          } else {
            console.log(`   ✅ Suggested content is clean and approved`);
          }
        } catch (error) {
          console.warn(`   ⚠️ Failed to validate suggested content:`, error.message);
          moderationResult.suggestedContent = null;
        }
      }
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

