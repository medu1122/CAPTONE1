import User from '../auth/auth.model.js';
import Analysis from '../analyses/analysis.model.js';
import Post from '../posts/post.model.js';
import AuthToken from '../auth/authToken.model.js';
import Complaint from '../complaints/complaint.model.js';
import Report from '../reports/report.model.js';
import { httpError } from '../../common/utils/http.js';

/**
 * Get user statistics
 * @returns {Promise<object>} User statistics
 */
export const getUserStats = async () => {
  try {
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    // Get total users
    const totalUsers = await User.countDocuments();

    // Get online users (active tokens in last 15 minutes)
    const activeTokens = await AuthToken.countDocuments({
      expiresAt: { $gt: now },
      createdAt: { $gte: fifteenMinutesAgo },
    });
    
    // Get unique users from active tokens
    const onlineUserIds = await AuthToken.distinct('user', {
      expiresAt: { $gt: now },
      createdAt: { $gte: fifteenMinutesAgo },
    });
    const onlineUsers = onlineUserIds.length;

    // Get unverified users
    const unverifiedUsers = await User.countDocuments({ isVerified: false });

    // Get blocked users
    const blockedUsers = await User.countDocuments({ status: 'blocked' });

    // Get user growth data (last 7 days and 30 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Daily user growth for last 7 days
    const dailyGrowth7Days = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Daily user growth for last 30 days
    const dailyGrowth30Days = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return {
      total: totalUsers,
      online: onlineUsers,
      unverified: unverifiedUsers,
      blocked: blockedUsers,
      chartData: {
        last7Days: dailyGrowth7Days,
        last30Days: dailyGrowth30Days,
      },
    };
  } catch (error) {
    throw httpError(500, `Failed to get user statistics: ${error.message}`);
  }
};

/**
 * Get users list with pagination and filters
 * @param {object} query - Query parameters
 * @returns {Promise<object>} Users list with pagination
 */
export const getUsersList = async (query = {}) => {
  try {
    const {
      search,
      role,
      status,
      isVerified,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter = {};
    
    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Role filter
    if (role) {
      filter.role = role;
    }

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Verified filter
    if (isVerified !== undefined) {
      filter.isVerified = isVerified === 'true';
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-passwordHash')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    // Get online status for each user
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
    const userIds = users.map(u => u._id);
    const activeTokenUsers = await AuthToken.distinct('user', {
      user: { $in: userIds },
      expiresAt: { $gt: now },
      createdAt: { $gte: fifteenMinutesAgo },
    });

    const usersWithOnlineStatus = users.map(user => ({
      ...user.toObject(),
      online: activeTokenUsers.some(id => id.toString() === user._id.toString()),
    }));

    return {
      users: usersWithOnlineStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw httpError(500, `Failed to get users list: ${error.message}`);
  }
};

/**
 * Block user
 * @param {string} userId - User ID
 * @param {object} data - Block data (reason, duration)
 * @returns {Promise<object>} Updated user
 */
export const blockUser = async (userId, data = {}) => {
  try {
    const { reason } = data;
    
    const user = await User.findByIdAndUpdate(
      userId,
      {
        status: 'blocked',
      },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      throw httpError(404, 'User not found');
    }

    return user;
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to block user: ${error.message}`);
  }
};

/**
 * Unblock user
 * @param {string} userId - User ID
 * @returns {Promise<object>} Updated user
 */
export const unblockUser = async (userId) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        status: 'active',
      },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      throw httpError(404, 'User not found');
    }

    return user;
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to unblock user: ${error.message}`);
  }
};

/**
 * Delete user
 * @param {string} userId - User ID
 * @returns {Promise<object>} Deletion result
 */
export const deleteUser = async (userId) => {
  try {
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      throw httpError(404, 'User not found');
    }

    // Also delete user's auth tokens
    await AuthToken.deleteMany({ user: userId });

    return { success: true, message: 'User deleted successfully' };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to delete user: ${error.message}`);
  }
};

/**
 * Mute user
 * @param {string} userId - User ID
 * @param {object} data - Mute data (reason, duration)
 * @returns {Promise<object>} Updated user
 */
export const muteUser = async (userId, data = {}) => {
  try {
    const { reason, duration } = data; // duration in hours

    let mutedUntil = null;
    if (duration) {
      mutedUntil = new Date();
      mutedUntil.setHours(mutedUntil.getHours() + parseInt(duration));
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        mutedUntil,
        muteReason: reason || null,
      },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      throw httpError(404, 'User not found');
    }

    return user;
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to mute user: ${error.message}`);
  }
};

/**
 * Unmute user
 * @param {string} userId - User ID
 * @returns {Promise<object>} Updated user
 */
