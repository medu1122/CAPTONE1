import { generateAssistantReply } from './chat.service.js';
import { processChatAnalyze } from '../chatAnalyze/chatAnalyze.service.js';
import { httpError } from '../../common/utils/http.js';

/**
 * SSE Controller for Chat Streaming
 * Handles real-time chat responses with Server-Sent Events
 */

/**
 * Stream Chat Response with SSE
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const streamChatResponse = async (req, res) => {
  try {
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    });

    // Disable timeout for SSE
    res.setTimeout(0);

    // Send initial connection event
    res.write('event: connected\n');
    res.write('data: {"status":"connected","timestamp":' + Date.now() + '}\n\n');

    // Get request parameters
    const { message, imageUrl, weather, sessionId } = req.query;
    const userId = req.user?.id;

    if (!message && !imageUrl) {
      res.write('event: error\n');
      res.write('data: {"error":"Either message or imageUrl is required"}\n\n');
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // Send processing started event
    res.write('event: processing\n');
    res.write('data: {"status":"processing","message":"Starting analysis..."}\n\n');

    try {
      // Process chat analyze with streaming
      const result = await processChatAnalyzeWithStreaming({
        message,
        imageUrl,
        weather: weather ? JSON.parse(weather) : null,
        userId,
        sessionId,
        res
      });

      // Send completion event
      res.write('event: complete\n');
      res.write('data: {"status":"complete","result":' + JSON.stringify(result) + '}\n\n');

    } catch (error) {
      // Send error event
      res.write('event: error\n');
      res.write('data: {"error":"' + error.message + '","code":"PROCESSING_ERROR"}\n\n');
    }

    // Send done event and close connection
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('SSE Stream Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Stream initialization failed' });
    } else {
      res.write('event: error\n');
      res.write('data: {"error":"Stream failed"}\n\n');
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
};

/**
 * Process Chat Analyze with Streaming
 * @param {object} params - Parameters
 * @param {string} params.message - User message
 * @param {string} params.imageUrl - Image URL
 * @param {object} params.weather - Weather context
 * @param {string} params.userId - User ID
 * @param {string} params.sessionId - Session ID
 * @param {object} params.res - Response object for streaming
 * @returns {Promise<object>} Final result
 */
const processChatAnalyzeWithStreaming = async ({ message, imageUrl, weather, userId, sessionId, res }) => {
  try {
    // Send analysis type detection
    res.write('event: analysis\n');
    res.write('data: {"type":"detecting","message":"Detecting analysis type..."}\n\n');

    let analysisType = 'text-only';
    if (imageUrl && message) {
      analysisType = 'image-text';
    } else if (imageUrl && !message) {
      analysisType = 'image-only';
    }

    res.write('event: analysis\n');
    res.write('data: {"type":"' + analysisType + '","message":"Analysis type: ' + analysisType + '"}\n\n');

    // Simulate streaming response based on analysis type
    if (analysisType === 'text-only') {
      return await streamTextOnlyAnalysis({ message, weather, userId, res });
    } else if (analysisType === 'image-only') {
      return await streamImageOnlyAnalysis({ imageUrl, userId, res });
    } else if (analysisType === 'image-text') {
      return await streamImageTextAnalysis({ message, imageUrl, weather, userId, res });
    }

  } catch (error) {
    throw httpError(500, `Streaming analysis failed: ${error.message}`);
  }
};

/**
 * Stream Text-Only Analysis
 * @param {object} params - Parameters
 * @param {string} params.message - User message
 * @param {object} params.weather - Weather context
 * @param {string} params.userId - User ID
 * @param {object} params.res - Response object
 * @returns {Promise<object>} Analysis result
 */
const streamTextOnlyAnalysis = async ({ message, weather, userId, res }) => {
  try {
    // Send plant context analysis
    res.write('event: context\n');
    res.write('data: {"type":"plant_context","message":"Analyzing plant context..."}\n\n');

    // Simulate plant keyword extraction
    const plantKeywords = ['cây', 'plant', 'trồng', 'chăm sóc', 'lan', 'cà chua', 'dưa hấu', 'lúa', 'ngô'];
    const mentionedPlants = plantKeywords.filter(keyword => 
      message.toLowerCase().includes(keyword)
    );

    if (mentionedPlants.length > 0) {
      res.write('event: context\n');
      res.write('data: {"type":"plant_found","message":"Found plant: ' + mentionedPlants[0] + '"}\n\n');
    }

    // Send weather context
    res.write('event: context\n');
    res.write('data: {"type":"weather","message":"Getting weather context..."}\n\n');

    // Simulate AI response generation
    res.write('event: ai\n');
    res.write('data: {"type":"generating","message":"Generating AI response..."}\n\n');

    // Stream AI response chunks
    const responseChunks = [
      "Dựa trên câu hỏi của bạn về ",
      mentionedPlants[0] || "cây trồng",
      ", tôi có thể tư vấn như sau:\n\n",
      "**Hướng dẫn chăm sóc:**\n",
      "- Tưới nước đều đặn\n",
      "- Đảm bảo ánh sáng phù hợp\n",
      "- Kiểm tra đất trồng\n\n",
      "**Lưu ý quan trọng:**\n",
      "- Theo dõi sức khỏe cây\n",
      "- Phòng ngừa sâu bệnh\n",
      "- Điều chỉnh theo mùa"
    ];

    for (let i = 0; i < responseChunks.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 200)); // Simulate processing delay
      
      res.write('event: response\n');
      res.write('data: {"partial":"' + responseChunks[i] + '","chunk":' + i + '}\n\n');
    }

    // Send product recommendations
    res.write('event: products\n');
    res.write('data: {"type":"recommendations","message":"Getting product recommendations..."}\n\n');

    // Simulate product search
    await new Promise(resolve => setTimeout(resolve, 500));
    res.write('event: products\n');
    res.write('data: {"type":"found","message":"Found 3 relevant products"}\n\n');

    return {
      type: 'text-only',
      response: responseChunks.join(''),
      context: {
        hasPlantContext: mentionedPlants.length > 0,
        hasWeatherContext: !!weather,
        plantKeywords: mentionedPlants
      }
    };

  } catch (error) {
    throw httpError(500, `Text analysis streaming failed: ${error.message}`);
  }
};

