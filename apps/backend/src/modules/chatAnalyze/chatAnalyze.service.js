import { getPlantCareInfo } from '../plants/plant.service.js';
import { getRecommendations } from '../productRecommendations/productRecommendation.service.js';
import { getWeatherData } from '../weather/weather.service.js';
import { generateAIResponse } from '../aiAssistant/ai.service.js';
import { httpError } from '../../common/utils/http.js';

/**
 * Main Chat Analyze Service - AI Layer Integration
 * Handles all interaction types with intelligent data combination
 */

/**
 * Process Text-only interaction
 * @param {object} params - Parameters
 * @param {string} params.message - User message
 * @param {object} params.weather - Weather context (optional)
 * @param {string} params.userId - User ID
 * @returns {Promise<object>} AI response with context
 */
export const processTextOnly = async ({ 
  message, 
  sessionId,
  userId,
  weather = null 
}) => {
  try {
    // 1. LOAD CHAT HISTORY FOR CONTEXT
    let chatContext = null;
    if (sessionId) {
      try {
        const { loadChatContextWithAnalysis, buildContextPromptFromHistory } = 
          await import('../chats/chat.service.js');
        
        chatContext = await loadChatContextWithAnalysis({
          sessionId,
          userId,
          limit: 10  // Last 10 messages
        });
        
        console.log('📚 Loaded chat context:', {
          sessionId,
          messageCount: chatContext.messages?.length || 0,
          hasSession: !!chatContext.session
        });
      } catch (error) {
        console.warn('Failed to load chat context:', error.message);
      }
    }

    // 2. BUILD CONTEXT PROMPT from chat history
    let contextPrompt = '';
    if (chatContext && chatContext.messages?.length > 0) {
      try {
        const { buildContextPromptFromHistory } = 
          await import('../chats/chat.service.js');
        
        contextPrompt = buildContextPromptFromHistory({
          messages: chatContext.messages,
          session: chatContext.session
        });
        
        console.log('📝 Context prompt built:', contextPrompt ? 'Yes' : 'No');
      } catch (error) {
        console.warn('Failed to build context prompt:', error.message);
      }
    }

    // 3. Extract plant keywords from message
    const plantKeywords = ['cây', 'plant', 'trồng', 'chăm sóc', 'lan', 'cà chua', 'dưa hấu', 'lúa', 'ngô', 'khoai', 'cà rốt', 'rau'];
    const mentionedPlants = plantKeywords.filter(keyword => 
      message.toLowerCase().includes(keyword)
    );

    // 4. Get plant context from DB
    let plantContext = null;
    if (mentionedPlants.length > 0) {
      try {
        plantContext = await getPlantCareInfo({ plantName: mentionedPlants[0] });
      } catch (error) {
        console.warn('Failed to get plant context:', error.message);
      }
    }

    // 5. Get weather context if not provided
    let weatherContext = weather;
    if (!weatherContext) {
      try {
        weatherContext = await getWeatherData({ cityName: 'Hanoi' });
      } catch (error) {
        console.warn('Failed to get weather context:', error.message);
      }
    }

    // 6. Get product recommendations if plant context exists
    let productContext = null;
    if (plantContext) {
      try {
        const productResult = await getRecommendations({
          plant: plantContext.name,
          limit: 5
        });
        productContext = productResult.recommendations;
      } catch (error) {
        console.warn('Failed to get product recommendations:', error.message);
      }
    }

    // 7. Generate AI response WITH CHAT HISTORY CONTEXT
    const messages = [
      // Add context from chat history (includes previous plant discussions)
      ...(contextPrompt ? [{ 
        role: 'system', 
        content: contextPrompt 
      }] : []),
      // Add current user message
      { role: 'user', content: message }
    ];

    console.log('💬 Sending to GPT:', {
      messagesCount: messages.length,
      hasContext: !!contextPrompt,
      hasWeather: !!weatherContext
    });

    const aiResponse = await generateAIResponse({
      messages,  // ← Now includes chat history!
      weather: weatherContext,
      analysis: plantContext,
      products: productContext
    });

    return {
      type: 'text-only',
      response: aiResponse.data.message,
      context: {
        hasHistory: !!chatContext,
        historyMessageCount: chatContext?.messages?.length || 0,
        hasPlantContext: !!plantContext,
        hasWeatherContext: !!weatherContext,
        hasProductContext: !!productContext,
        plantInfo: plantContext,
        weatherInfo: weatherContext,
        productInfo: productContext
      },
      meta: aiResponse.data.meta
    };
  } catch (error) {
    throw httpError(500, `Text-only processing failed: ${error.message}`);
  }
};

