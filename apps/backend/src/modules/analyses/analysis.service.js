import mongoose from 'mongoose';
import Analysis from './analysis.model.js';
import { httpError } from '../../common/utils/http.js';

/**
 * Get all analyses for a user (My Plants)
 * @param {object} params - Parameters
 * @param {string} params.userId - User ID (required)
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 20)
 * @param {string} params.status - Filter by status: 'all', 'healthy', 'disease', 'warning' (optional)
 * @param {string} params.search - Search query (optional)
 * @param {string} params.sortBy - Sort by: 'newest', 'oldest', 'nameAsc', 'nameDesc' (default: 'newest')
 * @returns {Promise<object>} Analyses list with pagination
 */
export const getUserAnalyses = async ({
  userId,
  page = 1,
  limit = 20,
  status = 'all',
  search = null,
  sortBy = 'newest',
}) => {
  try {
    if (!userId) {
      throw httpError(400, 'User ID is required');
    }

    const skip = (page - 1) * limit;

    // Build query
    const query = { user: userId };

    // Filter by status (based on disease presence and confidence)
    if (status !== 'all') {
      if (status === 'healthy') {
        query['resultTop.plant'] = { $exists: true };
        // Healthy: has plant, no disease in raw data, confidence > 0.7
        query.$or = [
          { 'raw.disease': { $exists: false } },
          { 'raw.disease': null },
          { 'raw.isHealthy': true },
        ];
        query['resultTop.confidence'] = { $gte: 0.7 };
      } else if (status === 'disease') {
        // Disease: has disease in raw data
        query['raw.disease'] = { $exists: true, $ne: null };
        query['raw.isHealthy'] = { $ne: true };
      } else if (status === 'warning') {
        // Warning: low confidence or uncertain
        query.$or = [
          { 'resultTop.confidence': { $lt: 0.7 } },
          { 'raw.isHealthy': false },
        ];
      }
    }

    // Search filter
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        ...(query.$or || []),
        { 'resultTop.plant.commonName': searchRegex },
        { 'resultTop.plant.scientificName': searchRegex },
      ];
    }

    // Build sort
    let sort = {};
    switch (sortBy) {
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'nameAsc':
        sort = { 'resultTop.plant.commonName': 1 };
        break;
      case 'nameDesc':
        sort = { 'resultTop.plant.commonName': -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const [analyses, total] = await Promise.all([
      Analysis.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Analysis.countDocuments(query),
    ]);

    // Transform analyses to Plant format for frontend
    const plants = analyses.map((analysis) => {
      const plant = analysis.resultTop?.plant || {};
      const confidence = analysis.resultTop?.confidence || 0;
      const raw = analysis.raw || {};
      
      // Determine status
      let status = 'healthy';
      if (raw.disease && raw.disease.name) {
        status = 'disease';
      } else if (confidence < 0.7 || raw.isHealthy === false) {
        status = 'warning';
      }

      return {
        id: analysis._id.toString(),
        name: plant.commonName || 'Không xác định',
        scientificName: plant.scientificName || 'Unknown',
        imageUrl: analysis.inputImages?.[0]?.url || analysis.inputImages?.[0]?.base64 || '',
        status,
        confidence: Math.round(confidence * 100),
        disease: raw.disease?.name
          ? {
              name: raw.disease.name,
              description: raw.disease.description || '',
            }
          : undefined,
        analyzedAt: analysis.createdAt.toISOString(),
        createdAt: analysis.createdAt.toISOString(),
      };
    });

    return {
      plants,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to get user analyses: ${error.message}`);
  }
};

/**
 * Get analysis by ID
 * @param {object} params - Parameters
 * @param {string} params.analysisId - Analysis ID (required)
 * @param {string} params.userId - User ID (required, for ownership check)
 * @returns {Promise<object>} Analysis details
 */
export const getAnalysisById = async ({ analysisId, userId }) => {
  try {
    if (!analysisId) {
      throw httpError(400, 'Analysis ID is required');
    }
    if (!userId) {
      throw httpError(400, 'User ID is required');
    }

    const analysis = await Analysis.findOne({
      _id: analysisId,
      user: userId,
    }).lean();

    if (!analysis) {
      throw httpError(404, 'Analysis not found');
    }

    return analysis;
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to get analysis: ${error.message}`);
  }
};

/**
 * Create analysis record
 * @param {object} params - Parameters
 * @param {string} params.userId - User ID (required)
 * @param {string} params.source - Source: 'plantid', 'manual', 'ai' (default: 'plantid')
 * @param {Array} params.inputImages - Input images array
 * @param {object} params.resultTop - Top result object
 * @param {object} params.raw - Raw API response
 * @returns {Promise<object>} Created analysis
 */
export const createAnalysis = async ({
  userId,
  source = 'plantid',
  inputImages = [],
  resultTop = null,
  raw = null,
}) => {
  try {
    if (!userId) {
      throw httpError(400, 'User ID is required');
    }

    // Convert userId string to ObjectId if needed
    const userObjectId = typeof userId === 'string' 
      ? new mongoose.Types.ObjectId(userId) 
      : userId;

    const analysis = await Analysis.create({
      user: userObjectId,
      source,
      inputImages,
      resultTop,
      raw,
    });

    return analysis;
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to create analysis: ${error.message}`);
  }
};

/**
 * Delete analysis by ID
 * @param {object} params - Parameters
 * @param {string} params.analysisId - Analysis ID (required)
 * @param {string} params.userId - User ID (required, for ownership check)
 * @returns {Promise<object>} Deletion result
 */
export const deleteAnalysis = async ({ analysisId, userId }) => {
  try {
    if (!analysisId) {
      throw httpError(400, 'Analysis ID is required');
    }
    if (!userId) {
      throw httpError(400, 'User ID is required');
    }

    const analysis = await Analysis.findOneAndDelete({
      _id: analysisId,
      user: userId,
    });

    if (!analysis) {
      throw httpError(404, 'Analysis not found');
    }

    return { success: true, message: 'Analysis deleted successfully' };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to delete analysis: ${error.message}`);
  }
};

export default {
  getUserAnalyses,
  getAnalysisById,
  createAnalysis,
  deleteAnalysis,
};

