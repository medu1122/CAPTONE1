import { analyzeService } from './analyze.service.js';
import { httpError } from '../../common/utils/http.js';

/**
 * SSE Controller for Plant Analysis Streaming
 * Handles real-time plant analysis with Server-Sent Events
 */

/**
 * Stream Plant Analysis with SSE
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const streamAnalyzeResponse = async (req, res) => {
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
    const { image, text, lat, lon } = req.query;

    if (!image && !text) {
      res.write('event: error\n');
      res.write('data: {"error":"Either image or text is required"}\n\n');
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // Send analysis started event
    res.write('event: analysis\n');
    res.write('data: {"status":"started","message":"Starting plant analysis..."}\n\n');

    try {
      // Process analysis with streaming
      const result = await processAnalysisWithStreaming({
        image,
        text,
        lat: lat ? parseFloat(lat) : null,
        lon: lon ? parseFloat(lon) : null,
        res
      });

      // Send completion event
      res.write('event: complete\n');
      res.write('data: {"status":"complete","result":' + JSON.stringify(result) + '}\n\n');

    } catch (error) {
      // Send error event
      res.write('event: error\n');
      res.write('data: {"error":"' + error.message + '","code":"ANALYSIS_ERROR"}\n\n');
    }

    // Send done event and close connection
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('SSE Analysis Stream Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Stream initialization failed' });
    } else {
      res.write('event: error\n');
      res.write('data: {"error":"Analysis stream failed"}\n\n');
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
};

/**
 * Process Analysis with Streaming
 * @param {object} params - Parameters
 * @param {string} params.image - Image data
 * @param {string} params.text - Text description
 * @param {number} params.lat - Latitude
 * @param {number} params.lon - Longitude
 * @param {object} params.res - Response object for streaming
 * @returns {Promise<object>} Analysis result
 */
const processAnalysisWithStreaming = async ({ image, text, lat, lon, res }) => {
  try {
    // Send input validation
    res.write('event: validation\n');
    res.write('data: {"type":"input","message":"Validating input data..."}\n\n');

    await new Promise(resolve => setTimeout(resolve, 300));

    // Send validation complete
    res.write('event: validation\n');
    res.write('data: {"type":"validated","message":"Input validation complete"}\n\n');

    if (image) {
      return await streamImageAnalysis({ image, lat, lon, res });
    } else if (text) {
      return await streamTextAnalysis({ text, lat, lon, res });
    }

  } catch (error) {
    throw httpError(500, `Analysis streaming failed: ${error.message}`);
  }
};

/**
 * Stream Image Analysis
 * @param {object} params - Parameters
 * @param {string} params.image - Image data
 * @param {number} params.lat - Latitude
 * @param {number} params.lon - Longitude
 * @param {object} params.res - Response object
 * @returns {Promise<object>} Analysis result
 */
const streamImageAnalysis = async ({ image, lat, lon, res }) => {
  try {
    // Send image processing start
    res.write('event: image\n');
    res.write('data: {"type":"processing","message":"Processing image..."}\n\n');

    await new Promise(resolve => setTimeout(resolve, 500));

    // Send Plant.id API call simulation
    res.write('event: image\n');
    res.write('data: {"type":"api_call","message":"Calling Plant.id API..."}\n\n');

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send plant identification
    res.write('event: image\n');
    res.write('data: {"type":"identified","message":"Plant identified: Cà chua"}\n\n');

    // Send disease detection
    res.write('event: image\n');
    res.write('data: {"type":"disease","message":"Checking for diseases..."}\n\n');

    await new Promise(resolve => setTimeout(resolve, 800));

    res.write('event: image\n');
    res.write('data: {"type":"disease_result","message":"Disease detected: Bệnh đốm lá sớm"}\n\n');

    // Stream detailed analysis
    const analysisChunks = [
      "**Kết quả phân tích hình ảnh:**\n",
      "🌱 **Cây trồng:** Cà chua (Solanum lycopersicum)\n",
      "📊 **Độ tin cậy:** 85%\n",
      "🔍 **Tình trạng:** Có dấu hiệu bệnh\n\n",
      "**Bệnh phát hiện:**\n",
      "🦠 **Tên bệnh:** Bệnh đốm lá sớm\n",
      "📈 **Mức độ:** Trung bình\n",
      "⚠️ **Triệu chứng:** Đốm nâu trên lá\n\n",
      "**Khuyến nghị điều trị:**\n",
      "1. Cắt bỏ lá bị bệnh\n",
      "2. Phun thuốc trừ nấm\n",
      "3. Cải thiện thông gió\n",
      "4. Theo dõi tiến triển"
    ];

    for (let i = 0; i < analysisChunks.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      res.write('event: analysis\n');
      res.write('data: {"partial":"' + analysisChunks[i] + '","chunk":' + i + '}\n\n');
    }

    // Send location-based recommendations
    if (lat && lon) {
      res.write('event: location\n');
      res.write('data: {"type":"location","message":"Adding location context..."}\n\n');

      await new Promise(resolve => setTimeout(resolve, 500));

      res.write('event: location\n');
      res.write('data: {"type":"weather","message":"Getting weather data for location..."}\n\n');

      await new Promise(resolve => setTimeout(resolve, 300));

      res.write('event: location\n');
      res.write('data: {"type":"recommendations","message":"Generating location-based recommendations..."}\n\n');
    }

    return {
      plant: {
        commonName: 'Cà chua',
        scientificName: 'Solanum lycopersicum',
        confidence: 0.85
      },
      disease: {
        name: 'Bệnh đốm lá sớm',
        confidence: 0.85,
        severity: 'medium'
      },
      analysis: analysisChunks.join(''),
      location: lat && lon ? { lat, lon } : null
    };

  } catch (error) {
    throw httpError(500, `Image analysis streaming failed: ${error.message}`);
  }
};

