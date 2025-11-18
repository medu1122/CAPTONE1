import express from 'express';
import {
  getMyPlantBoxes,
  getPlantBox,
  createPlantBoxController,
  updatePlantBoxController,
  deletePlantBoxController,
  refreshStrategy,
  chatWithPlantBox,
  addNoteController,
  addImageController,
} from './plantBox.controller.js';
import {
  validateCreatePlantBox,
  validateUpdatePlantBox,
  validateChatMessage,
  validateAddNote,
  validateAddImage,
} from './plantBox.validation.js';
import { authMiddleware } from '../../common/middleware/auth.js';

const router = express.Router();

/**
 * @route GET /api/v1/plant-boxes
 * @desc Get all plant boxes for current user
 * @access Private
 */
router.get('/', authMiddleware, getMyPlantBoxes);

/**
 * @route GET /api/v1/plant-boxes/:id
 * @desc Get plant box by ID
 * @access Private
 */
router.get('/:id', authMiddleware, getPlantBox);

/**
 * @route POST /api/v1/plant-boxes
 * @desc Create new plant box
 * @access Private
 */
router.post(
  '/',
  authMiddleware,
  validateCreatePlantBox,
  createPlantBoxController
);

/**
 * @route PUT /api/v1/plant-boxes/:id
 * @desc Update plant box
 * @access Private
 */
router.put(
  '/:id',
  authMiddleware,
  validateUpdatePlantBox,
  updatePlantBoxController
);

/**
 * @route DELETE /api/v1/plant-boxes/:id
 * @desc Delete plant box
 * @access Private
 */
router.delete('/:id', authMiddleware, deletePlantBoxController);

/**
 * @route POST /api/v1/plant-boxes/:id/refresh-strategy
 * @desc Refresh care strategy for plant box
 * @access Private
 */
router.post('/:id/refresh-strategy', authMiddleware, refreshStrategy);

/**
 * @route POST /api/v1/plant-boxes/:id/chat
 * @desc Chat with plant box (mini chat bot)
 * @access Private
 */
router.post(
  '/:id/chat',
  authMiddleware,
  validateChatMessage,
  chatWithPlantBox
);

/**
 * @route POST /api/v1/plant-boxes/:id/notes
 * @desc Add note to plant box
 * @access Private
 */
router.post(
  '/:id/notes',
  authMiddleware,
  validateAddNote,
  addNoteController
);

/**
 * @route POST /api/v1/plant-boxes/:id/images
 * @desc Add image to plant box
 * @access Private
 */
router.post(
  '/:id/images',
  authMiddleware,
  validateAddImage,
  addImageController
);

export default router;

