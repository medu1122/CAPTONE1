import { generateAIResponse } from '../aiAssistant/ai.service.js';
import { getWeatherData } from '../weather/weather.service.js';
import { httpError } from '../../common/utils/http.js';

/**
 * Simple Chat Service (No Image Analysis)
 * For Knowledge Page - Q&A chatbot
 */

/**
 * Process chat message (text-only, no image)
 * @param {object} params - Parameters
 * @param {string} params.message - User message
 * @param {string} params.userId - User ID (optional)
 * @param {string} params.sessionId - Session ID (optional, for chat history)
 * @param {object} params.context - Optional context (lastAnalysis, etc.)
 * @returns {Promise<object>} AI response
 */
export const chat = async ({ message, userId = null, sessionId = null, context = null }) => {
  try {
    console.log('💬 [chat] Processing message:', { 
      message: message.substring(0, 50), 
      userId: userId || 'null', 
      sessionId: sessionId || 'none',
      hasSessionId: !!sessionId,
      hasContext: !!context 
    });

    // 1. Load chat history for context (if sessionId is provided)
    let chatHistoryMessages = [];
    let contextPrompt = '';
    if (sessionId) {
      try {
        const { loadChatContextWithAnalysis, buildContextPromptFromHistory } = 
          await import('../chats/chat.service.js');
        
        const chatContext = await loadChatContextWithAnalysis({
          sessionId,
          userId,
          limit: 5  // Last 5 messages for better context focus
        });
        
        if (chatContext && chatContext.messages && chatContext.messages.length > 0) {
          chatHistoryMessages = chatContext.messages;
          
          // Build context prompt from history
          contextPrompt = buildContextPromptFromHistory({
            messages: chatContext.messages,
            session: chatContext.session
          });
          
          console.log('📚 [chat] Loaded chat history:', {
            messageCount: chatHistoryMessages.length,
            hasContextPrompt: !!contextPrompt
          });
        }
      } catch (error) {
        console.warn('⚠️ [chat] Failed to load chat history:', error.message);
        // Continue without history
      }
    }

    // 2. Get weather context (optional)
    let weatherContext = null;
    try {
      weatherContext = await getWeatherData({ cityName: 'Hanoi' });
    } catch (error) {
      console.warn('Failed to get weather context:', error.message);
    }

    // 3. Build messages array with chat history
    const messages = [];
    
    // Add recent chat history messages (last 5 for better context focus)
    // Limit to 5 to help GPT stay focused on recent conversation
    const recentHistory = chatHistoryMessages.slice(-5);
    
    // Add system prompt for conversation context understanding
    if (recentHistory && recentHistory.length > 0) {
      messages.push({
        role: 'system',
        content: `🎯 BẠN ĐANG TRONG MỘT CUỘC HỘI THOẠI LIÊN TỤC

Dưới đây là ${recentHistory.length} tin nhắn gần nhất. HÃY ĐỌC KỸ để hiểu CHÍNH XÁC chủ đề đang bàn luận.

⚠️ NGUYÊN TẮC BẮT BUỘC:

1️⃣ FOLLOW-UP QUESTIONS (Câu hỏi tiếp theo):
   Nếu user hỏi không có chủ đề rõ ràng:
   - "trồng như nào", "cách chăm sóc", "cần gì"...
   → XÁC ĐỊNH chủ đề từ tin nhắn trước và TRẢ LỜI VỀ CHỦ ĐỀ ĐÓ

2️⃣ PRONOUN REFERENCES (Đại từ chỉ định):
   Nếu user dùng đại từ:
   - "cây này", "cây đó", "nó", "loại này"...
   → THAY THẾ bằng chủ đề thực từ tin nhắn trước

3️⃣ VÍ DỤ CỤ THỂ:
   
   ❌ SAI:
   User: "cách chữa bệnh đạo ôn trên lúa?"
   Bot: [trả lời về lúa]
   User: "cây này trồng như nào"
   Bot: "Để trồng cây thành công..." ← CHUNG CHUNG, SAI!
   
   ✅ ĐÚNG:
   User: "cách chữa bệnh đạo ôn trên lúa?"
   Bot: [trả lời về lúa]
   User: "cây này trồng như nào"
   Bot: "Để trồng LÚA thành công..." ← CỤ THỂ, ĐÚNG!

4️⃣ CÁCH XÁC ĐỊNH CHỦ ĐỀ:
   - Đọc 2 tin nhắn gần nhất
   - Tìm tên cây/sản phẩm nông nghiệp được nhắc đến
   - Dùng chủ đề đó để trả lời câu hỏi follow-up

🚨 KHÔNG BAO GIỜ TRẢ LỜI CHUNG CHUNG KHI CÓ CHỦ ĐỀ CỤ THỂ TRONG LỊCH SỬ!`
      });
    }
    
    // Add context prompt from history if available
    if (contextPrompt) {
      messages.push({
        role: 'system',
        content: contextPrompt
      });
    }
    
    // Add history messages to context
    for (const histMsg of recentHistory) {
      messages.push({
        role: histMsg.role,
        content: histMsg.message
      });
    }
    
    // ✅ Detect if current message is a follow-up question
    const lowerMessage = message.toLowerCase().trim();
    const followUpPatterns = [
      /^cách\s+trồng/i,
      /^trồng\s+như\s+nào/i,
      /^trồng\s+thế\s+nào/i,
      /^cách\s+chăm\s+sóc/i,
      /^chăm\s+sóc\s+như\s+nào/i,
      /^chăm\s+sóc\s+thế\s+nào/i,
      /^cách\s+chữa/i,
      /^làm\s+sao\s+để/i,
      /^có\s+trồng\s+được\s+không/i,
      /^trồng\s+được\s+không/i,
      /^ở\s+đâu/i,
      /^như\s+thế\s+nào/i,
      /^thế\s+nào/i,
      /^cần\s+gì/i,
      /^cần\s+những\s+gì/i,
      /^khi\s+nào/i,
      /^mùa\s+nào/i,
      /^bao\s+lâu/i,
      /^mất\s+bao\s+lâu/i,
      /^giá\s+bao\s+nhiêu/i,
      /^phải\s+làm\s+gì/i,
      /^nên\s+làm\s+gì/i,
      /^có\s+nên/i,
      /^thì\s+sao/i,
      /^còn\s+gì/i,
    ];
    
    // ✅ Detect pronoun/demonstrative references (đại từ chỉ định)
    const pronounPatterns = [
      /cây\s+này/i,
      /cây\s+đó/i,
      /cây\s+kia/i,
      /loại\s+này/i,
      /loại\s+đó/i,
      /giống\s+này/i,
      /giống\s+đó/i,
      /^nó\s+/i,
      /^nó$/i,
      /^đó\s+/i,
      /^này\s+/i,
      /thằng\s+này/i,
      /con\s+này/i,
      /món\s+này/i,
    ];
    
    const hasPronoun = pronounPatterns.some(pattern => pattern.test(lowerMessage));
    const isFollowUp = followUpPatterns.some(pattern => pattern.test(lowerMessage)) || hasPronoun;
    
    // Extract mentioned topics from recent history (look at last 2 messages for most relevant context)
    let mentionedTopics = [];
    if (recentHistory.length > 0) {
      // Prioritize the most recent messages (last 2)
      const recentMessagesText = recentHistory
        .slice(-2)
        .map(m => m.message)
        .join(' ')
        .toLowerCase();
      
      const allHistoryText = recentHistory.map(m => m.message).join(' ').toLowerCase();
      
      // Extended plant keywords
      const plantKeywords = [
        'lúa', 'cà chua', 'dưa hấu', 'dưa leo', 'cam', 'xoài', 'tiêu', 'điều', 
        'ngô', 'khoai', 'cà rốt', 'rau', 'bắp cải', 'xà lách', 'hành', 'tỏi',
        'ớt', 'cải', 'su hào', 'củ cải', 'bí', 'mướp', 'đậu', 'cà', 'bầu',
        'khoai tây', 'khoai lang', 'su su', 'măng', 'nấm', 'gừng', 'nghệ',
        'chanh', 'bưởi', 'thanh long', 'sầu riêng', 'măng cụt', 'nhãn', 'vải',
        'chuối', 'đu đủ', 'dứa', 'thơm', 'mít', 'bơ', 'lê', 'táo', 'nho',
        'dâu', 'lúa mì', 'lúa mạch', 'lúa nước', 'lúa gạo', 'cây cà chua',
        'cây lúa', 'cây ngô', 'cây khoai'
      ];
      
      // First, check recent messages (higher priority)
      plantKeywords.forEach(plant => {
        if (recentMessagesText.includes(plant) && !mentionedTopics.includes(plant)) {
          mentionedTopics.push(plant);
        }
      });
      
      // If no topics found in recent, check all history
      if (mentionedTopics.length === 0) {
        plantKeywords.forEach(plant => {
          if (allHistoryText.includes(plant) && !mentionedTopics.includes(plant)) {
            mentionedTopics.push(plant);
          }
        });
      }
    }
    
    // If it's a follow-up and we have context, add a strong reminder
    if (isFollowUp && mentionedTopics.length > 0 && recentHistory.length > 0) {
      const lastTopic = mentionedTopics[mentionedTopics.length - 1]; // Get most recent topic
      
      // Build a stronger reminder message
      let reminderMessage = `🔴🔴🔴 CỰC KỲ QUAN TRỌNG - ĐỌC KỸ TRƯỚC KHI TRẢ LỜI 🔴🔴🔴

CHỦ ĐỀ ĐANG NÓI: "${lastTopic.toUpperCase()}"

Câu hỏi gốc của user: "${message}"`;

      // If pronoun detected, provide explicit replacement
      if (hasPronoun) {
        let replacedMessage = message;
        // Replace pronouns with actual topic
        replacedMessage = replacedMessage
          .replace(/cây\s+này/gi, `cây ${lastTopic}`)
          .replace(/cây\s+đó/gi, `cây ${lastTopic}`)
          .replace(/cây\s+kia/gi, `cây ${lastTopic}`)
          .replace(/loại\s+này/gi, `loại ${lastTopic}`)
          .replace(/loại\s+đó/gi, `loại ${lastTopic}`)
          .replace(/giống\s+này/gi, `giống ${lastTopic}`)
          .replace(/giống\s+đó/gi, `giống ${lastTopic}`)
          .replace(/^nó\s+/gi, `${lastTopic} `)
          .replace(/^nó$/gi, lastTopic)
          .replace(/thằng\s+này/gi, lastTopic)
          .replace(/con\s+này/gi, lastTopic);
        
        reminderMessage += `

🎯 DỊCH NGHĨA THỰC TẾ: "${replacedMessage}"

User đang dùng ĐẠI TỪ ("cây này", "nó", "đó"...) để chỉ "${lastTopic}" từ câu hỏi trước.

BẠN PHẢI HIỂU VÀ TRẢ LỜI VỀ "${lastTopic.toUpperCase()}", KHÔNG PHẢI VỀ "CÂY" CHUNG CHUNG!`;
      }

      reminderMessage += `

📋 HƯỚNG DẪN TRẢ LỜI:
✅ BẮT BUỘC trả lời cụ thể về "${lastTopic}"
✅ Không được trả lời chung chung về "cây" hay chủ đề khác
✅ Phải đề cập rõ ràng "${lastTopic}" trong câu trả lời

❌ SAI: "Để trồng cây thành công, bạn cần..."
✅ ĐÚNG: "Để trồng ${lastTopic} thành công, bạn cần..."

VÍ DỤ CỤ THỂ:
- "trồng như nào" → "Cách trồng ${lastTopic}..."
- "cây này trồng như nào" → "Cách trồng ${lastTopic}..."
- "cần gì" → "${lastTopic.charAt(0).toUpperCase() + lastTopic.slice(1)} cần..."
- "chăm sóc thế nào" → "Chăm sóc ${lastTopic}..."`;
      
      messages.push({
        role: 'system',
        content: reminderMessage
      });
      
      console.log('📌 [chat] Added follow-up reminder:', {
        isFollowUp,
        hasPronoun,
        mentionedTopics,
        lastTopic,
        originalMessage: message,
        userMessagePreview: message.substring(0, 50)
      });
    }
    
    // Add current user message (with explicit rewrite if pronoun detected)
    let finalUserMessage = message;
    
    // If we detected pronoun and have a topic, explicitly rewrite the message for clarity
    if (hasPronoun && mentionedTopics.length > 0 && isFollowUp) {
      const lastTopic = mentionedTopics[mentionedTopics.length - 1];
      let rewrittenMessage = message
        .replace(/cây\s+này/gi, `${lastTopic}`)
        .replace(/cây\s+đó/gi, `${lastTopic}`)
        .replace(/cây\s+kia/gi, `${lastTopic}`)
        .replace(/loại\s+này/gi, `${lastTopic}`)
        .replace(/loại\s+đó/gi, `${lastTopic}`)
        .replace(/giống\s+này/gi, `${lastTopic}`)
        .replace(/giống\s+đó/gi, `${lastTopic}`)
        .replace(/^nó\s+/gi, `${lastTopic} `)
        .replace(/^nó$/gi, lastTopic)
        .replace(/thằng\s+này/gi, lastTopic)
        .replace(/con\s+này/gi, lastTopic);
      
      // Add both original and rewritten for maximum clarity
      finalUserMessage = `${message} [Ý nghĩa: ${rewrittenMessage}]`;
      
      console.log('🔄 [chat] Rewritten user message:', {
        original: message,
        rewritten: rewrittenMessage,
        topic: lastTopic
      });
    }
    
    messages.push({ role: 'user', content: finalUserMessage });

    console.log('💬 [chat] Sending to GPT:', {
      totalMessages: messages.length,
      historyMessages: recentHistory.length,
      hasContextPrompt: !!contextPrompt,
      hasWeather: !!weatherContext,
      hasAnalysis: !!context?.lastAnalysis,
      isFollowUp: isFollowUp,
      mentionedTopics: mentionedTopics,
      userMessage: message.substring(0, 50)
    });

    // 4. Generate AI response with context
    // ⚠️ IMPORTANT: Chatbot is for knowledge Q&A only, NOT image analysis
    // We explicitly set analysis to null to use Knowledge Question Mode
    const aiResponse = await generateAIResponse({
      messages,
      weather: weatherContext,
      analysis: null,  // ✅ Always null for chatbot - use Knowledge Question Mode
      products: null  // No products in simple chat
    });

    console.log('✅ [chat] Response generated');

    // Extract message string from response object
    const messageText = aiResponse.data?.message || aiResponse.message || 'Xin lỗi, tôi không thể trả lời câu hỏi này.';

    return {
      answer: messageText,
      context: {
        weather: weatherContext,
        analysis: context?.lastAnalysis || null,
        hasHistory: chatHistoryMessages.length > 0
      }
    };

  } catch (error) {
    console.error('❌ [chat] Error:', error);
    throw httpError(error.statusCode || 500, error.message || 'Chat failed');
  }
};

/**
 * Load user's last analysis for context
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} Last analysis or null
 */
export const loadLastAnalysis = async (userId) => {
  try {
    const { default: Analysis } = await import('../analyses/analysis.model.js');
    
    const lastAnalysis = await Analysis.findOne({ userId })
      .sort({ createdAt: -1 })
      .limit(1)
      .lean();
    
    if (!lastAnalysis) {
      return null;
    }

    // Return simplified analysis for context
    return {
      plant: lastAnalysis.resultTop?.plant || null,
      disease: lastAnalysis.resultTop?.disease || null,
      confidence: lastAnalysis.resultTop?.confidence || 0,
      isHealthy: lastAnalysis.resultTop?.isHealthy || false,
      analyzedAt: lastAnalysis.createdAt
    };

  } catch (error) {
    console.error('Failed to load last analysis:', error);
    return null;
  }
};

