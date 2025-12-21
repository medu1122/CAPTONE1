import express from 'express';
import {
  getMyPlantBoxes,
  getPlantBox,
  createPlantBoxController,
  updatePlantBoxController,
  deletePlantBoxController,
  refreshStrategy,
  forceRefreshAllStrategies,
  getProgressReportController,
  chatWithPlantBox,
  addNoteController,
  addImageController,
  addDiseaseFeedbackController,
  analyzeTaskController,
  deleteDiseaseController,
  addDiseaseController,
  updateDiseaseTreatmentsController,
  toggleActionCompletedController,
  completeTaskViaTokenController,
} from './plantBox.controller.js';
import {
  validateCreatePlantBox,
  validateUpdatePlantBox,
  validateChatMessage,
  validateAddNote,
  validateAddImage,
  validateAnalyzeTask,
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
 * @route GET /api/v1/plant-boxes/:id/progress-report
 * @desc Get AI progress report for plant box
 * @access Private
 */
router.get('/:id/progress-report', authMiddleware, getProgressReportController);

/**
 * @route POST /api/v1/plant-boxes/admin/force-refresh-all
 * @desc Force refresh all expired care strategies (Admin/Dev only)
 * @access Private (Admin)
 */
router.post('/admin/force-refresh-all', authMiddleware, forceRefreshAllStrategies);

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

/**
 * @route POST /api/v1/plant-boxes/:id/disease-feedback
 * @desc Add feedback for a disease
 * @access Private
 */
router.post(
  '/:id/disease-feedback',
  authMiddleware,
  addDiseaseFeedbackController
);

/**
 * @route POST /api/v1/plant-boxes/:id/analyze-task
 * @desc Analyze a specific task action and get detailed guidance
 * @access Private
 */
router.post(
  '/:id/analyze-task',
  authMiddleware,
  validateAnalyzeTask,
  analyzeTaskController
);

/**
 * @route POST /api/v1/plant-boxes/:id/diseases
 * @desc Add a new disease to plant box
 * @access Private
 */
router.post(
  '/:id/diseases',
  authMiddleware,
  addDiseaseController
);

/**
 * @route DELETE /api/v1/plant-boxes/:id/diseases
 * @desc Delete a disease from plant box
 * @access Private
 */
router.delete(
  '/:id/diseases',
  authMiddleware,
  deleteDiseaseController
);

/**
 * @route PUT /api/v1/plant-boxes/:id/diseases/:diseaseIndex/treatments
 * @desc Update selected treatments for a disease
 * @access Private
 */
router.put(
  '/:id/diseases/:diseaseIndex/treatments',
  authMiddleware,
  updateDiseaseTreatmentsController
);

/**
 * @route PUT /api/v1/plant-boxes/:id/actions/toggle
 * @desc Toggle action completed status
 * @access Private
 */
router.put(
  '/:id/actions/toggle',
  authMiddleware,
  toggleActionCompletedController
);

/**
 * @route GET /api/v1/plant-boxes/complete-task
 * @desc Complete task via token (public, no auth required)
 * @access Public
 */
router.get(
  '/complete-task',
  completeTaskViaTokenController
);

export default router;

