import PlantBox from './plantBox.model.js';
import { httpError } from '../../common/utils/http.js';
import { getWeatherData } from '../weather/weather.service.js';
import { generateCareStrategy } from './plantBoxCareStrategy.service.js';

/**
 * Get all plant boxes for a user
 * @param {object} params - Parameters
 * @param {string} params.userId - User ID (required)
 * @param {string} params.plantType - Filter by type: 'existing', 'planned', or null for all
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 20)
 * @returns {Promise<object>} Plant boxes list with pagination
 */
export const getUserPlantBoxes = async ({
  userId,
  plantType = null,
  page = 1,
  limit = 20,
}) => {
  try {
    if (!userId) {
      throw httpError(400, 'User ID is required');
    }

    const skip = (page - 1) * limit;
    const query = { user: userId, isActive: true };

    if (plantType) {
      query.plantType = plantType;
    }

    const [plantBoxes, total] = await Promise.all([
      PlantBox.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PlantBox.countDocuments(query),
    ]);

    return {
      plantBoxes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to get plant boxes: ${error.message}`);
  }
};

/**
 * Get plant box by ID
 * @param {object} params - Parameters
 * @param {string} params.boxId - Plant box ID (required)
 * @param {string} params.userId - User ID (required, for ownership check)
 * @returns {Promise<object>} Plant box details
 */
export const getPlantBoxById = async ({ boxId, userId }) => {
  try {
    if (!boxId) {
      throw httpError(400, 'Plant box ID is required');
    }
    if (!userId) {
      throw httpError(400, 'User ID is required');
    }

    const plantBox = await PlantBox.findOne({
      _id: boxId,
      user: userId,
    }).lean();

    if (!plantBox) {
      throw httpError(404, 'Plant box not found');
    }

    return plantBox;
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to get plant box: ${error.message}`);
  }
};

/**
 * Create new plant box
 * @param {object} params - Parameters
 * @param {string} params.userId - User ID (required)
 * @param {object} params.data - Plant box data
 * @returns {Promise<object>} Created plant box
 */
export const createPlantBox = async ({ userId, data }) => {
  try {
    if (!userId) {
      throw httpError(400, 'User ID is required');
    }

    const plantBox = await PlantBox.create({
      user: userId,
      ...data,
    });

    // Generate initial care strategy if plant is existing
    if (plantBox.plantType === 'existing' && plantBox.location.coordinates) {
      try {
        const weather = await getWeatherData({
          lat: plantBox.location.coordinates.lat,
          lon: plantBox.location.coordinates.lon,
        });

        const careStrategy = await generateCareStrategy({
          plantBox: plantBox.toObject(),
          weather,
        });

        plantBox.careStrategy = careStrategy;
        await plantBox.save();
      } catch (error) {
        console.warn('Failed to generate initial care strategy:', error.message);
      }
    }

    return plantBox;
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to create plant box: ${error.message}`);
  }
};

/**
 * Update plant box
 * @param {object} params - Parameters
 * @param {string} params.boxId - Plant box ID (required)
 * @param {string} params.userId - User ID (required)
 * @param {object} params.data - Update data
 * @returns {Promise<object>} Updated plant box
 */
export const updatePlantBox = async ({ boxId, userId, data }) => {
  try {
    if (!boxId) {
      throw httpError(400, 'Plant box ID is required');
    }
    if (!userId) {
      throw httpError(400, 'User ID is required');
    }

    const plantBox = await PlantBox.findOneAndUpdate(
      { _id: boxId, user: userId },
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!plantBox) {
      throw httpError(404, 'Plant box not found');
    }

    // Regenerate care strategy if location or plant info changed
    if (
      (data.location || data.plantName || data.plantType) &&
      plantBox.location.coordinates
    ) {
      try {
        const weather = await getWeatherData({
          lat: plantBox.location.coordinates.lat,
          lon: plantBox.location.coordinates.lon,
        });

        const careStrategy = await generateCareStrategy({
          plantBox: plantBox.toObject(),
          weather,
        });

        plantBox.careStrategy = careStrategy;
        await plantBox.save();
      } catch (error) {
        console.warn('Failed to regenerate care strategy:', error.message);
      }
    }

    return plantBox;
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to update plant box: ${error.message}`);
  }
};

/**
 * Delete plant box (soft delete)
 * @param {object} params - Parameters
 * @param {string} params.boxId - Plant box ID (required)
 * @param {string} params.userId - User ID (required)
 * @returns {Promise<object>} Deletion result
 */
