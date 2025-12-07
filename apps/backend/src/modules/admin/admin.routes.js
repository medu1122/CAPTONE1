import express from 'express';
import {
  getUserStatsController,
  getUsersListController,
  blockUserController,
  unblockUserController,
  deleteUserController,
  muteUserController,
  unmuteUserController,
  getAnalysisStatsController,
  getCommunityStatsController,
  getAdminComplaintsController,
  getAdminComplaintStatsController,
  getAdminReportsController,
  getAdminReportStatsController,
} from './admin.controller.js';
import { authMiddleware } from '../../common/middleware/auth.js';
import { adminMiddleware } from '../../common/middleware/admin.js';
import {
  validateGetComplaints,
  validateUpdateComplaintStatus,
} from '../complaints/complaint.validation.js';
import {
  validateGetReports,
  validateUpdateReportStatus,
} from '../reports/report.validation.js';
import {
  updateComplaintStatus,
} from '../complaints/complaint.service.js';
import {
  updateReportStatus,
} from '../reports/report.service.js';
import { httpSuccess } from '../../common/utils/http.js';
import {
  getProductsController,
  createProductController,
  updateProductController,
  deleteProductController,
  getBiologicalMethodsController,
  createBiologicalMethodController,
  updateBiologicalMethodController,
  deleteBiologicalMethodController,
  getCulturalPracticesController,
  createCulturalPracticeController,
  updateCulturalPracticeController,
  deleteCulturalPracticeController,
  getDataStatsController,
} from './dataManagement.controller.js';
import {
  validateProduct,
  validateBiologicalMethod,
  validateCulturalPractice,
} from './dataManagement.validation.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authMiddleware, adminMiddleware);

// User Management
router.get('/stats/users', getUserStatsController);
router.get('/users', getUsersListController);
router.put('/users/:id/block', blockUserController);
router.put('/users/:id/unblock', unblockUserController);
router.delete('/users/:id', deleteUserController);
router.post('/users/:id/mute', muteUserController);
router.put('/users/:id/unmute', unmuteUserController);

// Statistics
router.get('/stats/analysis', getAnalysisStatsController);
router.get('/stats/community', getCommunityStatsController);

// Complaints Management
router.get('/complaints', validateGetComplaints, getAdminComplaintsController);
router.get('/complaints/stats', getAdminComplaintStatsController);
router.put('/complaints/:id/status', validateUpdateComplaintStatus, async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const complaint = await updateComplaintStatus(id, req.body, adminId);
    const { statusCode, body } = httpSuccess(200, 'Complaint status updated successfully', complaint);
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
});

// Reports Management
router.get('/reports', validateGetReports, getAdminReportsController);
router.get('/reports/stats', getAdminReportStatsController);
router.put('/reports/:id/status', validateUpdateReportStatus, async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const report = await updateReportStatus(id, req.body, adminId);
    const { statusCode, body } = httpSuccess(200, 'Report status updated successfully', report);
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
});

// Data Management - Products (Thuốc hóa học)
router.get('/data/products', getProductsController);
router.post('/data/products', validateProduct, createProductController);
router.put('/data/products/:id', validateProduct, updateProductController);
router.delete('/data/products/:id', deleteProductController);

// Data Management - Biological Methods (Phương pháp sinh học)
router.get('/data/biological-methods', getBiologicalMethodsController);
router.post('/data/biological-methods', validateBiologicalMethod, createBiologicalMethodController);
router.put('/data/biological-methods/:id', validateBiologicalMethod, updateBiologicalMethodController);
router.delete('/data/biological-methods/:id', deleteBiologicalMethodController);

// Data Management - Cultural Practices (Canh tác)
router.get('/data/cultural-practices', getCulturalPracticesController);
router.post('/data/cultural-practices', validateCulturalPractice, createCulturalPracticeController);
router.put('/data/cultural-practices/:id', validateCulturalPractice, updateCulturalPracticeController);
router.delete('/data/cultural-practices/:id', deleteCulturalPracticeController);

// Data Management - Statistics
router.get('/data/stats', getDataStatsController);

export default router;

