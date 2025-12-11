import {
  getUserPlantBoxes,
  getPlantBoxById,
  createPlantBox,
  updatePlantBox,
  deletePlantBox,
  refreshCareStrategy,
  addNote,
  addImage,
  addDiseaseFeedback,
  analyzeTaskAction,
  deleteDisease,
  addDisease,
  updateDiseaseTreatments,
} from './plantBox.service.js';
import { generatePlantBoxChatResponse } from './plantBoxChat.service.js';
import { getWeatherData } from '../weather/weather.service.js';
import { httpError } from '../../common/utils/http.js';

/**
 * Get all plant boxes for current user
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const getMyPlantBoxes = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { plantType, page, limit } = req.query;

    const result = await getUserPlantBoxes({
      userId,
      plantType: plantType || null,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });

    res.json({
      success: true,
      message: 'Plant boxes retrieved successfully',
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
 * Get plant box by ID
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const getPlantBox = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { id } = req.params;

    const plantBox = await getPlantBoxById({
      boxId: id,
      userId,
    });

    res.json({
      success: true,
      message: 'Plant box retrieved successfully',
      data: plantBox,
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
 * Create new plant box
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const createPlantBoxController = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const plantBox = await createPlantBox({
      userId,
      data: req.body,
    });

    res.status(201).json({
      success: true,
      message: 'Plant box created successfully',
      data: plantBox,
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
 * Update plant box
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const updatePlantBoxController = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { id } = req.params;

    const plantBox = await updatePlantBox({
      boxId: id,
      userId,
      data: req.body,
    });

    res.json({
      success: true,
      message: 'Plant box updated successfully',
      data: plantBox,
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
 * Delete plant box
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const deletePlantBoxController = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { id } = req.params;

    const result = await deletePlantBox({
      boxId: id,
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

/**
 * Refresh care strategy for plant box
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const refreshStrategy = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { id } = req.params;

    const plantBox = await refreshCareStrategy({
      boxId: id,
      userId,
    });

    res.json({
      success: true,
      message: 'Care strategy refreshed successfully',
      data: plantBox,
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
 * Chat with plant box (mini chat bot)
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const chatWithPlantBox = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    // Get plant box
    const plantBox = await getPlantBoxById({
      boxId: id,
      userId,
    });

    // Get weather data
    let weather = null;
    if (plantBox.location.coordinates) {
      try {
        weather = await getWeatherData({
          lat: plantBox.location.coordinates.lat,
          lon: plantBox.location.coordinates.lon,
        });
      } catch (error) {
        console.warn('Failed to get weather:', error.message);
      }
    }

    // Generate chat response
    const response = await generatePlantBoxChatResponse({
      userMessage: message.trim(),
      plantBox,
      weather: weather || { forecast: [] },
      careStrategy: plantBox.careStrategy || null,
    });

    res.json({
      success: true,
      message: 'Chat response generated successfully',
      data: response.data,
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
 * Add note to plant box
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const addNoteController = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { id } = req.params;
    const { content, type, imageUrl } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Note content is required',
      });
    }

    const plantBox = await addNote({
      boxId: id,
      userId,
      note: {
        content: content.trim(),
        type: type || 'observation',
        date: new Date(),
        imageUrl: imageUrl || undefined,
      },
    });

    res.json({
      success: true,
      message: 'Note added successfully',
      data: plantBox,
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
 * Add image to plant box
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const addImageController = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { id } = req.params;
    const { url, description } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required',
      });
    }

    const plantBox = await addImage({
      boxId: id,
      userId,
      image: {
        url,
        description: description || '',
        date: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Image added successfully',
      data: plantBox,
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
 * Add feedback for a disease
 * @route POST /api/v1/plant-boxes/:id/disease-feedback
 */
