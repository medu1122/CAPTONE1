import { analyzeImage, getAnalysisHistory, getAnalysisById } from './analyze.service.js';
import { httpError } from '../../common/utils/http.js';

/**
 * Analyze Controller - Image Analysis Endpoints
 */

/**
 * POST /api/v1/analyze/image
 * Analyze plant image
 */
export const analyzeImageController = async (req, res, next) => {
  try {
    const { imageUrl } = req.body;
    const userId = req.user?.id || null;

    if (!imageUrl) {
      throw httpError(400, 'imageUrl is required');
    }

    console.log('📸 [analyzeImageController] Request:', { imageUrl: imageUrl.substring(0, 50), userId });

    const result = await analyzeImage({ imageUrl, userId });

    // Save analysis to database if user is logged in
    if (userId) {
      try {
        const { default: Analysis } = await import('../analyses/analysis.model.js');
        
        const analysisRecord = new Analysis({
          userId,
          imageUrl,
          resultTop: {
            plant: result.plant,
            disease: result.diseases[0] || null,
            confidence: result.diseases[0]?.confidence || result.plant.confidence,
            isHealthy: result.isHealthy
          },
          allDiseases: result.diseases,
          treatments: result.treatments,
          care: result.care,
          source: 'analyze-page'
        });

        await analysisRecord.save();
        
        console.log('💾 [analyzeImageController] Analysis saved:', analysisRecord._id);
        
        // Add ID to result
        result.analysisId = analysisRecord._id;
      } catch (error) {
        console.error('Failed to save analysis:', error);
        // Don't fail the request if save fails
      }
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ [analyzeImageController] Error:', error);
    next(error);
  }
};

/**
 * GET /api/v1/analyze/history
 * Get user's analysis history
 */
export const getHistoryController = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const limit = parseInt(req.query.limit) || 10;

    if (!userId) {
      throw httpError(401, 'Authentication required');
    }

    const analyses = await getAnalysisHistory({ userId, limit });

    res.json({
      success: true,
      data: analyses,
      count: analyses.length
    });

  } catch (error) {
    console.error('❌ [getHistoryController] Error:', error);
    next(error);
  }
};

/**
 * GET /api/v1/analyze/:id
 * Get single analysis by ID
 */
export const getAnalysisByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw httpError(401, 'Authentication required');
    }

    if (!id) {
      throw httpError(400, 'Analysis ID is required');
    }

    const analysis = await getAnalysisById({ analysisId: id, userId });

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('❌ [getAnalysisByIdController] Error:', error);
    next(error);
  }
};
