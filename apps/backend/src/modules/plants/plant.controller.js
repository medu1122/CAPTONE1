const { httpSuccess } = require('../../common/utils/http');
const Plant = require('./plant.model');
const { httpError } = require('../../common/utils/http');

/**
 * Create a new plant
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const createPlant = async (req, res, next) => {
  try {
    const plantData = {
      ...req.body,
      createdBy: req.user.id,
    };
    
    const plant = await Plant.create(plantData);
    const { statusCode, body } = httpSuccess(201, 'Plant created successfully', plant);
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all plants
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const getAllPlants = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const query = {};
    
    // Filter by category
    if (category) {
      query.category = category;
    }
    
    // Search by text
    if (search) {
      query.$text = { $search: search };
    }
    
    const plants = await Plant.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const count = await Plant.countDocuments(query);
    
    const { statusCode, body } = httpSuccess(200, 'Plants retrieved successfully', {
      plants,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalItems: count,
    });
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Get plant by ID
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const getPlantById = async (req, res, next) => {
  try {
    const plant = await Plant.findById(req.params.id);
    
    if (!plant) {
      return next(httpError(404, 'Plant not found'));
    }
    
    const { statusCode, body } = httpSuccess(200, 'Plant retrieved successfully', plant);
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Update plant
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const updatePlant = async (req, res, next) => {
  try {
    const plant = await Plant.findById(req.params.id);
    
    if (!plant) {
      return next(httpError(404, 'Plant not found'));
    }
    
    // Check if user is authorized to update
    if (plant.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(httpError(403, 'Not authorized to update this plant'));
    }
    
    const updatedPlant = await Plant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    const { statusCode, body } = httpSuccess(200, 'Plant updated successfully', updatedPlant);
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete plant
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const deletePlant = async (req, res, next) => {
  try {
    const plant = await Plant.findById(req.params.id);
    
    if (!plant) {
      return next(httpError(404, 'Plant not found'));
    }
    
    // Check if user is authorized to delete
    if (plant.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(httpError(403, 'Not authorized to delete this plant'));
    }
    
    await plant.remove();
    
    const { statusCode, body } = httpSuccess(200, 'Plant deleted successfully');
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPlant,
  getAllPlants,
  getPlantById,
  updatePlant,
  deletePlant,
};
