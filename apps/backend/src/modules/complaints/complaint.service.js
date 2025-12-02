import Complaint from './complaint.model.js';
import { httpError } from '../../common/utils/http.js';

/**
 * Create a new complaint
 * @param {object} data - Complaint data
 * @param {string} userId - User ID
 * @returns {Promise<object>} Created complaint
 */
export const createComplaint = async (data, userId) => {
  try {
    console.log('📝 [createComplaint] Creating complaint:', {
      userId,
      data: {
        type: data.type,
        category: data.category,
        title: data.title?.substring(0, 50),
        description: data.description?.substring(0, 50),
        relatedId: data.relatedId,
        relatedType: data.relatedType,
      },
    });

    const complaint = await Complaint.create({
      ...data,
      user: userId,
    });

    await complaint.populate('user', 'name email profileImage');
    
    console.log('✅ [createComplaint] Complaint created successfully:', complaint._id);
    
    return complaint;
  } catch (error) {
    console.error('❌ [createComplaint] Error:', {
      message: error.message,
      code: error.code,
      errors: error.errors,
      name: error.name,
    });
    
    if (error.code === 11000) {
      throw httpError(409, 'Complaint already exists');
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      throw httpError(400, `Validation error: ${messages}`);
    }
    throw httpError(500, `Failed to create complaint: ${error.message}`);
  }
};

/**
 * Get user's complaints
 * @param {string} userId - User ID
 * @param {object} query - Query parameters
 * @returns {Promise<object>} Complaints list with pagination
 */
export const getUserComplaints = async (userId, query = {}) => {
  try {
    const {
      type,
      status,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter = { user: userId };
    if (type) filter.type = type;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .populate('user', 'name email profileImage')
        .populate('resolvedBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Complaint.countDocuments(filter),
    ]);

    return {
      complaints,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw httpError(500, `Failed to get complaints: ${error.message}`);
  }
};

/**
 * Get all complaints (admin only)
 * @param {object} query - Query parameters
 * @returns {Promise<object>} Complaints list with pagination
 */
export const getAllComplaints = async (query = {}) => {
  try {
    console.log('📋 [getAllComplaints] Starting with query:', query);
    
    const {
      type,
      status,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // Convert page and limit to numbers (they come as strings from query params)
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;

    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;

    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    console.log('📋 [getAllComplaints] Filter:', filter, 'Skip:', skip, 'Limit:', limitNum);

    let complaintsRaw, total;
    try {
      [complaintsRaw, total] = await Promise.all([
        Complaint.find(filter)
          .populate('user', 'name email profileImage')
          .populate('resolvedBy', 'name email')
          .sort(sort)
          .skip(skip)
          .limit(limitNum),
        Complaint.countDocuments(filter),
      ]);
      console.log('📋 [getAllComplaints] Fetched:', complaintsRaw.length, 'complaints, total:', total);
    } catch (dbError) {
      console.error('❌ [getAllComplaints] Database error:', dbError);
      throw dbError;
    }

    // Convert Mongoose documents to plain objects - simple approach
    console.log('📋 [getAllComplaints] Converting', complaintsRaw.length, 'complaints to plain objects');
    const formattedComplaints = complaintsRaw.map((complaint, index) => {
      try {
        const obj = complaint.toObject ? complaint.toObject() : JSON.parse(JSON.stringify(complaint));
        
        // Ensure _id is string
        if (obj._id) obj._id = obj._id.toString();
        
        // Ensure dates are strings
        if (obj.createdAt && obj.createdAt instanceof Date) obj.createdAt = obj.createdAt.toISOString();
        if (obj.updatedAt && obj.updatedAt instanceof Date) obj.updatedAt = obj.updatedAt.toISOString();
        if (obj.resolvedAt && obj.resolvedAt instanceof Date) obj.resolvedAt = obj.resolvedAt.toISOString();
        
        // Ensure user._id is string if populated
        if (obj.user && obj.user._id) {
          obj.user._id = obj.user._id.toString();
        }
        
        // Ensure resolvedBy._id is string if populated
        if (obj.resolvedBy && obj.resolvedBy._id) {
          obj.resolvedBy._id = obj.resolvedBy._id.toString();
        }
        
        return obj;
      } catch (error) {
        console.error(`❌ [getAllComplaints] Error converting complaint at index ${index}:`, error);
        console.error('Complaint data:', complaint);
        // Return minimal safe object
        return {
          _id: complaint._id?.toString() || 'unknown',
          type: complaint.type || 'unknown',
          title: complaint.title || 'Unknown',
          description: complaint.description || '',
          user: { _id: null, name: 'Unknown', email: 'unknown@example.com', profileImage: null },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
    });
    
    console.log('📋 [getAllComplaints] Converted', formattedComplaints.length, 'complaints');

    const result = {
      complaints: formattedComplaints,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
    
    console.log('📋 [getAllComplaints] Returning result with', result.complaints.length, 'complaints');
    return result;
  } catch (error) {
    console.error('❌ [getAllComplaints] Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    throw httpError(500, `Failed to get complaints: ${error.message}`);
  }
};

/**
 * Get complaint by ID
 * @param {string} complaintId - Complaint ID
 * @param {string} userId - User ID (optional, for ownership check)
 * @returns {Promise<object>} Complaint
 */
export const getComplaintById = async (complaintId, userId = null) => {
  try {
    const complaint = await Complaint.findById(complaintId)
      .populate('user', 'name email profileImage')
      .populate('resolvedBy', 'name email');

    if (!complaint) {
      throw httpError(404, 'Complaint not found');
    }

    // If userId provided, check ownership (unless admin)
    if (userId && complaint.user._id.toString() !== userId) {
      // Check if user is admin (would be done in middleware, but double-check)
      const User = (await import('../auth/auth.model.js')).default;
      const user = await User.findById(userId);
      if (!user || user.role !== 'admin') {
        throw httpError(403, 'Access denied');
      }
    }

    return complaint;
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to get complaint: ${error.message}`);
  }
};

/**
 * Update complaint status (admin only)
 * @param {string} complaintId - Complaint ID
 * @param {object} data - Update data
 * @param {string} adminId - Admin user ID
 * @returns {Promise<object>} Updated complaint
 */
export const updateComplaintStatus = async (complaintId, data, adminId) => {
  try {
    const { status, adminNotes } = data;

    const updateData = {
      status,
      adminNotes: adminNotes || null,
    };

    if (status === 'resolved' || status === 'rejected') {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = adminId;
    }

    const complaint = await Complaint.findByIdAndUpdate(
      complaintId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('user', 'name email profileImage')
      .populate('resolvedBy', 'name email');

    if (!complaint) {
      throw httpError(404, 'Complaint not found');
    }

    return complaint;
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to update complaint: ${error.message}`);
  }
};

/**
 * Get complaint statistics
 * @returns {Promise<object>} Statistics
 */
export const getComplaintStats = async () => {
  try {
    const [total, pending, reviewing, resolved, rejected] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'pending' }),
      Complaint.countDocuments({ status: 'reviewing' }),
      Complaint.countDocuments({ status: 'resolved' }),
      Complaint.countDocuments({ status: 'rejected' }),
    ]);

    // Get complaints by type
    const byType = await Complaint.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      total,
      pending,
      reviewing,
      resolved,
      rejected,
      byType: byType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    };
  } catch (error) {
    throw httpError(500, `Failed to get complaint statistics: ${error.message}`);
  }
};