/**
 * Process Image-only interaction
 * @param {object} params - Parameters
 * @param {string} params.imageUrl - Image URL
 * @param {string} params.userId - User ID
 * @returns {Promise<object>} Analysis result with enhanced data
 */
export const processImageOnly = async ({ imageData, userId }) => {
  try {
    // 1. Call Plant.id API (REAL API)
    const analysisResult = await realPlantIdAnalysis({ imageData });
    
    // 2. Get detailed plant info from DB
    let plantContext = null;
    if (analysisResult.plant) {
      try {
        plantContext = await getPlantCareInfo({ 
          plantName: analysisResult.plant.commonName 
        });
      } catch (error) {
        console.warn('Failed to get plant context:', error.message);
      }
    }

    // 3. Get product recommendations based on analysis
    let productContext = null;
    if (analysisResult.plant || analysisResult.disease) {
      try {
        const productResult = await getRecommendations({
          plant: analysisResult.plant?.commonName,
          disease: analysisResult.disease?.name,
          limit: 5
        });
        productContext = productResult.recommendations;
      } catch (error) {
        console.warn('Failed to get product recommendations:', error.message);
      }
    }

    // 4. Get weather context for care recommendations
    let weatherContext = null;
    try {
      weatherContext = await getWeatherData({ cityName: 'Hanoi' });
    } catch (error) {
      console.warn('Failed to get weather context:', error.message);
    }

    // 5. Generate enhanced analysis result
    const enhancedResult = {
      ...analysisResult,
      plantInfo: plantContext,
      productRecommendations: productContext,
      weatherContext: weatherContext,
      careInstructions: plantContext?.careInstructions || analysisResult.care,
      commonDiseases: plantContext?.commonDiseases || [],
      growthStages: plantContext?.growthStages || []
    };

    // 6. Generate AI response to describe the plant
    let aiResponse = '';
    if (analysisResult.plant) {
      const plantName = analysisResult.plant.commonName || analysisResult.plant.scientificName;
      const confidence = Math.round(analysisResult.confidence * 100);
      
      aiResponse = `🌿 **Phân tích hình ảnh**\n\n`;
      aiResponse += `Đây là cây **${plantName}** (độ chính xác: ${confidence}%)\n\n`;
      
      if (analysisResult.isHealthy) {
        aiResponse += `✅ **Tình trạng**: Cây khỏe mạnh, không phát hiện bệnh.\n\n`;
      } else if (analysisResult.disease) {
        aiResponse += `⚠️ **Cảnh báo bệnh**: ${analysisResult.disease.name}\n`;
        aiResponse += `Xác suất: ${Math.round(analysisResult.disease.probability * 100)}%\n\n`;
      }
      
      if (plantContext) {
        aiResponse += `📋 **Thông tin chăm sóc**:\n`;
        aiResponse += `- Nhiệt độ: ${plantContext.temperature || 'Chưa có thông tin'}\n`;
        aiResponse += `- Độ ẩm: ${plantContext.humidity || 'Chưa có thông tin'}\n`;
        aiResponse += `- Ánh sáng: ${plantContext.sunlight || 'Chưa có thông tin'}\n`;
      }
      
      if (productContext && productContext.length > 0) {
        aiResponse += `\n\n🛒 **Sản phẩm gợi ý**: ${productContext.length} sản phẩm phù hợp với ${plantName}`;
      }
    } else {
      aiResponse = `Không thể nhận diện cây từ hình ảnh này. Vui lòng thử lại với hình ảnh rõ hơn.`;
    }

    return {
      type: 'image-only',
      response: aiResponse,  // ← Add text response
      analysis: enhancedResult,
      context: {
        hasPlantContext: !!plantContext,
        hasProductContext: !!productContext,
        hasWeatherContext: !!weatherContext,
        confidence: analysisResult.confidence
      }
    };
  } catch (error) {
    throw httpError(500, `Image-only processing failed: ${error.message}`);
  }
};

