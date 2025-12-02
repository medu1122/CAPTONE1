import { httpSuccess, httpError } from '../../common/utils/http.js';
import {
  createComplaint,
  getUserComplaints,
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus,
  getComplaintStats,
} from './complaint.service.js';

/**
 * POST /api/v1/complaints
 * Create a new complaint
 */
export const createComplaintController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    console.log('📝 [createComplaintController] Request:', {
      userId,
      body: req.body,
    });
    
    const complaint = await createComplaint(req.body, userId);

    console.log('✅ [createComplaintController] Complaint created:', {
      id: complaint._id,
      type: complaint.type,
      title: complaint.title,
    });

    const { statusCode, body } = httpSuccess(201, 'Complaint created successfully', complaint);
    res.status(statusCode).json(body);
  } catch (error) {
    console.error('❌ [createComplaintController] Error:', error);
    next(error);
  }
};

/**
 * GET /api/v1/complaints
 * Get user's complaints
 */
export const getUserComplaintsController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await getUserComplaints(userId, req.query);

    const { statusCode, body } = httpSuccess(200, 'Complaints retrieved successfully', result);
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/complaints
 * Get all complaints (admin only)
 */
export const getAllComplaintsController = async (req, res, next) => {
  try {
    const result = await getAllComplaints(req.query);

    const { statusCode, body } = httpSuccess(200, 'Complaints retrieved successfully', result);
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/complaints/:id
 * Get complaint by ID
 */
export const getComplaintByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;
    const complaint = await getComplaintById(id, userId);

    const { statusCode, body } = httpSuccess(200, 'Complaint retrieved successfully', complaint);
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/admin/complaints/:id/status
 * Update complaint status (admin only)
 */
export const updateComplaintStatusController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const complaint = await updateComplaintStatus(id, req.body, adminId);

    const { statusCode, body } = httpSuccess(200, 'Complaint status updated successfully', complaint);
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/complaints/stats
 * Get complaint statistics (admin only)
 */
export const getComplaintStatsController = async (req, res, next) => {
  try {
    const stats = await getComplaintStats();

    const { statusCode, body } = httpSuccess(200, 'Complaint statistics retrieved successfully', stats);
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

