import express from 'express';
import {
  createReportController,
  getUserReportsController,
  getAllReportsController,
  getReportByIdController,
  updateReportStatusController,
  getReportStatsController,
} from './report.controller.js';
import { authMiddleware } from '../../common/middleware/auth.js';
import { adminMiddleware } from '../../common/middleware/admin.js';
import {
  validateCreateReport,
  validateUpdateReportStatus,
  validateGetReports,
} from './report.validation.js';

const router = express.Router();

// User routes (authenticated)
router.post('/', authMiddleware, validateCreateReport, createReportController);
router.get('/', authMiddleware, validateGetReports, getUserReportsController);
router.get('/:id', authMiddleware, getReportByIdController);

export default router;

