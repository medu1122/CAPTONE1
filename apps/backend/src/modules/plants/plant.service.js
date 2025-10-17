import Plant from './plant.model.js';
import { httpError } from '../../common/utils/http.js';

/**
 * Get all plants with pagination and filtering
 * @param {object} params - Parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 20)
 * @param {string} params.category - Filter by category (optional)
 * @param {string} params.search - Search query (optional)
 * @returns {Promise<object>} Plants list with pagination
 */
export const getAllPlants = async ({ 
  page = 1, 
  limit = 20, 
  category = null, 
  search = null 
}) => {
  try {
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (search && search.trim()) {
      query.$text = { $search: search.trim() };
    }

    const [plants, total] = await Promise.all([
      Plant.find(query)
        .sort(search ? { score: { $meta: 'textScore' } } : { name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Plant.countDocuments(query),
    ]);

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
    throw httpError(500, `Failed to get plants: ${error.message}`);
  }
};

/**
 * Get plant by ID
 * @param {object} params - Parameters
 * @param {string} params.plantId - Plant ID
 * @returns {Promise<object>} Plant details
 */
export const getPlantById = async ({ plantId }) => {
  try {
    if (!plantId) {
      throw httpError(400, 'Plant ID is required');
    }

    const plant = await Plant.findById(plantId).lean();

    if (!plant) {
      throw httpError(404, 'Plant not found');
    }

    return plant;
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to get plant: ${error.message}`);
  }
};

/**
 * Search plants by query
 * @param {object} params - Parameters
 * @param {string} params.query - Search query
 * @param {number} params.limit - Number of results (default: 10)
 * @returns {Promise<object>} Search results
 */
export const searchPlants = async ({ query, limit = 10 }) => {
  try {
    if (!query || query.trim().length < 2) {
      throw httpError(400, 'Search query must be at least 2 characters');
    }

    const plants = await Plant.find(
      { $text: { $search: query.trim() } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .lean();

    return {
      plants,
      query: query.trim(),
      total: plants.length,
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Plant search failed: ${error.message}`);
  }
};

/**
 * Get plants by category
 * @param {object} params - Parameters
 * @param {string} params.category - Plant category
 * @param {number} params.limit - Number of results (default: 20)
 * @returns {Promise<object>} Plants by category
 */
export const getPlantsByCategory = async ({ category, limit = 20 }) => {
  try {
    if (!category) {
      throw httpError(400, 'Category is required');
    }

    const plants = await Plant.find({ category })
      .sort({ name: 1 })
      .limit(limit)
      .lean();

    return {
      category,
      plants,
      total: plants.length,
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to get plants by category: ${error.message}`);
  }
};

/**
 * Get plant care information for AI context
 * @param {object} params - Parameters
 * @param {string} params.plantName - Plant name (common or scientific)
 * @returns {Promise<object>} Plant care information
 */
export const getPlantCareInfo = async ({ plantName }) => {
  try {
    if (!plantName) {
      throw httpError(400, 'Plant name is required');
    }

    const plant = await Plant.findOne({
      $or: [
        { name: { $regex: plantName, $options: 'i' } },
        { scientificName: { $regex: plantName, $options: 'i' } }
      ]
    }).lean();

    if (!plant) {
      return null; // Return null if plant not found
    }

    // Return only care-related information for AI context
    return {
      name: plant.name,
      scientificName: plant.scientificName,
      careInstructions: plant.careInstructions,
      commonDiseases: plant.commonDiseases,
      growthStages: plant.growthStages,
      category: plant.category,
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to get plant care info: ${error.message}`);
  }
};

/**
 * Create new plant
 * @param {object} params - Parameters
 * @param {object} params.plantData - Plant data
 * @param {string} params.userId - User ID
 * @returns {Promise<object>} Created plant
 */
export const createPlant = async ({ plantData, userId }) => {
  try {
    if (!userId) {
      throw httpError(400, 'User ID is required');
    }

    const plant = new Plant({
      ...plantData,
      createdBy: userId,
    });

    const savedPlant = await plant.save();
    return savedPlant;
  } catch (error) {
    if (error.name === 'ValidationError') {
      throw httpError(400, error.message);
    }
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to create plant: ${error.message}`);
  }
};

/**
 * Update plant
 * @param {object} params - Parameters
 * @param {string} params.plantId - Plant ID
 * @param {object} params.plantData - Updated plant data
 * @param {string} params.userId - User ID
 * @returns {Promise<object>} Updated plant
 */
export const updatePlant = async ({ plantId, plantData, userId }) => {
  try {
    if (!plantId) {
      throw httpError(400, 'Plant ID is required');
    }

    const plant = await Plant.findOneAndUpdate(
      { _id: plantId, createdBy: userId },
      plantData,
      { new: true, runValidators: true }
    );

    if (!plant) {
      throw httpError(404, 'Plant not found or access denied');
    }

    return plant;
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to update plant: ${error.message}`);
  }
};

/**
 * Delete plant
 * @param {object} params - Parameters
 * @param {string} params.plantId - Plant ID
 * @param {string} params.userId - User ID
 * @returns {Promise<object>} Deletion result
 */
export const deletePlant = async ({ plantId, userId }) => {
  try {
    if (!plantId) {
      throw httpError(400, 'Plant ID is required');
    }

    const plant = await Plant.findOneAndDelete({
      _id: plantId,
      createdBy: userId
    });

    if (!plant) {
      throw httpError(404, 'Plant not found or access denied');
    }

    return {
      plantId,
      deleted: true,
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to delete plant: ${error.message}`);
  }
};

export default {
  getAllPlants,
  getPlantById,
  searchPlants,
  getPlantsByCategory,
  getPlantCareInfo,
  createPlant,
  updatePlant,
  deletePlant,
};
