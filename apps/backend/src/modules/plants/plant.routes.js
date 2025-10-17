import express from 'express';
import { 
  getPlants,
  getPlant,
  searchPlantsController,
  getPlantsByCategoryController,
  createPlantController,
  updatePlantController,
  deletePlantController
} from './plant.controller.js';
import { 
  validatePlantQuery,
  validatePlantSearch,
  validateCreatePlant,
  validateUpdatePlant 
} from './plant.validation.js';
import { authMiddleware } from '../../common/middleware/auth.js';

const router = express.Router();

/**
 * @route GET /api/v1/plants
 * @desc Get all plants with pagination and filtering
 * @access Public
 */
router.get('/', validatePlantQuery, getPlants);

/**
 * @route GET /api/v1/plants/search
 * @desc Search plants by query
 * @access Public
 */
router.get('/search', validatePlantSearch, searchPlantsController);

/**
 * @route GET /api/v1/plants/category/:category
 * @desc Get plants by category
 * @access Public
 */
router.get('/category/:category', getPlantsByCategoryController);

/**
 * @route GET /api/v1/plants/:id
 * @desc Get plant by ID
 * @access Public
 */
router.get('/:id', getPlant);

/**
 * @route POST /api/v1/plants
 * @desc Create new plant
 * @access Private
 */
router.post('/', authMiddleware, validateCreatePlant, createPlantController);

/**
 * @route PUT /api/v1/plants/:id
 * @desc Update plant
 * @access Private
 */
router.put('/:id', authMiddleware, validateUpdatePlant, updatePlantController);

/**
 * @route DELETE /api/v1/plants/:id
 * @desc Delete plant
 * @access Private
 */
router.delete('/:id', authMiddleware, deletePlantController);

export default router;