export const addDiseaseFeedbackController = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { id } = req.params;
    const { diseaseIndex, status, notes } = req.body;

    if (diseaseIndex === undefined || diseaseIndex === null) {
      return res.status(400).json({
        success: false,
        message: 'Disease index is required',
      });
    }

    if (!status || !['worse', 'same', 'better', 'resolved'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (worse, same, better, resolved)',
      });
    }

    const plantBox = await addDiseaseFeedback({
      boxId: id,
      userId,
      diseaseIndex: parseInt(diseaseIndex),
      feedback: {
        status,
        notes: notes || '',
      },
    });

    res.json({
      success: true,
      message: 'Disease feedback added successfully',
      data: plantBox,
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
 * Analyze a specific task action
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const analyzeTaskController = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { id } = req.params;
    const { dayIndex, actionIndex } = req.body;

    console.log('📡 [analyzeTaskController] Received:', { id, dayIndex, actionIndex, body: req.body });

    // Validation should have already passed, but double check
    if (dayIndex === undefined || dayIndex === null || actionIndex === undefined || actionIndex === null) {
      console.error('❌ [analyzeTaskController] Missing dayIndex or actionIndex:', { dayIndex, actionIndex });
      return res.status(400).json({
        success: false,
        message: 'dayIndex and actionIndex are required',
        received: { dayIndex, actionIndex },
      });
    }

    const parsedDayIndex = parseInt(dayIndex);
    const parsedActionIndex = parseInt(actionIndex);

    if (isNaN(parsedDayIndex) || isNaN(parsedActionIndex)) {
      console.error('❌ [analyzeTaskController] Invalid dayIndex or actionIndex:', { parsedDayIndex, parsedActionIndex });
      return res.status(400).json({
        success: false,
        message: 'dayIndex and actionIndex must be valid numbers',
        received: { dayIndex, actionIndex },
      });
    }

    const result = await analyzeTaskAction({
      boxId: id,
      userId,
      dayIndex: parsedDayIndex,
      actionIndex: parsedActionIndex,
    });

    res.json({
      success: true,
      message: result.cached ? 'Task analysis retrieved from cache' : 'Task analyzed successfully',
      data: result.analysis,
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
 * Delete a disease from plant box
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const deleteDiseaseController = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { id } = req.params;
    const { diseaseIndex } = req.body;

    if (diseaseIndex === undefined || diseaseIndex === null) {
      return res.status(400).json({
        success: false,
        message: 'diseaseIndex is required',
      });
    }

    const plantBox = await deleteDisease({
      boxId: id,
      userId,
      diseaseIndex: parseInt(diseaseIndex),
    });

    res.json({
      success: true,
      message: 'Disease deleted successfully',
      data: plantBox,
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
 * Add a new disease to plant box
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const addDiseaseController = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { id } = req.params;
    const { name, symptoms, severity } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Disease name is required',
      });
    }

    const plantBox = await addDisease({
      boxId: id,
      userId,
      disease: {
        name,
        symptoms: symptoms || '',
        severity: severity || 'moderate',
      },
    });

    res.json({
      success: true,
      message: 'Disease added successfully',
      data: plantBox,
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
 * Update selected treatments for a disease
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const updateDiseaseTreatmentsController = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { id, diseaseIndex } = req.params;
    const { treatments } = req.body;

    const plantBox = await updateDiseaseTreatments({
      boxId: id,
      userId,
      diseaseIndex: parseInt(diseaseIndex),
      treatments,
    });

    res.json({
      success: true,
      message: 'Disease treatments updated successfully',
      data: plantBox,
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
 * Toggle action completed status
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const toggleActionCompletedController = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { id } = req.params;
    const { dayIndex, actionId, completed } = req.body;

    const plantBox = await toggleActionCompleted({
      boxId: id,
      userId,
      dayIndex: parseInt(dayIndex),
      actionId,
      completed,
    });

    res.json({ success: true, message: 'Action status updated successfully', data: plantBox });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export default {
  getMyPlantBoxes,
  getPlantBox,
  createPlantBoxController,
  updatePlantBoxController,
  deletePlantBoxController,
  refreshStrategy,
  chatWithPlantBox,
  addNoteController,
  addImageController,
  addDiseaseFeedbackController,
  analyzeTaskController,
  deleteDiseaseController,
  addDiseaseController,
  updateDiseaseTreatmentsController,
  toggleActionCompletedController,
};

