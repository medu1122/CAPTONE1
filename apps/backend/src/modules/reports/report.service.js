import Report from './report.model.js';
import Post from '../posts/post.model.js';
import { httpError } from '../../common/utils/http.js';

/**
 * Create a new report
 * @param {object} data - Report data
 * @param {string} userId - User ID
 * @returns {Promise<object>} Created report
 */
export const createReport = async (data, userId) => {
  try {
    // Check if target exists
    if (data.targetType === 'post') {
      const post = await Post.findById(data.targetId);
      if (!post) {
        throw httpError(404, 'Post not found');
      }

      // Increment reportCount and update lastReportedAt
      await Post.findByIdAndUpdate(data.targetId, {
        $inc: { reportCount: 1 },
        $set: { lastReportedAt: new Date() },
      });
    }
    // TODO: Handle comment reports when comment model is separate

    // Check for duplicate report (same user, same target)
    const existingReport = await Report.findOne({
      user: userId,
      targetId: data.targetId,
      targetType: data.targetType,
      status: { $in: ['pending', 'reviewing'] },
    });

    if (existingReport) {
      throw httpError(409, 'You have already reported this item');
    }

    const report = await Report.create({
      ...data,
      user: userId,
    });

    await report.populate('user', 'name email profileImage');
    
    return report;
  } catch (error) {
    if (error.statusCode) throw error;
    if (error.code === 11000) {
      throw httpError(409, 'Report already exists');
    }
    throw httpError(500, `Failed to create report: ${error.message}`);
  }
};

/**
 * Get user's reports
 * @param {string} userId - User ID
 * @param {object} query - Query parameters
 * @returns {Promise<object>} Reports list with pagination
 */
export const getUserReports = async (userId, query = {}) => {
  try {
    const {
      type,
      status,
      reason,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter = { user: userId };
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (reason) filter.reason = reason;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate('user', 'name email profileImage')
        .populate('resolvedBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Report.countDocuments(filter),
    ]);

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw httpError(500, `Failed to get reports: ${error.message}`);
  }
};

/**
 * Get all reports (admin only)
 * @param {object} query - Query parameters
 * @returns {Promise<object>} Reports list with pagination
 */
export const getAllReports = async (query = {}) => {
  try {
    console.log('📋 [getAllReports] Starting with query:', query);
    
    const {
      type,
      status,
      reason,
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
    if (reason) filter.reason = reason;

    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    console.log('📋 [getAllReports] Filter:', filter, 'Skip:', skip, 'Limit:', limitNum);

    let reportsRaw, total;
    try {
      [reportsRaw, total] = await Promise.all([
        Report.find(filter)
          .populate('user', 'name email profileImage')
          .populate('resolvedBy', 'name email')
          .sort(sort)
          .skip(skip)
          .limit(limitNum),
        Report.countDocuments(filter),
      ]);
      console.log('📋 [getAllReports] Fetched:', reportsRaw.length, 'reports, total:', total);
    } catch (dbError) {
      console.error('❌ [getAllReports] Database error:', dbError);
      throw dbError;
    }

    // Convert Mongoose documents to plain objects - simple approach
    console.log('📋 [getAllReports] Converting', reportsRaw.length, 'reports to plain objects');
    const formattedReports = reportsRaw.map((report, index) => {
      try {
        const obj = report.toObject ? report.toObject() : JSON.parse(JSON.stringify(report));
        
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
        console.error(`❌ [getAllReports] Error converting report at index ${index}:`, error);
        console.error('Report data:', report);
        // Return minimal safe object
        return {
          _id: report._id?.toString() || 'unknown',
          type: report.type || 'unknown',
          reason: report.reason || 'unknown',
          description: report.description || '',
          user: { _id: null, name: 'Unknown', email: 'unknown@example.com', profileImage: null },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
    });

    const result = {
      reports: formattedReports,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
    
    console.log('📋 [getAllReports] Returning result with', result.reports.length, 'reports');
    return result;
  } catch (error) {
    console.error('❌ [getAllReports] Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    throw httpError(500, `Failed to get reports: ${error.message}`);
  }
};

/**
 * Get report by ID
 * @param {string} reportId - Report ID
 * @param {string} userId - User ID (optional, for ownership check)
 * @returns {Promise<object>} Report
 */
export const getReportById = async (reportId, userId = null) => {
  try {
    const report = await Report.findById(reportId)
      .populate('user', 'name email profileImage')
      .populate('resolvedBy', 'name email');

    if (!report) {
      throw httpError(404, 'Report not found');
    }

    // If userId provided, check ownership (unless admin)
    if (userId && report.user._id.toString() !== userId) {
      // Check if user is admin (would be done in middleware, but double-check)
      const User = (await import('../auth/auth.model.js')).default;
      const user = await User.findById(userId);
      if (!user || user.role !== 'admin') {
        throw httpError(403, 'Access denied');
      }
    }

    return report;
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to get report: ${error.message}`);
  }
};

/**
 * Update report status (admin only)
 * @param {string} reportId - Report ID
 * @param {object} data - Update data
 * @param {string} adminId - Admin user ID
 * @returns {Promise<object>} Updated report
 */
export const updateReportStatus = async (reportId, data, adminId) => {
  try {
    const { status, adminNotes } = data;

    const updateData = {
      status,
      adminNotes: adminNotes || null,
    };

    if (status === 'resolved' || status === 'dismissed') {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = adminId;
    }

    const report = await Report.findByIdAndUpdate(
      reportId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('user', 'name email profileImage')
      .populate('resolvedBy', 'name email');

    if (!report) {
      throw httpError(404, 'Report not found');
    }

    return report;
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to update report: ${error.message}`);
  }
};

/**
 * Get report statistics
 * @returns {Promise<object>} Statistics
 */
export const getReportStats = async () => {
  try {
    const [total, pending, reviewing, resolved, dismissed] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      Report.countDocuments({ status: 'reviewing' }),
      Report.countDocuments({ status: 'resolved' }),
      Report.countDocuments({ status: 'dismissed' }),
    ]);

    // Get reports by type
    const byType = await Report.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get reports by reason
    const byReason = await Report.aggregate([
      {
        $group: {
          _id: '$reason',
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      total,
      pending,
      reviewing,
      resolved,
      dismissed,
      byType: byType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byReason: byReason.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    };
  } catch (error) {
    throw httpError(500, `Failed to get report statistics: ${error.message}`);
  }
};

