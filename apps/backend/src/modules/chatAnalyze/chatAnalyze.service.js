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
export const processTextOnly = async ({ message, weather = null, userId }) => {
  try {
    // 1. Extract plant keywords from message
    const plantKeywords = ['cây', 'plant', 'trồng', 'chăm sóc', 'lan', 'cà chua', 'dưa hấu', 'lúa', 'ngô', 'khoai', 'cà rốt', 'rau'];
    const mentionedPlants = plantKeywords.filter(keyword => 
      message.toLowerCase().includes(keyword)
    );

    // 2. Get plant context from DB
    let plantContext = null;
    if (mentionedPlants.length > 0) {
      try {
        plantContext = await getPlantCareInfo({ plantName: mentionedPlants[0] });
      } catch (error) {
        console.warn('Failed to get plant context:', error.message);
      }
    }

    // 3. Get weather context if not provided
    let weatherContext = weather;
    if (!weatherContext) {
      try {
        // Default to Hanoi for demo
        weatherContext = await getWeatherData({ cityName: 'Hanoi' });
      } catch (error) {
        console.warn('Failed to get weather context:', error.message);
      }
    }

    // 4. Get product recommendations if plant context exists
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

    // 5. Generate AI response with all context
    const aiResponse = await generateAIResponse({
      messages: [{ role: 'user', content: message }],
      weather: weatherContext,
      analysis: plantContext,
      products: productContext
    });

    return {
      type: 'text-only',
      response: aiResponse.data.message,
      context: {
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
export const processImageOnly = async ({ imageUrl, userId }) => {
  try {
    // 1. Call Plant.id API (mock for now)
    const analysisResult = await mockPlantIdAnalysis({ imageUrl });
    
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

    return {
      type: 'image-only',
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
 * @param {string} params.imageUrl - Image URL
 * @param {string} params.userId - User ID
 * @returns {Promise<object>} Combined analysis result
 */
export const processImageText = async ({ message, imageUrl, userId }) => {
  try {
    // 1. Analyze if image analysis is needed
    const needsImageAnalysis = shouldAnalyzeImage(message);
    
    let analysisResult = null;
    let plantContext = null;
    let productContext = null;
    let weatherContext = null;

    // 2. If image analysis is needed, call Plant.id
    if (needsImageAnalysis) {
      analysisResult = await mockPlantIdAnalysis({ imageUrl });
      
      // Get plant context from DB
      if (analysisResult.plant) {
        try {
          plantContext = await getPlantCareInfo({ 
            plantName: analysisResult.plant.commonName 
          });
        } catch (error) {
          console.warn('Failed to get plant context:', error.message);
        }
      }
    }

    // 3. Get weather context
    try {
      weatherContext = await getWeatherData({ cityName: 'Hanoi' });
    } catch (error) {
      console.warn('Failed to get weather context:', error.message);
    }

    // 4. Get product recommendations
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

    // 5. Generate AI response with all context
    const aiResponse = await generateAIResponse({
      messages: [{ role: 'user', content: message }],
      weather: weatherContext,
      analysis: analysisResult,
      products: productContext
    });

    return {
      type: 'image-text',
      response: aiResponse.data.message,
      analysis: analysisResult,
      context: {
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

// Mock Plant.id analysis (replace with real API call)
const mockPlantIdAnalysis = async ({ imageUrl }) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    plant: {
      commonName: 'Cà chua',
      scientificName: 'Solanum lycopersicum'
    },
    disease: {
      name: 'Bệnh đốm lá sớm',
      description: 'Lá xuất hiện các đốm nâu, có thể do nấm gây ra'
    },
    confidence: 0.85,
    care: [
      'Tưới nước khi đất khô 2-3cm trên bề mặt',
      'Đặt cây ở nơi có ánh sáng gián tiếp'
    ],
    imageInsights: {
      imageUrl: imageUrl,
      boxes: [
        { x: 20, y: 30, width: 25, height: 25, label: 'Đốm lá' }
      ]
    }
  };
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
