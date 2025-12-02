import { httpSuccess, httpError } from '../../common/utils/http.js';
import {
  getUserStats,
  getUsersList,
  blockUser,
  unblockUser,
  deleteUser,
  muteUser,
  unmuteUser,
  getAnalysisStats,
  getCommunityStats,
} from './admin.service.js';
import {
  getAllComplaints,
  getComplaintStats,
} from '../complaints/complaint.service.js';
import {
  getAllReports,
  getReportStats,
} from '../reports/report.service.js';

/**
 * GET /api/v1/admin/stats/users
 * Get user statistics
 */
export const getUserStatsController = async (req, res, next) => {
  try {
    const stats = await getUserStats();
    const { statusCode, body } = httpSuccess(200, 'User statistics retrieved successfully', stats);
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/users
 * Get users list with pagination
 */
export const getUsersListController = async (req, res, next) => {
  try {
    const result = await getUsersList(req.query);
    const { statusCode, body } = httpSuccess(200, 'Users retrieved successfully', result);
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/admin/users/:id/block
 * Block user
 */
export const blockUserController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await blockUser(id, req.body);
    const { statusCode, body } = httpSuccess(200, 'User blocked successfully', user);
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/admin/users/:id/unblock
 * Unblock user
 */
export const unblockUserController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await unblockUser(id);
    const { statusCode, body } = httpSuccess(200, 'User unblocked successfully', user);
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/admin/users/:id
 * Delete user
 */
export const deleteUserController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await deleteUser(id);
    const { statusCode, body } = httpSuccess(200, 'User deleted successfully', result);
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/users/:id/mute
 * Mute user
 */
export const muteUserController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await muteUser(id, req.body);
    const { statusCode, body } = httpSuccess(200, 'User muted successfully', user);
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/admin/users/:id/unmute
 * Unmute user
 */
export const unmuteUserController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await unmuteUser(id);
    const { statusCode, body } = httpSuccess(200, 'User unmuted successfully', user);
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/stats/analysis
 * Get analysis statistics
 */
export const getAnalysisStatsController = async (req, res, next) => {
  try {
    const stats = await getAnalysisStats();
    const { statusCode, body } = httpSuccess(200, 'Analysis statistics retrieved successfully', stats);
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/stats/community
 * Get community statistics
 */
export const getCommunityStatsController = async (req, res, next) => {
  try {
    const stats = await getCommunityStats();
    const { statusCode, body } = httpSuccess(200, 'Community statistics retrieved successfully', stats);
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/complaints
 * Get all complaints (admin)
 */
export const getAdminComplaintsController = async (req, res, next) => {
  try {
    console.log('📋 [getAdminComplaintsController] Request query:', req.query);
    const result = await getAllComplaints(req.query);
    console.log('📋 [getAdminComplaintsController] Result:', {
      complaintsCount: result.complaints?.length || 0,
      total: result.pagination?.total || 0,
    });
    const { statusCode, body } = httpSuccess(200, 'Complaints retrieved successfully', result);
    res.status(statusCode).json(body);
  } catch (error) {
    console.error('❌ [getAdminComplaintsController] Error:', error);
    next(error);
  }
};

/**
 * GET /api/v1/admin/complaints/stats
 * Get complaint statistics (admin)
 */
export const getAdminComplaintStatsController = async (req, res, next) => {
  try {
    const stats = await getComplaintStats();
    const { statusCode, body } = httpSuccess(200, 'Complaint statistics retrieved successfully', stats);
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/reports
 * Get all reports (admin)
 */
export const getAdminReportsController = async (req, res, next) => {
  try {
    console.log('📋 [getAdminReportsController] Request query:', req.query);
    const result = await getAllReports(req.query);
    console.log('📋 [getAdminReportsController] Result:', {
      reportsCount: result.reports?.length || 0,
      total: result.pagination?.total || 0,
    });
    const { statusCode, body } = httpSuccess(200, 'Reports retrieved successfully', result);
    res.status(statusCode).json(body);
  } catch (error) {
    console.error('❌ [getAdminReportsController] Error:', error);
    next(error);
  }
};

/**
 * GET /api/v1/admin/reports/stats
 * Get report statistics (admin)
 */
export const getAdminReportStatsController = async (req, res, next) => {
  try {
    const stats = await getReportStats();
    const { statusCode, body } = httpSuccess(200, 'Report statistics retrieved successfully', stats);
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

