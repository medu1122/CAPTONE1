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

    // Save analysis to database (always, even for anonymous users)
    try {
      const { default: Analysis } = await import('../analyses/analysis.model.js');
      
      // Format inputImages
      const inputImages = [{ url: imageUrl }];
      
      // Format resultTop according to model schema
      const resultTop = result.plant?.commonName ? {
        plant: {
          commonName: result.plant.commonName || '',
          scientificName: result.plant.scientificName || '',
        },
        confidence: result.plant.confidence || 0,
        summary: result.isHealthy ? 'Cây khỏe mạnh' : `Phát hiện ${result.diseases?.length || 0} bệnh`,
      } : null;
      
      // Format raw data with all analysis results
      const raw = {
        plant: result.plant,
        diseases: result.diseases || [],
        isHealthy: result.isHealthy,
        treatments: result.treatments,
        care: result.care,
        analyzedAt: result.analyzedAt || new Date(),
      };

      const analysisData = {
        user: userId || null, // Allow null for anonymous users
        source: 'plantid',
        inputImages,
        resultTop,
        raw,
      };

      console.log('💾 [analyzeImageController] Attempting to save analysis:', {
        hasUser: !!userId,
        hasPlant: !!resultTop?.plant?.commonName,
        hasDiseases: (result.diseases?.length || 0) > 0,
        inputImagesCount: inputImages.length,
      });

      const analysisRecord = new Analysis(analysisData);
      await analysisRecord.save();
      
      console.log('✅ [analyzeImageController] Analysis saved successfully:', {
        id: analysisRecord._id.toString(),
        userId: userId || 'anonymous',
        createdAt: analysisRecord.createdAt?.toISOString(),
        hasPlant: !!resultTop?.plant?.commonName,
        hasDiseases: (result.diseases?.length || 0) > 0,
      });
      
      // Add ID to result
      result.analysisId = analysisRecord._id.toString();
    } catch (error) {
      console.error('❌ [analyzeImageController] Failed to save analysis:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
        errors: error.errors, // Mongoose validation errors
      });
      // Don't fail the request if save fails, but log it clearly
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
