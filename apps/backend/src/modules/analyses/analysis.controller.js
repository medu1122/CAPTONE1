import {
  getUserAnalyses,
  getAnalysisById,
  deleteAnalysis,
} from './analysis.service.js';
import { httpError } from '../../common/utils/http.js';

/**
 * Get all analyses for current user (My Plants)
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const getMyPlants = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { page, limit, status, search, sortBy } = req.query;

    const result = await getUserAnalyses({
      userId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status: status || 'all',
      search: search || null,
      sortBy: sortBy || 'newest',
    });

    res.json({
      success: true,
      message: 'Analyses retrieved successfully',
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get analysis by ID
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const getAnalysis = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { id } = req.params;

    const analysis = await getAnalysisById({
      analysisId: id,
      userId,
    });

    res.json({
      success: true,
      message: 'Analysis retrieved successfully',
      data: analysis,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Delete analysis by ID
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const deleteAnalysisById = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { id } = req.params;

    const result = await deleteAnalysis({
      analysisId: id,
      userId,
    });

    res.json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export default {
  getMyPlants,
  getAnalysis,
  deleteAnalysisById,
};