/**
 * Process Image + Text interaction
 * @param {object} params - Parameters
 * @param {string} params.message - User message
 * @param {string} params.imageData - Image URL or base64 data
 * @param {string} params.sessionId - Chat session ID
 * @param {string} params.userId - User ID
 * @returns {Promise<object>} Combined analysis result
 */
export const processImageText = async ({ message, imageData, sessionId, userId }) => {
  try {
    console.log('🖼️📝 processImageText called with:', { 
      hasMessage: !!message, 
      hasImageData: !!imageData,
      sessionId,
      userId,
      imageDataPreview: imageData ? imageData.substring(0, 50) + '...' : 'null'
    });

    // 1. LOAD CHAT HISTORY FOR CONTEXT
    let chatContext = null;
    if (sessionId) {
      try {
        const { loadChatContextWithAnalysis, buildContextPromptFromHistory } = 
          await import('../chats/chat.service.js');
        
        chatContext = await loadChatContextWithAnalysis({
          sessionId,
          userId,
          limit: 10
        });
        
        console.log('📚 Loaded chat context:', {
          sessionId,
          messageCount: chatContext.messages?.length || 0,
          hasSession: !!chatContext.session
        });
      } catch (error) {
        console.warn('Failed to load chat context:', error.message);
      }
    }

    // 2. Always analyze image if provided (user explicitly sent it)
    let analysisResult = null;
    if (imageData) {
      console.log('✅ Image provided, calling Plant.id...');
      analysisResult = await realPlantIdAnalysis({ imageData });
    }

    // 3. Get plant context from DB
    let plantContext = null;
    if (analysisResult?.plant) {
      try {
        plantContext = await getPlantCareInfo({ 
          plantName: analysisResult.plant.commonName 
        });
      } catch (error) {
        console.warn('Failed to get plant context:', error.message);
      }
    }

    // 4. Get weather context
    let weatherContext = null;
    try {
      weatherContext = await getWeatherData({ cityName: 'Hanoi' });
    } catch (error) {
      console.warn('Failed to get weather context:', error.message);
    }

    // 5. Get product recommendations
    let productContext = null;
    if (analysisResult?.plant || analysisResult?.disease) {
      try {
        const productResult = await getRecommendations({
          plant: analysisResult.plant?.commonName,
          disease: analysisResult.disease?.name,
          limit: 5
        });
        productContext = productResult.recommendations;
      } catch (error) {
        console.warn('Failed to get product recommendations:', error.message);
      }
    }

    // 6. BUILD CONTEXT PROMPT from chat history
    let contextPrompt = '';
    if (chatContext && chatContext.messages?.length > 0) {
      try {
        const { buildContextPromptFromHistory } = 
          await import('../chats/chat.service.js');
        
        contextPrompt = buildContextPromptFromHistory({
          messages: chatContext.messages,
          session: chatContext.session
        });
        
        console.log('📝 Context prompt built:', contextPrompt ? 'Yes' : 'No');
      } catch (error) {
        console.warn('Failed to build context prompt:', error.message);
      }
    }

    // 7. Generate AI response WITH CHAT HISTORY CONTEXT
    const messages = [
      // Add context from chat history
      ...(contextPrompt ? [{ 
        role: 'system', 
        content: contextPrompt 
      }] : []),
      // Add current user message
      { role: 'user', content: message }
    ];

    console.log('💬 Sending to GPT:', {
      messagesCount: messages.length,
      hasContext: !!contextPrompt,
      hasAnalysis: !!analysisResult,
      hasWeather: !!weatherContext
    });

    const aiResponse = await generateAIResponse({
      messages,  // ← Now includes chat history!
      weather: weatherContext,
      analysis: analysisResult,
      products: productContext
    });

    return {
      type: 'image-text',
      response: aiResponse.data.message,
      analysis: analysisResult,
      context: {
        hasHistory: !!chatContext,
        historyMessageCount: chatContext?.messages?.length || 0,
        hasImageAnalysis: !!analysisResult,
        hasPlantContext: !!plantContext,
        hasProductContext: !!productContext,
        hasWeatherContext: !!weatherContext,
        plantInfo: plantContext,
        weatherInfo: weatherContext,
        productInfo: productContext
      },
      meta: aiResponse.data.meta
    };
  } catch (error) {
    throw httpError(500, `Image+text processing failed: ${error.message}`);
  }
};

