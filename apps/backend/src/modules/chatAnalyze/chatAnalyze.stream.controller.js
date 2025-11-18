import {
  processTextOnly,
  processImageOnly,
  processImageText,
} from './chatAnalyze.service.js';

/**
 * SSE Streaming Controller for Chat Analyze
 * Handles real-time chat responses with Server-Sent Events
 */

/**
 * Stream Chat Analyze Response with SSE
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const streamChatAnalyze = async (req, res) => {
  try {
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    });

    // Disable timeout for SSE
    res.setTimeout(0);

    // Send initial connection event
    res.write('event: connected\n');
    res.write(`data: ${JSON.stringify({ status: 'connected', timestamp: Date.now() })}\n\n`);

    // Get request parameters from body
    const { message, imageUrl, imageData, weather, sessionId } = req.body || {};
    const userId = req.user?.id || null; // Support guest users

    console.log('🔐 Auth Debug:', {
      hasAuthHeader: !!req.headers.authorization,
      authHeader: req.headers.authorization ? req.headers.authorization.substring(0, 30) + '...' : 'none',
      hasReqUser: !!req.user,
      reqUser: req.user,
      userId,
      userIdType: typeof userId,
      userIdValue: userId
    });

    console.log('📡 SSE Stream started:', { 
      hasMessage: !!message, 
      hasImageUrl: !!imageUrl,
      hasImageData: !!imageData,
      sessionId,
      userId 
    });

    // Validate input
    if (!message && !imageUrl && !imageData) {
      res.write('event: error\n');
      res.write(`data: ${JSON.stringify({ error: 'Either message or image is required' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // Send processing started event
    res.write('event: processing\n');
    res.write(`data: ${JSON.stringify({ status: 'processing', message: 'Starting analysis...' })}\n\n`);

    try {
      let result;
      
      // Determine analysis type and process
      if (imageUrl || imageData) {
        const image = imageData || imageUrl;
        
        if (message) {
          // Image + Text
          console.log('🖼️📝 Processing image + text');
          res.write('event: analysis\n');
          res.write(`data: ${JSON.stringify({ type: 'image-text', message: 'Analyzing image and text...' })}\n\n`);
          
          result = await processImageText({
            message,
            imageData: image,
            sessionId,
            userId,
            weatherContext: weather,
            onStream: (chunk) => {
              res.write('event: chunk\n');
              res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
            },
          });
        } else {
          // Image only
          console.log('🖼️ Processing image only');
          res.write('event: analysis\n');
          res.write(`data: ${JSON.stringify({ type: 'image-only', message: 'Analyzing image...' })}\n\n`);
          
          result = await processImageOnly({
            imageData: image,
            sessionId,
            userId,
            weatherContext: weather,
            onStream: (chunk) => {
              res.write('event: chunk\n');
              res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
            },
          });
        }
      } else {
        // Text only
        console.log('📝 Processing text only');
        res.write('event: analysis\n');
        res.write(`data: ${JSON.stringify({ type: 'text-only', message: 'Processing message...' })}\n\n`);
        
        result = await processTextOnly({
          message,
          sessionId,
          userId,
          weatherContext: weather,
          onStream: (chunk) => {
            res.write('event: chunk\n');
            res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
          },
        });
      }

      // Save messages to database if sessionId exists
      if (sessionId && result) {
        try {
          const { saveMessageWithAnalysis } = await import('../chats/chat.service.js');
          const { createAnalysis } = await import('../analyses/analysis.service.js');

          // Create Analysis record FIRST if image was analyzed
          let analysisId = null;
          console.log('🔍 Analysis Save Check:', {
            hasAnalysis: !!result.analysis,
            hasImage: !!(imageData || imageUrl),
            hasUserId: !!userId,
            userId: userId,
            willSave: !!(result.analysis && (imageData || imageUrl) && userId)
          });
          
          if (result.analysis && (imageData || imageUrl) && userId) {
            // Format inputImages according to model
            const inputImages = [];
            if (imageUrl) {
              inputImages.push({ url: imageUrl });
            } else if (imageData) {
              // Check if it's base64 or URL
              if (imageData.startsWith('data:') || imageData.startsWith('/9j/') || imageData.startsWith('iVBORw0KGgo')) {
                inputImages.push({ base64: imageData });
              } else {
                inputImages.push({ url: imageData });
              }
            }

            // Format resultTop according to model
            const resultTop = result.analysis.plant
              ? {
                  plant: {
                    commonName: result.analysis.plant.commonName || '',
                    scientificName: result.analysis.plant.scientificName || '',
                  },
                  confidence: result.analysis.confidence || 0,
                  summary: result.analysis.summary || '',
                }
              : null;

            // Create analysis using service
            const analysisRecord = await createAnalysis({
              userId,
              source: 'plantid',
              inputImages,
              resultTop,
              raw: result.analysis,
            });
            analysisId = analysisRecord._id;
            console.log('💾 Saved analysis record:', analysisId);
          } else {
            console.warn('⚠️ Analysis NOT saved. Reasons:', {
              hasAnalysis: !!result.analysis,
              hasImage: !!(imageData || imageUrl),
              hasUserId: !!userId,
              userId: userId
            });
          }

          // Save user message WITH analysisId (so we can populate later)
          await saveMessageWithAnalysis({
            sessionId,
            userId,
            role: 'user',
            message: message || '[Image]',
            messageType: (imageData || imageUrl) ? 'image' : 'text',
            analysisId: analysisId  // ← Link user message to analysis
          });

          // Save assistant response
          await saveMessageWithAnalysis({
            sessionId,
            userId,
            role: 'assistant',
            message: result.response || '[Analysis result]',  // ← 'message' not 'content'
            messageType: result.analysis ? 'analysis' : 'text',
            analysisId: analysisId  // ← 'analysisId' not 'analysis'
          });

          console.log('💾 Saved messages to database');
        } catch (error) {
          console.error('Failed to save messages:', error.message);
        }
      }

      // Send completion event
      res.write('event: complete\n');
      res.write(`data: ${JSON.stringify({ status: 'complete', result })}\n\n`);

      console.log('✅ SSE Stream completed');

    } catch (error) {
      console.error('❌ SSE Stream processing error:', error);
      
      // Send error event
      res.write('event: error\n');
      res.write(`data: ${JSON.stringify({ 
        error: error.message || 'Processing failed',
        code: 'PROCESSING_ERROR' 
      })}\n\n`);
    }

    // Send done event and close connection
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('❌ SSE Stream initialization error:', error);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false,
        message: 'Stream initialization failed',
        error: error.message 
      });
    } else {
      res.write('event: error\n');
      res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
};

export default {
  streamChatAnalyze,
};

