import { httpSuccess, httpError } from '../../common/utils/http.js';
import {
  createReport,
  getUserReports,
  getAllReports,
  getReportById,
  updateReportStatus,
  getReportStats,
} from './report.service.js';

/**
 * POST /api/v1/reports
 * Create a new report
 */
export const createReportController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const report = await createReport(req.body, userId);

    const { statusCode, body } = httpSuccess(201, 'Report created successfully', report);
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/reports
 * Get user's reports
 */
export const getUserReportsController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await getUserReports(userId, req.query);

    const { statusCode, body } = httpSuccess(200, 'Reports retrieved successfully', result);
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/reports
 * Get all reports (admin only)
 */
export const getAllReportsController = async (req, res, next) => {
  try {
    const result = await getAllReports(req.query);

    const { statusCode, body } = httpSuccess(200, 'Reports retrieved successfully', result);
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/reports/:id
 * Get report by ID
 */
export const getReportByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;
    const report = await getReportById(id, userId);

    const { statusCode, body } = httpSuccess(200, 'Report retrieved successfully', report);
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/admin/reports/:id/status
 * Update report status (admin only)
 */
export const updateReportStatusController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const report = await updateReportStatus(id, req.body, adminId);

    const { statusCode, body } = httpSuccess(200, 'Report status updated successfully', report);
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/reports/stats
 * Get report statistics (admin only)
 */
export const getReportStatsController = async (req, res, next) => {
  try {
    const stats = await getReportStats();

    const { statusCode, body } = httpSuccess(200, 'Report statistics retrieved successfully', stats);
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