/**
 * Process Invalid/Spam interaction
 * @param {object} params - Parameters
 * @param {string} params.message - User message
 * @param {string} params.reason - Rejection reason
 * @returns {object} Error response
 */
export const processInvalidSpam = ({ message, reason }) => {
  return {
    type: 'invalid-spam',
    response: `Xin lỗi, ${reason}. Vui lòng gửi câu hỏi hoặc hình ảnh liên quan đến nông nghiệp.`,
    context: {
      rejected: true,
      reason: reason,
      originalMessage: message
    }
  };
};

/**
 * Main Chat Analyze Handler
 * @param {object} params - Parameters
 * @param {string} params.message - User message (optional)
 * @param {string} params.imageUrl - Image URL (optional)
 * @param {object} params.weather - Weather context (optional)
 * @param {string} params.userId - User ID
 * @returns {Promise<object>} Processed result
 */
export const processChatAnalyze = async ({ message, imageUrl, weather, userId }) => {
  try {
    // 1. Validate input
    if (!message && !imageUrl) {
      throw httpError(400, 'Either message or image is required');
    }

    // 2. Check for spam/invalid content
    if (message && isSpamContent(message)) {
      return processInvalidSpam({ 
        message, 
        reason: 'nội dung không liên quan đến nông nghiệp' 
      });
    }

    // 3. Determine interaction type and process
    if (message && imageUrl) {
      // Image + Text interaction
      return await processImageText({ message, imageUrl, userId });
    } else if (imageUrl && !message) {
      // Image-only interaction
      return await processImageOnly({ imageUrl, userId });
    } else if (message && !imageUrl) {
      // Text-only interaction
      return await processTextOnly({ message, weather, userId });
    } else {
      throw httpError(400, 'Invalid request parameters');
    }
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Chat analyze processing failed: ${error.message}`);
  }
};

/**
 * Helper Functions
 */

// Real Plant.id analysis using Plant.id V3 API
const realPlantIdAnalysis = async ({ imageData }) => {
  try {
    const { identifyPlant, formatPlantIdResult } = await import('../../common/libs/plantid.js');
    
    console.log('🌿 Calling Plant.id V3 API...');
    const plantIdResult = await identifyPlant({ imageData });
    
    console.log('📊 Plant.id result:', {
      isPlant: plantIdResult.data.is_plant,
      isHealthy: plantIdResult.data.is_healthy,
      topSuggestion: plantIdResult.data.suggestions[0]?.name,
      confidence: plantIdResult.data.suggestions[0]?.probability
    });
    
    // Format to our application format
    const formatted = formatPlantIdResult(plantIdResult);
    
    return formatted;
  } catch (error) {
    console.error('❌ Plant.id API Error:', error.message);
    // Fallback to mock if API fails
    return {
      plant: {
        commonName: 'Không xác định được',
        scientificName: 'Unknown',
        probability: 0
      },
      disease: null,
      confidence: 0,
      isHealthy: true,
      error: error.message
    };
  }
};

// Check if image analysis is needed
const shouldAnalyzeImage = (message) => {
  const imageKeywords = ['ảnh', 'hình', 'photo', 'image', 'cây', 'bệnh', 'phân tích'];
  return imageKeywords.some(keyword => message.toLowerCase().includes(keyword));
};

// Check for spam content
const isSpamContent = (message) => {
  const spamKeywords = ['spam', 'scam', 'fake', 'giả', 'lừa đảo', 'tiền', 'money'];
  const agriculturalKeywords = ['cây', 'plant', 'trồng', 'chăm sóc', 'nông nghiệp', 'rau', 'quả'];
  
  const hasSpam = spamKeywords.some(keyword => message.toLowerCase().includes(keyword));
  const hasAgricultural = agriculturalKeywords.some(keyword => message.toLowerCase().includes(keyword));
  
  return hasSpam || !hasAgricultural;
};

export default {
  processChatAnalyze,
  processTextOnly,
  processImageOnly,
  processImageText,
  processInvalidSpam,
};