/**
 * Stream Text Analysis
 * @param {object} params - Parameters
 * @param {string} params.text - Text description
 * @param {number} params.lat - Latitude
 * @param {number} params.lon - Longitude
 * @param {object} params.res - Response object
 * @returns {Promise<object>} Analysis result
 */
const streamTextAnalysis = async ({ text, lat, lon, res }) => {
  try {
    // Send text processing start
    res.write('event: text\n');
    res.write('data: {"type":"processing","message":"Processing text description..."}\n\n');

    await new Promise(resolve => setTimeout(resolve, 400));

    // Send keyword extraction
    res.write('event: text\n');
    res.write('data: {"type":"keywords","message":"Extracting plant keywords..."}\n\n');

    await new Promise(resolve => setTimeout(resolve, 300));

    // Send plant identification from text
    res.write('event: text\n');
    res.write('data: {"type":"identified","message":"Plant identified from description: Cà chua"}\n\n');

    // Stream AI-generated analysis
    const textAnalysisChunks = [
      "**Phân tích mô tả:**\n",
      "📝 **Mô tả:** " + text + "\n",
      "🌱 **Cây trồng:** Cà chua\n",
      "📊 **Độ tin cậy:** 75%\n\n",
      "**Hướng dẫn chăm sóc:**\n",
      "💧 **Tưới nước:** 2-3 lần/tuần\n",
      "☀️ **Ánh sáng:** 6-8 giờ/ngày\n",
      "🌡️ **Nhiệt độ:** 20-25°C\n",
      "🌱 **Đất trồng:** Thoát nước tốt\n\n",
      "**Lưu ý quan trọng:**\n",
      "⚠️ Theo dõi sâu bệnh\n",
      "🌿 Bón phân định kỳ\n",
      "🌱 Cắt tỉa lá già"
    ];

    for (let i = 0; i < textAnalysisChunks.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 250));
      
      res.write('event: analysis\n');
      res.write('data: {"partial":"' + textAnalysisChunks[i] + '","chunk":' + i + '}\n\n');
    }

    // Send care recommendations
    res.write('event: recommendations\n');
    res.write('data: {"type":"care","message":"Generating care recommendations..."}\n\n');

    await new Promise(resolve => setTimeout(resolve, 500));

    res.write('event: recommendations\n');
    res.write('data: {"type":"products","message":"Finding relevant products..."}\n\n');

    await new Promise(resolve => setTimeout(resolve, 300));

    res.write('event: recommendations\n');
    res.write('data: {"type":"complete","message":"Recommendations generated"}\n\n');

    return {
      plant: {
        commonName: 'Cà chua',
        scientificName: 'Solanum lycopersicum',
        confidence: 0.75
      },
      analysis: textAnalysisChunks.join(''),
      recommendations: {
        care: 'Tưới nước đều đặn, đảm bảo ánh sáng',
        products: ['Phân bón NPK', 'Thuốc trừ sâu', 'Đất trồng']
      },
      location: lat && lon ? { lat, lon } : null
    };

  } catch (error) {
    throw httpError(500, `Text analysis streaming failed: ${error.message}`);
  }
};

export default {
  streamAnalyzeResponse,
};