export const unmuteUser = async (userId) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        mutedUntil: null,
        muteReason: null,
      },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      throw httpError(404, 'User not found');
    }

    return user;
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to unmute user: ${error.message}`);
  }
};

/**
 * Get analysis statistics
 * @returns {Promise<object>} Analysis statistics
 */
export const getAnalysisStats = async () => {
  try {
    const now = new Date();
    // Use UTC to avoid timezone issues
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));

    // Debug: Log date range
    console.log('📊 [getAnalysisStats] Date range:', {
      now: now.toISOString(),
      startOfToday: startOfToday.toISOString(),
    });

    // Get total count first (for debugging)
    const totalAnalyses = await Analysis.countDocuments({});
    console.log('📊 [getAnalysisStats] Total analyses in DB:', totalAnalyses);

    // Get unique users who used analysis today (filter out null users for distinct)
    // Use aggregation to properly handle null users
    const usersTodayResult = await Analysis.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfToday },
          user: { $ne: null }, // Only count non-null users
        },
      },
      {
        $group: {
          _id: '$user',
        },
      },
    ]);
    
    const usersToday = usersTodayResult.map(item => item._id.toString());

    // Get total analyses today
    const analysesToday = await Analysis.countDocuments({
      createdAt: { $gte: startOfToday },
    });

    console.log('📊 [getAnalysisStats] Today stats:', {
      usersToday: usersToday.length,
      analysesToday,
      totalAnalyses,
    });

    // Get pending complaints
    const pendingComplaints = await Complaint.countDocuments({
      status: 'pending',
      type: 'analysis',
    });

    // Daily analysis usage for last 7 days
    // Use UTC to avoid timezone issues
    const sevenDaysAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 7, 0, 0, 0, 0));
    
    console.log('📊 [getAnalysisStats] Query range:', {
      sevenDaysAgo: sevenDaysAgo.toISOString(),
      now: now.toISOString(),
    });

    const dailyUsageRaw = await Analysis.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    console.log('📊 [getAnalysisStats] Daily usage raw:', dailyUsageRaw);

    // Fill missing dates with 0 (using UTC dates)
    const dailyUsage = [];
    const dateMap = new Map(dailyUsageRaw.map(item => [item._id, item.count]));
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i, 0, 0, 0, 0));
      const dateStr = date.toISOString().split('T')[0];
      dailyUsage.push({
        _id: dateStr,
        count: dateMap.get(dateStr) || 0,
      });
    }

    console.log('📊 [getAnalysisStats] Daily usage filled:', dailyUsage);

    // Top diseases detected
    // Query from raw.diseases array (new format) or raw.disease (old format)
    const topDiseasesRaw = await Analysis.aggregate([
      {
        $match: {
          $or: [
            { 'raw.diseases': { $exists: true, $ne: null, $ne: [] } },
            { 'raw.disease': { $exists: true, $ne: null } }
          ]
        },
      },
      {
        $project: {
          diseases: {
            $cond: {
              if: { $gt: [{ $size: { $ifNull: ['$raw.diseases', []] } }, 0] },
              then: '$raw.diseases',
              else: {
                $cond: {
                  if: { $ne: ['$raw.disease', null] },
                  then: [{ name: '$raw.disease.name' }],
                  else: []
                }
              }
            }
          }
        }
      },
      {
        $unwind: {
          path: '$diseases',
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $match: {
          'diseases.name': { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$diseases.name',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Top plants identified
    const topPlantsRaw = await Analysis.aggregate([
      {
        $match: {
          'resultTop.plant.commonName': { $exists: true },
        },
      },
      {
        $group: {
          _id: '$resultTop.plant.commonName',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Translate disease and plant names to Vietnamese (if needed)
    // Note: Names should already be in Vietnamese from formatPlantIdResult, but translate again to ensure
    const { translateWithGPT } = await import('../../common/libs/plantid.js');
    
    // Helper to check if text is Vietnamese (has Vietnamese characters)
    const isVietnamese = (text) => {
      return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/.test(text);
    };
    
    const topDiseases = await Promise.all(
      topDiseasesRaw.map(async (item) => {
        const name = item._id;
        // Skip translation if already Vietnamese or contains Vietnamese characters
        if (isVietnamese(name) || name.includes('được gọi là') || name.length > 50) {
          return {
            name: name,
            count: item.count,
          };
        }
        
        // Translate English/technical names
        try {
          const translatedName = await translateWithGPT(name, 'disease');
          return {
            name: translatedName,
            count: item.count,
          };
        } catch (error) {
          console.warn(`Failed to translate disease "${name}":`, error.message);
          return {
            name: name,
            count: item.count,
          };
        }
      })
    );

    const topPlants = await Promise.all(
      topPlantsRaw.map(async (item) => {
        const name = item._id;
        // Skip translation if already Vietnamese or contains Vietnamese characters
        if (isVietnamese(name) || name.includes('được gọi là') || name.length > 50) {
          return {
            name: name,
            count: item.count,
          };
        }
        
        // Translate English/technical/scientific names
        try {
          const translatedName = await translateWithGPT(name, 'plant');
          return {
            name: translatedName,
            count: item.count,
          };
        } catch (error) {
          console.warn(`Failed to translate plant "${name}":`, error.message);
          return {
            name: name,
            count: item.count,
          };
        }
      })
    );

    return {
      usersToday: usersToday.length,
      analysesToday,
      pendingComplaints,
      chartData: {
        dailyUsage,
      },
      topDiseases,
      topPlants,
    };
  } catch (error) {
    throw httpError(500, `Failed to get analysis statistics: ${error.message}`);
  }
};

/**
 * Get community statistics
 * @returns {Promise<object>} Community statistics
 */
export const getCommunityStats = async () => {
  try {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    // Get posts today
    const postsToday = await Post.countDocuments({
      createdAt: { $gte: startOfToday },
      status: 'published',
    });

    // Get total likes today (sum of all posts' likes array length)
    const postsWithLikesToday = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfToday },
          status: 'published',
        },
      },
      {
        $project: {
          likesCount: { $size: { $ifNull: ['$likes', []] } },
        },
      },
      {
        $group: {
          _id: null,
          totalLikes: { $sum: '$likesCount' },
        },
      },
    ]);
    const likesToday = postsWithLikesToday[0]?.totalLikes || 0;

    // Get total comments today (sum of all posts' comments array length)
    const postsWithCommentsToday = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfToday },
          status: 'published',
        },
      },
      {
        $project: {
          commentsCount: { $size: { $ifNull: ['$comments', []] } },
        },
      },
      {
        $group: {
          _id: null,
          totalComments: { $sum: '$commentsCount' },
        },
      },
    ]);
    const commentsToday = postsWithCommentsToday[0]?.totalComments || 0;

    // Get pending reports
    const pendingReports = await Report.countDocuments({
      status: 'pending',
    });

    // Last 7 days for all trend charts
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Posts trend for last 7 days
    const postsTrend = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          status: 'published',
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Interactions trend (likes + comments) for last 7 days
    const interactionsTrend = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          status: 'published',
        },
      },
      {
        $project: {
          date: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          likesCount: { $size: { $ifNull: ['$likes', []] } },
          commentsCount: { $size: { $ifNull: ['$comments', []] } },
        },
      },
      {
        $group: {
          _id: '$date',
          likes: { $sum: '$likesCount' },
          comments: { $sum: '$commentsCount' },
        },
      },
      {
        $project: {
          _id: 1,
          count: { $add: ['$likes', '$comments'] },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Reports trend for last 7 days - split by status
    const reportsTrendPending = await Report.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          status: { $in: ['pending', 'reviewing'] },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const reportsTrendResolved = await Report.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          status: 'resolved',
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Most liked posts today
    const mostLikedToday = await Post.find({
      createdAt: { $gte: startOfToday },
      status: 'published',
    })
      .populate('author', 'name profileImage')
      .sort({ likes: -1 })
      .limit(5)
      .lean();

    const mostLikedPosts = mostLikedToday.map(post => ({
      id: post._id.toString(),
      author: {
        avatar: post.author?.profileImage || '',
        name: post.author?.name || 'Unknown',
      },
      title: post.title,
      likes: post.likes?.length || 0,
      comments: post.comments?.length || 0,
    }));

    // Most commented posts today
    const mostCommentedToday = await Post.find({
      createdAt: { $gte: startOfToday },
      status: 'published',
    })
      .populate('author', 'name profileImage')
      .sort({ comments: -1 })
      .limit(5)
      .lean();

    const mostCommentedPosts = mostCommentedToday.map(post => ({
      id: post._id.toString(),
      author: {
        avatar: post.author?.profileImage || '',
        name: post.author?.name || 'Unknown',
      },
      title: post.title,
      likes: post.likes?.length || 0,
      comments: post.comments?.length || 0,
    }));

    return {
      postsToday,
      likesToday,
      commentsToday,
      pendingReports,
      chartData: {
        postsTrend,
        interactionsTrend,
        reportsTrend: {
          pending: reportsTrendPending,
          resolved: reportsTrendResolved,
        },
      },
      topPosts: {
        mostLiked: mostLikedPosts,
        mostCommented: mostCommentedPosts,
      },
    };
  } catch (error) {
    throw httpError(500, `Failed to get community statistics: ${error.message}`);
  }
};

