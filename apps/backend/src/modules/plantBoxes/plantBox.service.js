import PlantBox from './plantBox.model.js';
import { httpError } from '../../common/utils/http.js';
import { getWeatherData } from '../weather/weather.service.js';
import { generateCareStrategy } from './plantBoxCareStrategy.service.js';
import { analyzeTask } from './plantBoxTaskAnalysis.service.js';

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
    console.log(`🔄 [refreshCareStrategy] Generating care strategy for plant box ${boxId}`);
    const careStrategy = await generateCareStrategy({
      plantBox: plantBox.toObject(),
      weather,
    });
    console.log(`✅ [refreshCareStrategy] Care strategy generated successfully`);

    // Update plant box
    plantBox.careStrategy = careStrategy;
    await plantBox.save();
    console.log(`✅ [refreshCareStrategy] Plant box saved successfully`);

    return plantBox;
  } catch (error) {
    console.error(`❌ [refreshCareStrategy] Error for plant box ${boxId}:`, error);
    console.error(`❌ [refreshCareStrategy] Error stack:`, error.stack);
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
      { 
        $push: { 
          notes: {
            date: note.date || new Date(),
            content: note.content || '',
            type: note.type || 'observation',
            imageUrl: note.imageUrl || undefined,
          }
        } 
      },
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
    
    // Initialize severityScore if not exists
    if (disease.severityScore === undefined || disease.severityScore === null) {
      const severityMap = { mild: 3, moderate: 5, severe: 7 };
      disease.severityScore = severityMap[disease.severity] || 5;
    }
    
    disease.feedback.push({
      date: new Date(),
      status: feedback.status,
      notes: feedback.notes || '',
    });

    // Update severity score based on feedback
    // better: -1 point, worse: +2 points, same: +0, resolved: set to 0
    let shouldRegenerateStrategy = false;
    
    if (feedback.status === 'resolved') {
      disease.severityScore = 0;
      disease.status = 'resolved';
      
      // Xóa thuốc đã chọn và plan điều trị khi đã khỏi
      disease.selectedTreatments = undefined;
      disease.treatmentPlan = undefined;
      
      console.log(`✅ [addDiseaseFeedback] Disease "${disease.name}" resolved. Removed selectedTreatments and treatmentPlan.`);
      shouldRegenerateStrategy = true; // Regenerate strategy to remove treatment actions
    } else if (feedback.status === 'better') {
      disease.severityScore = Math.max(0, disease.severityScore - 1);
      if (disease.severityScore <= 0) {
        disease.status = 'resolved';
        // Xóa thuốc đã chọn và plan điều trị khi đã khỏi (từ better)
        disease.selectedTreatments = undefined;
        disease.treatmentPlan = undefined;
        console.log(`✅ [addDiseaseFeedback] Disease "${disease.name}" resolved (from better). Removed selectedTreatments and treatmentPlan.`);
        shouldRegenerateStrategy = true;
      } else if (disease.status === 'active') {
        disease.status = 'treating';
      }
    } else if (feedback.status === 'worse') {
      disease.severityScore = Math.min(10, disease.severityScore + 2);
      if (disease.severityScore >= 7) {
        disease.status = 'active';
      }
    } else if (feedback.status === 'same') {
      // No change in score, but might need to adjust status
      if (disease.severityScore >= 7 && disease.status === 'treating') {
        disease.status = 'active';
      }
    }

    await plantBox.save();

    // Regenerate care strategy if disease is resolved (to remove treatment actions)
    if (shouldRegenerateStrategy && plantBox.location.coordinates) {
      try {
        console.log(`🔄 [addDiseaseFeedback] Regenerating care strategy after disease resolved...`);
        const { getWeatherData } = await import('../weather/weather.service.js');
        const { generateCareStrategy } = await import('./plantBoxCareStrategy.service.js');
        
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
        
        console.log(`✅ [addDiseaseFeedback] Care strategy regenerated successfully (disease resolved).`);
      } catch (strategyError) {
        console.error(`⚠️ [addDiseaseFeedback] Failed to regenerate strategy after disease resolved:`, strategyError);
        // Don't fail the whole operation if strategy regeneration fails
      }
    }

    return plantBox;
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to add disease feedback: ${error.message}`);
  }
};

/**
 * Analyze a specific task and save analysis to database
 * @param {object} params - Parameters
 * @param {string} params.boxId - Plant box ID
 * @param {string} params.userId - User ID
 * @param {number} params.dayIndex - Day index (0-6)
 * @param {number} params.actionIndex - Action index in the day
 * @returns {Promise<object>} Task analysis
 */
export const analyzeTaskAction = async ({ boxId, userId, dayIndex, actionIndex }) => {
  try {
    console.log('🔍 [analyzeTaskAction] Called with:', { boxId, userId, dayIndex, actionIndex, dayIndexType: typeof dayIndex, actionIndexType: typeof actionIndex });
    
    if (!boxId) {
      throw httpError(400, 'Plant box ID is required');
    }
    if (!userId) {
      throw httpError(400, 'User ID is required');
    }
    
    // Ensure dayIndex and actionIndex are numbers
    const parsedDayIndex = typeof dayIndex === 'string' ? parseInt(dayIndex) : dayIndex;
    const parsedActionIndex = typeof actionIndex === 'string' ? parseInt(actionIndex) : actionIndex;
    
    if (isNaN(parsedDayIndex) || parsedDayIndex === undefined || parsedDayIndex === null || parsedDayIndex < 0 || parsedDayIndex > 6) {
      console.error('❌ [analyzeTaskAction] Invalid dayIndex:', { dayIndex, parsedDayIndex });
      throw httpError(400, `Day index must be between 0 and 6, received: ${dayIndex}`);
    }
    if (isNaN(parsedActionIndex) || parsedActionIndex === undefined || parsedActionIndex === null || parsedActionIndex < 0) {
      console.error('❌ [analyzeTaskAction] Invalid actionIndex:', { actionIndex, parsedActionIndex });
      throw httpError(400, `Action index must be >= 0, received: ${actionIndex}`);
    }

    const plantBox = await PlantBox.findOne({ _id: boxId, user: userId });
    if (!plantBox) {
      throw httpError(404, 'Plant box not found');
    }

    console.log('📋 [analyzeTaskAction] Plant box found, checking strategy:', {
      hasStrategy: !!plantBox.careStrategy,
      hasNext7Days: !!(plantBox.careStrategy && plantBox.careStrategy.next7Days),
      daysCount: plantBox.careStrategy?.next7Days?.length || 0,
      dayIndex: parsedDayIndex,
    });

    if (!plantBox.careStrategy || !plantBox.careStrategy.next7Days || !plantBox.careStrategy.next7Days[parsedDayIndex]) {
      console.error('❌ [analyzeTaskAction] Day not found:', { parsedDayIndex, daysCount: plantBox.careStrategy?.next7Days?.length });
      throw httpError(404, `Day not found in care strategy. Day index: ${parsedDayIndex}, Available days: ${plantBox.careStrategy?.next7Days?.length || 0}`);
    }

    const day = plantBox.careStrategy.next7Days[parsedDayIndex];
    console.log('📋 [analyzeTaskAction] Day found, checking actions:', {
      actionsCount: day.actions?.length || 0,
      actionIndex: parsedActionIndex,
    });

    if (!day.actions || !day.actions[parsedActionIndex]) {
      console.error('❌ [analyzeTaskAction] Action not found:', { parsedActionIndex, actionsCount: day.actions?.length || 0 });
      throw httpError(404, `Action not found. Action index: ${parsedActionIndex}, Available actions: ${day.actions?.length || 0}`);
    }

    const action = day.actions[parsedActionIndex];

    // Check if already analyzed (within 24 hours)
    if (action.taskAnalysis && action.taskAnalysis.analyzedAt) {
      const analyzedAt = new Date(action.taskAnalysis.analyzedAt);
      const hoursSinceAnalysis = (new Date() - analyzedAt) / (1000 * 60 * 60);
      if (hoursSinceAnalysis < 24) {
        // Return cached analysis
        return {
          analysis: action.taskAnalysis,
          cached: true,
        };
      }
    }

    // Get weather data for the day
    let dayWeather = {
      temperature: day.weather?.temp || { min: 20, max: 30 },
      humidity: day.weather?.humidity || 60,
      rain: day.weather?.rain || 0,
    };

    // Try to get fresh weather data if coordinates are available
    if (plantBox.location && plantBox.location.coordinates && 
        plantBox.location.coordinates.lat && plantBox.location.coordinates.lon) {
      try {
        const weatherData = await getWeatherData({
          lat: plantBox.location.coordinates.lat,
          lon: plantBox.location.coordinates.lon,
        });
        
        if (weatherData && weatherData.forecast && weatherData.forecast[parsedDayIndex]) {
          dayWeather = {
            temperature: weatherData.forecast[parsedDayIndex].temperature || dayWeather.temperature,
            humidity: weatherData.forecast[parsedDayIndex].humidity ?? dayWeather.humidity,
            rain: weatherData.forecast[parsedDayIndex].rain ?? dayWeather.rain,
          };
        }
      } catch (weatherError) {
        console.warn('⚠️ [analyzeTaskAction] Failed to fetch weather data, using cached data:', weatherError.message);
        // Continue with cached weather data from day.weather
      }
    } else {
      console.warn('⚠️ [analyzeTaskAction] No coordinates available, using cached weather data from strategy');
    }

    // Analyze task
    const taskAnalysis = await analyzeTask({
      plantBox,
      action,
      weather: {
        temp: dayWeather.temperature,
        humidity: dayWeather.humidity,
        rain: dayWeather.rain,
      },
      dayIndex: parsedDayIndex,
    });

    // Update taskAnalysis in database
    plantBox.careStrategy.next7Days[dayIndex].actions[actionIndex].taskAnalysis = taskAnalysis;
    await plantBox.save();

    return {
      analysis: taskAnalysis,
      cached: false,
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to analyze task: ${error.message}`);
  }
};

