import express from 'express';
import {
  createComplaintController,
  getUserComplaintsController,
  getAllComplaintsController,
  getComplaintByIdController,
  updateComplaintStatusController,
  getComplaintStatsController,
} from './complaint.controller.js';
import { authMiddleware } from '../../common/middleware/auth.js';
import { adminMiddleware } from '../../common/middleware/admin.js';
import {
  validateCreateComplaint,
  validateUpdateComplaintStatus,
  validateGetComplaints,
} from './complaint.validation.js';

const router = express.Router();

// User routes (authenticated)
router.post('/', authMiddleware, validateCreateComplaint, createComplaintController);
router.get('/', authMiddleware, validateGetComplaints, getUserComplaintsController);
router.get('/:id', authMiddleware, getComplaintByIdController);

export default router;