export const deletePlantBox = async ({ boxId, userId }) => {
  try {
    if (!boxId) {
      throw httpError(400, 'Plant box ID is required');
    }
    if (!userId) {
      throw httpError(400, 'User ID is required');
    }

    const plantBox = await PlantBox.findOneAndUpdate(
      { _id: boxId, user: userId },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!plantBox) {
      throw httpError(404, 'Plant box not found');
    }

    return { success: true, message: 'Plant box deleted successfully' };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to delete plant box: ${error.message}`);
  }
};

/**
 * Refresh care strategy for a plant box
 * @param {object} params - Parameters
 * @param {string} params.boxId - Plant box ID (required)
 * @param {string} params.userId - User ID (required)
 * @returns {Promise<object>} Updated plant box with new strategy
 */
export const refreshCareStrategy = async ({ boxId, userId }) => {
  try {
    if (!boxId) {
      throw httpError(400, 'Plant box ID is required');
    }
    if (!userId) {
      throw httpError(400, 'User ID is required');
    }

    const plantBox = await PlantBox.findOne({
      _id: boxId,
      user: userId,
    });

    if (!plantBox) {
      throw httpError(404, 'Plant box not found');
    }

    if (!plantBox.location.coordinates) {
      throw httpError(400, 'Location coordinates are required to generate care strategy');
    }

    // Get weather data
    const weather = await getWeatherData({
      lat: plantBox.location.coordinates.lat,
      lon: plantBox.location.coordinates.lon,
    });

    // Generate new care strategy
    const careStrategy = await generateCareStrategy({
      plantBox: plantBox.toObject(),
      weather,
    });

    // Update plant box
    plantBox.careStrategy = careStrategy;
    await plantBox.save();

    return plantBox;
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to refresh care strategy: ${error.message}`);
  }
};

/**
 * Add note to plant box
 * @param {object} params - Parameters
 * @param {string} params.boxId - Plant box ID (required)
 * @param {string} params.userId - User ID (required)
 * @param {object} params.note - Note data
 * @returns {Promise<object>} Updated plant box
 */
export const addNote = async ({ boxId, userId, note }) => {
  try {
    if (!boxId) {
      throw httpError(400, 'Plant box ID is required');
    }
    if (!userId) {
      throw httpError(400, 'User ID is required');
    }

    const plantBox = await PlantBox.findOneAndUpdate(
      { _id: boxId, user: userId },
      { $push: { notes: note } },
      { new: true }
    );

    if (!plantBox) {
      throw httpError(404, 'Plant box not found');
    }

    return plantBox;
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to add note: ${error.message}`);
  }
};

/**
 * Add image to plant box
 * @param {object} params - Parameters
 * @param {string} params.boxId - Plant box ID (required)
 * @param {string} params.userId - User ID (required)
 * @param {object} params.image - Image data
 * @returns {Promise<object>} Updated plant box
 */
export const addImage = async ({ boxId, userId, image }) => {
  try {
    if (!boxId) {
      throw httpError(400, 'Plant box ID is required');
    }
    if (!userId) {
      throw httpError(400, 'User ID is required');
    }

    const plantBox = await PlantBox.findOneAndUpdate(
      { _id: boxId, user: userId },
      { $push: { images: image } },
      { new: true }
    );

    if (!plantBox) {
      throw httpError(404, 'Plant box not found');
    }

    return plantBox;
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to add image: ${error.message}`);
  }
};

/**
 * Add feedback for a disease
 * @param {object} params - Parameters
 * @param {string} params.boxId - Plant box ID
 * @param {string} params.userId - User ID
 * @param {string} params.diseaseIndex - Index of disease in currentDiseases array
 * @param {object} params.feedback - Feedback data { status, notes }
 * @returns {Promise<object>} Updated plant box
 */
export const addDiseaseFeedback = async ({ boxId, userId, diseaseIndex, feedback }) => {
  try {
    if (!boxId) {
      throw httpError(400, 'Plant box ID is required');
    }
    if (!userId) {
      throw httpError(400, 'User ID is required');
    }
    if (diseaseIndex === undefined || diseaseIndex === null) {
      throw httpError(400, 'Disease index is required');
    }

    const plantBox = await PlantBox.findOne({ _id: boxId, user: userId });
    if (!plantBox) {
      throw httpError(404, 'Plant box not found');
    }

    if (!plantBox.currentDiseases || !plantBox.currentDiseases[diseaseIndex]) {
      throw httpError(404, 'Disease not found');
    }

    // Add feedback to disease
    const disease = plantBox.currentDiseases[diseaseIndex];
    if (!disease.feedback) {
      disease.feedback = [];
    }
    
    disease.feedback.push({
      date: new Date(),
      status: feedback.status,
      notes: feedback.notes || '',
    });

    // Update disease status based on feedback
    if (feedback.status === 'resolved') {
      disease.status = 'resolved';
    } else if (feedback.status === 'better' && disease.status === 'active') {
      disease.status = 'treating';
    } else if (feedback.status === 'worse' && disease.status === 'treating') {
      disease.status = 'active';
    }

    await plantBox.save();

    return plantBox;
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to add disease feedback: ${error.message}`);
  }
};

export default {
  getUserPlantBoxes,
  getPlantBoxById,
  createPlantBox,
  updatePlantBox,
  deletePlantBox,
  refreshCareStrategy,
  addNote,
  addImage,
  addDiseaseFeedback,
};