/**
 * Toggle action completed status
 * @param {object} params - Parameters
 * @param {string} params.boxId - Plant box ID
 * @param {string} params.userId - User ID
 * @param {number} params.dayIndex - Day index (0-6)
 * @param {string} params.actionId - Action ID
 * @param {boolean} params.completed - Completed status
 * @returns {Promise<object>} Updated plant box
 */
export const toggleActionCompleted = async ({ boxId, userId, dayIndex, actionId, completed }) => {
  try {
    if (!boxId || !userId || dayIndex === undefined || dayIndex === null || !actionId) {
      throw httpError(400, 'Missing required parameters for toggling action');
    }

    const plantBox = await PlantBox.findOne({ _id: boxId, user: userId });
    if (!plantBox) {
      throw httpError(404, 'Plant box not found');
    }

    if (!plantBox.careStrategy || !plantBox.careStrategy.next7Days || !plantBox.careStrategy.next7Days[dayIndex]) {
      throw httpError(404, 'Day not found in care strategy');
    }

    const day = plantBox.careStrategy.next7Days[dayIndex];
    const action = day.actions.find(a => a._id === actionId);
    
    if (!action) {
      throw httpError(404, 'Action not found');
    }

    action.completed = completed !== undefined ? completed : !action.completed;
    await plantBox.save();

    return plantBox;
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to toggle action: ${error.message}`);
  }
};

/**
 * Delete a disease from plant box
 * @param {object} params - Parameters
 * @param {string} params.boxId - Plant box ID
 * @param {string} params.userId - User ID
 * @param {number} params.diseaseIndex - Index of disease in currentDiseases array
 * @returns {Promise<object>} Updated plant box
 */
export const deleteDisease = async ({ boxId, userId, diseaseIndex }) => {
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

    // Remove disease from array
    plantBox.currentDiseases.splice(diseaseIndex, 1);
    await plantBox.save();

    return plantBox;
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to delete disease: ${error.message}`);
  }
};

