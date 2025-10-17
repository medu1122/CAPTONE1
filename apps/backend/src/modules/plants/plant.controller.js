import { 
  getAllPlants, 
  getPlantById, 
  searchPlants, 
  getPlantsByCategory,
  createPlant,
  updatePlant,
  deletePlant
} from './plant.service.js';
import { httpError } from '../../common/utils/http.js';

/**
 * Get all plants with pagination and filtering
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const getPlants = async (req, res) => {
  try {
    const { page, limit, category, search } = req.query;

    const result = await getAllPlants({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      category,
      search,
    });

    res.json({
      success: true,
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
 * Get plant by ID
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const getPlant = async (req, res) => {
  try {
    const { id } = req.params;

    const plant = await getPlantById({ plantId: id });

    res.json({
      success: true,
      data: plant,
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
 * Search plants
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const searchPlantsController = async (req, res) => {
  try {
    const { q, limit } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const result = await searchPlants({
      query: q,
      limit: limit ? parseInt(limit) : 10,
    });

    res.json({
      success: true,
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
 * Get plants by category
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const getPlantsByCategoryController = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit } = req.query;

    const result = await getPlantsByCategory({
      category,
      limit: limit ? parseInt(limit) : 20,
    });

    res.json({
      success: true,
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
 * Create new plant
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const createPlantController = async (req, res) => {
  try {
    const plantData = req.body;
    const userId = req.user?.id; // From auth middleware

    if (!userId) {
      throw httpError(401, 'Authentication required');
    }

    const plant = await createPlant({
      plantData,
      userId,
    });

    res.status(201).json({
      success: true,
      data: plant,
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
 * Update plant
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const updatePlantController = async (req, res) => {
  try {
    const { id } = req.params;
    const plantData = req.body;
    const userId = req.user?.id; // From auth middleware

    if (!userId) {
      throw httpError(401, 'Authentication required');
    }

    const plant = await updatePlant({
      plantId: id,
      plantData,
      userId,
    });

    res.json({
      success: true,
      data: plant,
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
 * Delete plant
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const deletePlantController = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // From auth middleware

    if (!userId) {
      throw httpError(401, 'Authentication required');
    }

    const result = await deletePlant({
      plantId: id,
      userId,
    });

    res.json({
      success: true,
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
  getPlants,
  getPlant,
  searchPlantsController,
  getPlantsByCategoryController,
  createPlantController,
  updatePlantController,
  deletePlantController,
};