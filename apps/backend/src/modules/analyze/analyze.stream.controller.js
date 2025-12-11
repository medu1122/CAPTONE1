import { analyzeImageStreaming } from './analyze.stream.service.js';
import { httpError } from '../../common/utils/http.js';

/**
 * SSE Controller for Plant Analysis Streaming
 * Handles real-time plant analysis with Server-Sent Events
 */

/**
 * Stream Plant Image Analysis with SSE
 * POST /api/v1/analyze/image-stream
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const streamImageAnalysisController = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const userId = req.user?.id || null;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'imageUrl is required',
      });
    }

    console.log('📡 [streamImageAnalysisController] Starting SSE stream:', {
      imageUrl: imageUrl.substring(0, 50),
      userId,
    });

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    });

    // Disable timeout for SSE
    res.setTimeout(0);

    // Send initial connection event
    res.write('event: connected\n');
    res.write(`data: ${JSON.stringify({ status: 'connected', timestamp: Date.now() })}\n\n`);

    // Progress callback function
    const onProgress = (event, data) => {
      try {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify({ ...data, timestamp: Date.now() })}\n\n`);
      } catch (error) {
        console.error('Error writing SSE event:', error);
      }
    };

    try {
      // Start streaming analysis
      const result = await analyzeImageStreaming({
        imageUrl,
        userId,
        onProgress,
      });

      // Send final completion event with full result
      res.write('event: complete\n');
      res.write(`data: ${JSON.stringify({ status: 'complete', result, timestamp: Date.now() })}\n\n`);
    } catch (error) {
      console.error('❌ [streamImageAnalysisController] Analysis error:', error);
      
      // Send error event
      res.write('event: error\n');
      res.write(
        `data: ${JSON.stringify({
          error: error.message || 'Analysis failed',
          code: error.statusCode || 500,
          timestamp: Date.now(),
        })}\n\n`
      );
    }

    // Send done event and close connection
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('❌ [streamImageAnalysisController] Stream initialization error:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Stream initialization failed',
      });
    } else {
      res.write('event: error\n');
      res.write(
        `data: ${JSON.stringify({
          error: 'Stream initialization failed',
          timestamp: Date.now(),
        })}\n\n`
      );
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
};
