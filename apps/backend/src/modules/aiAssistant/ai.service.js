import axios from 'axios';
import { httpError } from '../../common/utils/http.js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Call OpenAI GPT API
 * @param {object} params - Parameters
 * @param {Array} params.messages - Conversation messages
 * @param {object} params.context - Additional context (weather, analysis, etc.)
 * @returns {Promise<object>} GPT response
 */
export const callGPT = async ({ messages, context = {} }) => {
  try {
    if (!OPENAI_API_KEY) {
      throw httpError(500, 'OpenAI API key not configured');
    }

    // Build system prompt with context
    let systemPrompt = `Bạn là GreenGrow AI - trợ lý nông nghiệp thông minh. 
    Nhiệm vụ của bạn là hỗ trợ người dùng về:
    - Phân tích cây trồng và bệnh tật
    - Tư vấn chăm sóc cây trồng
    - Gợi ý sản phẩm phù hợp
    - Hướng dẫn canh tác theo thời tiết
    
    Luôn trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp.`;

    // Add weather context if available
    if (context.weather) {
      systemPrompt += `\n\nThông tin thời tiết hiện tại:
      - Nhiệt độ: ${context.weather.current.temperature}°C
      - Độ ẩm: ${context.weather.current.humidity}%
      - Mô tả: ${context.weather.current.description}
      - Gió: ${context.weather.current.windSpeed} m/s`;
    }

    // Add analysis context if available
    if (context.analysis) {
      systemPrompt += `\n\nKết quả phân tích cây trồng:
      - Loại cây: ${context.analysis.plant.commonName} (${context.analysis.plant.scientificName})
      - Bệnh: ${context.analysis.disease ? context.analysis.disease.name : 'Không phát hiện'}
      - Độ tin cậy: ${Math.round(context.analysis.confidence * 100)}%`;
    }

    // Add product recommendations if available
    if (context.products && context.products.length > 0) {
      systemPrompt += `\n\nSản phẩm đề xuất: ${context.products.map(p => p.name).join(', ')}`;
    }

    // Prepare messages for OpenAI
    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    // Call OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: openaiMessages,
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const choice = response.data.choices[0];
    const usage = response.data.usage;

    return {
      content: choice.message.content,
      role: 'assistant',
      meta: {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        tokens: {
          prompt: usage.prompt_tokens,
          completion: usage.completion_tokens,
          total: usage.total_tokens,
        },
        finishReason: choice.finish_reason,
      },
    };
  } catch (error) {
    if (error.response?.status === 401) {
      throw httpError(500, 'Invalid OpenAI API key');
    }
    if (error.response?.status === 429) {
      throw httpError(429, 'OpenAI API rate limit exceeded');
    }
    if (error.response?.status === 400) {
      throw httpError(400, 'Invalid request to OpenAI API');
    }
    if (error.statusCode) throw error;
    throw httpError(500, `OpenAI API call failed: ${error.message}`);
  }
};

/**
 * Generate AI response with context
 * @param {object} params - Parameters
 * @param {Array} params.messages - Conversation messages
 * @param {object} params.weather - Weather data (optional)
 * @param {object} params.analysis - Plant analysis data (optional)
 * @param {Array} params.products - Product recommendations (optional)
 * @returns {Promise<object>} AI response with metadata
 */
export const generateAIResponse = async ({ 
  messages, 
  weather = null, 
  analysis = null, 
  products = null 
}) => {
  try {
    const context = {
      weather,
      analysis,
      products,
    };

    const response = await callGPT({ messages, context });

    return {
      success: true,
      data: {
        message: response.content,
        role: response.role,
        meta: response.meta,
        context: {
          hasWeather: !!weather,
          hasAnalysis: !!analysis,
          hasProducts: !!products && products.length > 0,
        },
      },
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `AI response generation failed: ${error.message}`);
  }
};

/**
 * Determine if image analysis is needed
 * @param {Array} messages - Conversation messages
 * @returns {boolean} Whether image analysis is needed
 */
export const needsImageAnalysis = (messages) => {
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== 'user') return false;

  const content = lastMessage.content.toLowerCase();
  const imageKeywords = ['ảnh', 'hình', 'photo', 'image', 'cây', 'bệnh', 'phân tích'];
  
  return imageKeywords.some(keyword => content.includes(keyword));
};

/**
 * Determine if product recommendations are needed
 * @param {Array} messages - Conversation messages
 * @param {object} analysis - Plant analysis data
 * @returns {boolean} Whether product recommendations are needed
 */
export const needsProductRecommendations = (messages, analysis) => {
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== 'user') return false;

  const content = lastMessage.content.toLowerCase();
  const productKeywords = ['mua', 'mua gì', 'sản phẩm', 'thuốc', 'phân', 'dụng cụ'];
  
  return productKeywords.some(keyword => content.includes(keyword)) || !!analysis;
};

export default {
  callGPT,
  generateAIResponse,
  needsImageAnalysis,
  needsProductRecommendations,
};