/**
 * Stream Image-Only Analysis
 * @param {object} params - Parameters
 * @param {string} params.imageUrl - Image URL
 * @param {string} params.userId - User ID
 * @param {object} params.res - Response object
 * @returns {Promise<object>} Analysis result
 */
const streamImageOnlyAnalysis = async ({ imageUrl, userId, res }) => {
  try {
    // Send image analysis start
    res.write('event: image\n');
    res.write('data: {"type":"analyzing","message":"Starting image analysis..."}\n\n');

    // Simulate Plant.id API call
    res.write('event: image\n');
    res.write('data: {"type":"plant_id","message":"Calling Plant.id API..."}\n\n');

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate plant identification
    res.write('event: image\n');
    res.write('data: {"type":"identified","message":"Plant identified: Cà chua"}\n\n');

    // Simulate disease detection
    res.write('event: image\n');
    res.write('data: {"type":"disease","message":"Checking for diseases..."}\n\n');

    await new Promise(resolve => setTimeout(resolve, 800));

    res.write('event: image\n');
    res.write('data: {"type":"disease_found","message":"Disease detected: Bệnh đốm lá"}\n\n');

    // Stream analysis results
    const analysisChunks = [
      "**Phân tích hình ảnh:**\n",
      "Cây: Cà chua (Solanum lycopersicum)\n",
      "Tình trạng: Có dấu hiệu bệnh\n",
      "Bệnh: Đốm lá sớm\n\n",
      "**Khuyến nghị:**\n",
      "- Cắt bỏ lá bị bệnh\n",
      "- Phun thuốc trừ nấm\n",
      "- Cải thiện thông gió"
    ];

    for (let i = 0; i < analysisChunks.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      res.write('event: analysis\n');
      res.write('data: {"partial":"' + analysisChunks[i] + '","chunk":' + i + '}\n\n');
    }

    return {
      type: 'image-only',
      analysis: {
        plant: { commonName: 'Cà chua', scientificName: 'Solanum lycopersicum' },
        disease: { name: 'Bệnh đốm lá sớm', confidence: 0.85 },
        confidence: 0.85
      }
    };

  } catch (error) {
    throw httpError(500, `Image analysis streaming failed: ${error.message}`);
  }
};

/**
 * Stream Image + Text Analysis
 * @param {object} params - Parameters
 * @param {string} params.message - User message
 * @param {string} params.imageUrl - Image URL
 * @param {object} params.weather - Weather context
 * @param {string} params.userId - User ID
 * @param {object} params.res - Response object
 * @returns {Promise<object>} Analysis result
 */
const streamImageTextAnalysis = async ({ message, imageUrl, weather, userId, res }) => {
  try {
    // Send combined analysis start
    res.write('event: combined\n');
    res.write('data: {"type":"starting","message":"Starting combined analysis..."}\n\n');

    // Process image first
    res.write('event: combined\n');
    res.write('data: {"type":"image","message":"Processing image..."}\n\n');

    await new Promise(resolve => setTimeout(resolve, 800));

    // Process text context
    res.write('event: combined\n');
    res.write('data: {"type":"text","message":"Processing text context..."}\n\n');

    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate combined response
    res.write('event: combined\n');
    res.write('data: {"type":"generating","message":"Generating combined response..."}\n\n');

    const combinedChunks = [
      "**Phân tích kết hợp:**\n",
      "Dựa trên hình ảnh và câu hỏi của bạn:\n\n",
      "**Nhận diện:**\n",
      "- Cây: Cà chua\n",
      "- Vấn đề: Bệnh đốm lá\n",
      "- Mức độ: Trung bình\n\n",
      "**Giải pháp:**\n",
      "1. Cắt bỏ lá bị bệnh\n",
      "2. Phun thuốc trừ nấm\n",
      "3. Cải thiện thông gió\n",
      "4. Theo dõi tiến triển"
    ];

    for (let i = 0; i < combinedChunks.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 250));
      
      res.write('event: response\n');
      res.write('data: {"partial":"' + combinedChunks[i] + '","chunk":' + i + '}\n\n');
    }

    return {
      type: 'image-text',
      response: combinedChunks.join(''),
      analysis: {
        plant: { commonName: 'Cà chua' },
        disease: { name: 'Bệnh đốm lá' }
      }
    };

  } catch (error) {
    throw httpError(500, `Combined analysis streaming failed: ${error.message}`);
  }
};

export default {
  streamChatResponse,
};