/**
 * Add a new disease to plant box
 * @param {object} params - Parameters
 * @param {string} params.boxId - Plant box ID
 * @param {string} params.userId - User ID
 * @param {object} params.disease - Disease data { name, symptoms, severity }
 * @returns {Promise<object>} Updated plant box
 */
export const addDisease = async ({ boxId, userId, disease }) => {
  try {
    if (!boxId) {
      throw httpError(400, 'Plant box ID is required');
    }
    if (!userId) {
      throw httpError(400, 'User ID is required');
    }
    if (!disease || !disease.name) {
      throw httpError(400, 'Disease name is required');
    }

    const plantBox = await PlantBox.findOne({ _id: boxId, user: userId });
    if (!plantBox) {
      throw httpError(404, 'Plant box not found');
    }

    // Add disease to array
    if (!plantBox.currentDiseases) {
      plantBox.currentDiseases = [];
    }

    plantBox.currentDiseases.push({
      name: disease.name,
      symptoms: disease.symptoms || '',
      severity: disease.severity || 'moderate',
      detectedDate: new Date(),
      status: 'active',
      feedback: [],
    });

    await plantBox.save();

    return plantBox;
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to add disease: ${error.message}`);
  }
};

/**
 * Update selected treatments for a disease
 * @param {object} params - Parameters
 * @param {string} params.boxId - Plant box ID
 * @param {string} params.userId - User ID
 * @param {number} params.diseaseIndex - Index of disease in currentDiseases array
 * @param {object} params.treatments - Selected treatments { chemical, biological, cultural }
 * @returns {Promise<object>} Updated plant box
 */
export const updateDiseaseTreatments = async ({ boxId, userId, diseaseIndex, treatments }) => {
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

    // Update selected treatments
    const disease = plantBox.currentDiseases[diseaseIndex];
    disease.selectedTreatments = treatments || {};

    await plantBox.save();

    return plantBox;
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to update disease treatments: ${error.message}`);
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
  analyzeTaskAction,
  deleteDisease,
  addDisease,
  updateDiseaseTreatments,
  toggleActionCompleted,
};

