import { httpSuccess, httpError } from '../../common/utils/http.js';
import Post from './post.model.js';
import User from '../auth/auth.model.js';
import cloudinaryService from '../../common/libs/cloudinary.js';
import { moderatePost, moderateComment } from '../moderation/moderation.service.js';
import { createNotification, extractMentions } from '../notifications/notification.service.js';
import { broadcastNotification } from '../notifications/notification.stream.controller.js';
import {
  getCommentsByPost,
  createComment as createCommentService,
  updateComment as updateCommentService,
  deleteComment as deleteCommentService,
  groupComments,
} from '../comments/comment.service.js';
import Comment from '../comments/comment.model.js';

/**
 * Helper function to group comments by parent (DEPRECATED - use comment.service.js)
 * Kept for backward compatibility with embedded comments
 * @param {Array} comments - Array of comments
 * @returns {Array} Nested comments structure with replies
 */
const groupCommentsLegacy = (comments) => {
  const commentsMap = new Map();
  const rootComments = [];
  
  // First pass: create all comment objects and add root comments to map
  comments.forEach(comment => {
    // Convert to plain object while preserving populated fields
    let commentObj;
    if (typeof comment.toObject === 'function') {
      // Use toObject with options to preserve populated fields
      commentObj = comment.toObject({ 
        virtuals: false,
        transform: (doc, ret) => {
          // Ensure author is preserved (populated or as ObjectId)
          if (doc.author) {
            ret.author = doc.author;
          }
          // Ensure parentComment is preserved (as ObjectId string for comparison)
          if (doc.parentComment) {
            ret.parentComment = doc.parentComment;
          }
          return ret;
        }
      });
    } else {
      commentObj = { ...comment };
    }
    
    // Ensure _id is available as string for comparison
    const commentId = commentObj._id ? commentObj._id.toString() : null;
    
    // Normalize parentComment to string
    let parentId = null;
    if (commentObj.parentComment) {
      if (typeof commentObj.parentComment === 'object') {
        parentId = commentObj.parentComment._id 
          ? commentObj.parentComment._id.toString() 
          : commentObj.parentComment.toString();
      } else {
        parentId = commentObj.parentComment.toString();
      }
    }
    
    // Initialize replies array
    commentObj.replies = [];
    
    if (!parentId) {
      // Root comment - add to map and root list
      if (commentId) {
        commentsMap.set(commentId, commentObj);
      }
      rootComments.push(commentObj);
    } else {
      // Reply comment - store for second pass
      // We'll add it to parent's replies in second pass
      if (commentId) {
        commentsMap.set(commentId, commentObj);
      }
    }
  });
  
  // Second pass: add replies to their parents
  comments.forEach((comment) => {
    let commentObj;
    if (typeof comment.toObject === 'function') {
      commentObj = comment.toObject({ 
        virtuals: false,
        transform: (doc, ret) => {
          if (doc.author) ret.author = doc.author;
          if (doc.parentComment) ret.parentComment = doc.parentComment;
          return ret;
        }
      });
    } else {
      commentObj = { ...comment };
    }
    
    const commentId = commentObj._id ? commentObj._id.toString() : null;
    
    // Normalize parentComment to string
    let parentId = null;
    if (commentObj.parentComment) {
      if (typeof commentObj.parentComment === 'object') {
        parentId = commentObj.parentComment._id 
          ? commentObj.parentComment._id.toString() 
          : commentObj.parentComment.toString();
      } else {
        parentId = commentObj.parentComment.toString();
      }
    }
    
    if (parentId) {
      if (commentsMap.has(parentId)) {
        // This is a reply - add to parent's replies
        const parentComment = commentsMap.get(parentId);
        if (!parentComment.replies) {
          parentComment.replies = [];
        }
        // Get the comment object from map (already processed)
        const replyObj = commentsMap.get(commentId);
        if (replyObj) {
          parentComment.replies.push(replyObj);
        }
      }
    }
  });
  
  // Sort replies by createdAt
  commentsMap.forEach(comment => {
    if (comment.replies && comment.replies.length > 0) {
      comment.replies.sort((a, b) => 
        new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      );
    }
  });
  
  // Sort root comments by createdAt
  return rootComments.sort((a, b) => 
    new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
  );
};

/**
 * Create a new post
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const createPost = async (req, res, next) => {
  try {
    // Handle image uploads if any
    let images = [];
    if (req.files && req.files.length > 0) {
      
      // Check if Cloudinary is configured
      const hasCloudinaryConfig = 
        process.env.CLOUDINARY_CLOUD_NAME && 
        process.env.CLOUDINARY_API_KEY && 
        process.env.CLOUDINARY_API_SECRET;
      
      if (!hasCloudinaryConfig) {
        console.error('❌ [POST] Cloudinary not configured');
        return next(httpError(500, 'Image upload is not configured. Please configure Cloudinary credentials in .env file'));
      }
      
      // Upload images to Cloudinary
      const uploadPromises = req.files.map(async (file, index) => {
        try {
          const fileSizeKB = (file.size / 1024).toFixed(2);
          console.log(`   📤 Uploading image ${index + 1}/${req.files.length} (${fileSizeKB} KB)...`);
          console.log(`   📤 File type: ${file.mimetype}, Original name: ${file.originalname}`);
          
          const startTime = Date.now();
          const uploadResult = await cloudinaryService.uploadBuffer(
            file.buffer,
            'posts',
            {
              transformation: [
                // Use 'limit' to resize only if larger, don't crop
                // This preserves aspect ratio and doesn't cut off parts of the image
                { width: 1200, height: 1200, crop: 'limit' },
                { quality: 'auto' },
                { fetch_format: 'auto' }, // Auto format (webp when possible)
              ],
            }
          );
          const uploadTime = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`   ✅ Image ${index + 1} uploaded in ${uploadTime}s: ${uploadResult.secure_url}`);
          return {
            url: uploadResult.secure_url,
            caption: '', // Can be added later if needed
          };
        } catch (error) {
          console.error(`   ❌ Error uploading image ${index + 1}:`, error);
          // Provide more specific error messages
          let errorMessage = 'Failed to upload image';
          if (error.message?.includes('Invalid cloud_name')) {
            errorMessage = 'Cloudinary cloud name is invalid. Please check CLOUDINARY_CLOUD_NAME in .env';
          } else if (error.message?.includes('Invalid API Key')) {
            errorMessage = 'Cloudinary API key is invalid. Please check CLOUDINARY_API_KEY in .env';
          } else if (error.message?.includes('Invalid signature')) {
            errorMessage = 'Cloudinary API secret is invalid. Please check CLOUDINARY_API_SECRET in .env';
          } else if (error.message?.includes('ECONNREFUSED') || error.message?.includes('ETIMEDOUT')) {
            errorMessage = 'Cannot connect to Cloudinary. Please check your internet connection';
          } else {
            errorMessage = `Failed to upload image: ${error.message || 'Unknown error'}`;
          }
          throw httpError(500, errorMessage);
        }
      });
      
      // Use Promise.allSettled to handle partial failures gracefully
      const uploadResults = await Promise.allSettled(uploadPromises);
      
      // Check for any failures
      const failedUploads = uploadResults.filter(result => result.status === 'rejected');
      if (failedUploads.length > 0) {
        console.error(`❌ [POST] ${failedUploads.length} image(s) failed to upload`);
        failedUploads.forEach((result, index) => {
          console.error(`   Failed image ${index + 1}:`, result.reason?.message || 'Unknown error');
        });
        
        // If all uploads failed, return error
        if (failedUploads.length === uploadResults.length) {
          const firstError = failedUploads[0].reason;
          return next(firstError || httpError(500, 'All image uploads failed'));
        }
        
        // If some succeeded, log warning but continue with successful uploads
        console.warn(`⚠️  [POST] Continuing with ${uploadResults.length - failedUploads.length} successful upload(s)`);
      }
      
      // Extract successful uploads
      images = uploadResults
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);
      
    } else if (req.body.images && Array.isArray(req.body.images)) {
      // Handle base64 images from frontend (fallback)
      // Note: This is less efficient, prefer file upload
      const base64Promises = req.body.images.map(async (imageData) => {
        if (imageData.url && imageData.url.startsWith('data:image/')) {
          try {
            // Convert base64 to buffer
            const base64Data = imageData.url.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            
            const uploadResult = await cloudinaryService.uploadBuffer(
              buffer,
              'posts',
              {
                transformation: [
                  { width: 1200, height: 1200, crop: 'limit' },
                  { quality: 'auto' },
                ],
              }
            );
            return {
              url: uploadResult.secure_url,
              caption: imageData.caption || '',
            };
          } catch (error) {
            console.error('Error uploading base64 image:', error);
            throw httpError(500, `Failed to upload image: ${error.message}`);
          }
        }
        // If already a URL, return as is
        return {
          url: imageData.url,
          caption: imageData.caption || '',
        };
      });
      
      images = await Promise.all(base64Promises);
    }
    
    // Parse JSON fields if they come as strings (from FormData)
    let tags = [];
    if (req.body.tags) {
      try {
        tags = typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags;
      } catch (e) {
        tags = Array.isArray(req.body.tags) ? req.body.tags : [];
      }
    }
    
    let plants = [];
    if (req.body.plants) {
      try {
        plants = typeof req.body.plants === 'string' ? JSON.parse(req.body.plants) : req.body.plants;
      } catch (e) {
        plants = Array.isArray(req.body.plants) ? req.body.plants : [];
      }
    }
    
    // 🔍 Content Moderation - Check before saving
    const moderationResult = await moderatePost({
      title: req.body.title,
      content: req.body.content,
    });
    
    if (!moderationResult.approved) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung không phù hợp với cộng đồng',
        code: 'CONTENT_MODERATION_FAILED',
        data: {
          reason: moderationResult.reason,
          issues: moderationResult.issues || [],
          suggestedContent: moderationResult.suggestedContent || null,
        },
      });
    }
    
    const postData = {
      title: req.body.title,
      content: req.body.content,
      images: images,
      tags: tags,
      plants: plants,
      category: req.body.category || 'discussion',
      author: req.user.id,
      status: req.body.status || 'published',
    };
    
    const post = await Post.create(postData);
    // Update user stats: increment totalPosts
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'stats.totalPosts': 1 },
      $set: { 'stats.lastActiveAt': new Date() },
    });
    
    // Populate author after creation
    await post.populate('author', 'name profileImage');
    
    const { statusCode, body } = httpSuccess(201, 'Post created successfully', post);
    
    res.status(statusCode).json(body);
  } catch (error) {
    console.error('❌ [POST] Error creating post:', error);
    next(error);
  }
};

/**
 * Get all posts
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const getAllPosts = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      tag, 
      search, 
      category,
      sortBy = 'latest' 
    } = req.query;
    
    const query = {
      status: 'published', // Only show published posts
    };
    
    // Filter by tag
    if (tag) {
      query.tags = tag;
    }
    
    // Filter by category
    if (category) {
      query.category = category;
    }
    
    // Search by text
    if (search) {
      query.$text = { $search: search };
    }
    
    // For sorting by likes/comments count, we need to use aggregation
    if (sortBy === 'popular' || sortBy === 'mostCommented') {
      const aggregationPipeline = [
        { $match: query },
        {
          $addFields: {
            likesCount: { $size: { $ifNull: ['$likes', []] } },
            commentsCount: { $ifNull: ['$commentCount', 0] },
          },
        },
        {
          $sort: sortBy === 'popular' 
            ? { likesCount: -1, createdAt: -1 }
            : { commentsCount: -1, createdAt: -1 }
        },
        { $skip: (page - 1) * limit },
        { $limit: limit * 1 },
      ];
      
      const posts = await Post.aggregate(aggregationPipeline);
      
      // Populate author for each post
      const populatedPosts = await Post.populate(posts, [
        { path: 'author', select: 'name profileImage' },
      ]);
      
      // Fetch comments for each post and group them
      const postsArray = await Promise.all(populatedPosts.map(async (post) => {
        const postObj = post.toObject ? post.toObject() : post;
        
      // Get ALL comments (root + replies) from Comment collection for grouping
      const commentsData = await getCommentsByPost(post._id.toString(), { limit: 100, includeReplies: true });
      const groupedComments = groupComments(commentsData.comments);
        
        // Add comments to post object
        postObj.comments = groupedComments;
        
        return postObj;
      }));
      
      const count = await Post.countDocuments(query);
      
      const { statusCode, body } = httpSuccess(200, 'Posts retrieved successfully', {
        posts: postsArray,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalItems: count,
      });
      
      return res.status(statusCode).json(body);
    }
    
    // Default sort: latest first
    const sortOption = { createdAt: -1 };
    
    const posts = await Post.find(query)
      .populate('author', 'name profileImage')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sortOption);
    
    // Fetch comments for each post and group them
    const postsArray = await Promise.all(posts.map(async (post) => {
      const postObj = post.toObject ? post.toObject() : post;
      
      // Get ALL comments (root + replies) from Comment collection for grouping
      const commentsData = await getCommentsByPost(post._id.toString(), { limit: 10, includeReplies: true });
      const groupedComments = groupComments(commentsData.comments);
      
      // Add comments to post object
      postObj.comments = groupedComments;
      
      return postObj;
    }));
    
    const count = await Post.countDocuments(query);
    
    const { statusCode, body } = httpSuccess(200, 'Posts retrieved successfully', {
      posts: postsArray,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalItems: count,
    });
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Get post by ID
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name profileImage')
      .populate('plants');
      // Note: Don't populate likes - frontend expects array of IDs
    
    if (!post) {
      return next(httpError(404, 'Post not found'));
    }
    
    // Only show published posts to non-authors
    if (post.status !== 'published' && 
        (!req.user || post.author._id.toString() !== req.user.id && req.user.role !== 'admin')) {
      return next(httpError(404, 'Post not found'));
    }
    
    // Convert to plain object
    const postObj = post.toObject ? post.toObject() : post;
    
    // Get ALL comments (root + replies) from Comment collection for grouping
    const commentsData = await getCommentsByPost(req.params.id, { limit: 200, includeReplies: true });
    const groupedComments = groupComments(commentsData.comments);
    
    // Add comments to post object
    postObj.comments = groupedComments;
    
    const { statusCode, body } = httpSuccess(200, 'Post retrieved successfully', postObj);
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Update post
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return next(httpError(404, 'Post not found'));
    }
    
    // Check if user is authorized to update
    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(httpError(403, 'Not authorized to update this post'));
    }
    
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('author', 'name profileImage')
      .populate('plants');
    
    // Get comments from Comment collection
    const commentsData = await getCommentsByPost(req.params.id, { limit: 200 });
    const groupedComments = groupComments(commentsData.comments);
    
    // Convert to plain object
    const postObj = updatedPost.toObject ? updatedPost.toObject() : updatedPost;
    postObj.comments = groupedComments;
    
    const { statusCode, body } = httpSuccess(200, 'Post updated successfully', postObj);
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete post
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return next(httpError(404, 'Post not found'));
    }
    
    // Check if user is authorized to delete
    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(httpError(403, 'Not authorized to delete this post'));
    }
    
    // Delete all comments for this post
    const commentsResult = await Comment.deleteMany({ post: req.params.id });
    
    // Delete the post
    await Post.findByIdAndDelete(req.params.id);
    
    const { statusCode, body } = httpSuccess(200, 'Post deleted successfully');
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Add comment to post
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const addComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return next(httpError(404, 'Post not found'));
    }
    
    // Only allow comments on published posts
    if (post.status !== 'published') {
      return next(httpError(400, 'Cannot comment on unpublished post'));
    }
    
    // Get parentCommentId if provided
    const parentCommentId = req.body.parentId || null;
    
    // 🔍 Content Moderation - Check comment before saving
    const moderationResult = await moderateComment({
      content: req.body.content,
    });
    
    if (!moderationResult.approved) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung bình luận không phù hợp với cộng đồng',
        code: 'CONTENT_MODERATION_FAILED',
        data: {
          reason: moderationResult.reason,
          issues: moderationResult.issues || [],
          suggestedContent: moderationResult.suggestedContent || null,
        },
      });
    }
    
    // Handle image uploads for comment if any
    let images = [];
    if (req.files && req.files.length > 0) {
      
      const hasCloudinaryConfig = 
        process.env.CLOUDINARY_CLOUD_NAME && 
        process.env.CLOUDINARY_API_KEY && 
        process.env.CLOUDINARY_API_SECRET;
      
      if (!hasCloudinaryConfig) {
        console.error('❌ [COMMENT] Cloudinary not configured');
        return next(httpError(500, 'Image upload is not configured'));
      }
      
      const uploadPromises = req.files.map(async (file, index) => {
        try {
          const uploadResult = await cloudinaryService.uploadBuffer(
            file.buffer,
            'comments',
            {
              transformation: [
                { width: 1200, height: 1200, crop: 'limit' },
                { quality: 'auto' },
                { fetch_format: 'auto' },
              ],
            }
          );
          return {
            url: uploadResult.secure_url,
            caption: '',
          };
        } catch (error) {
          console.error(`   ❌ Error uploading image ${index + 1}:`, error);
          throw httpError(500, `Failed to upload image: ${error.message}`);
        }
      });
      
      const uploadResults = await Promise.allSettled(uploadPromises);
      images = uploadResults
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);
      
    } else if (req.body.images && Array.isArray(req.body.images)) {
      // Handle base64 images from frontend (fallback)
      const base64Promises = req.body.images.map(async (imageData) => {
        if (imageData.url && imageData.url.startsWith('data:image/')) {
          try {
            const base64Data = imageData.url.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            
            const uploadResult = await cloudinaryService.uploadBuffer(
              buffer,
              'comments',
              {
                transformation: [
                  { width: 1200, height: 1200, crop: 'limit' },
                  { quality: 'auto' },
                ],
              }
            );
            return {
              url: uploadResult.secure_url,
              caption: imageData.caption || '',
            };
          } catch (error) {
            console.error('Error uploading base64 image:', error);
            throw httpError(500, `Failed to upload image: ${error.message}`);
          }
        }
        return {
          url: imageData.url,
          caption: imageData.caption || '',
        };
      });
      
      images = await Promise.all(base64Promises);
    }
    
    // Create comment using Comment service
    const newComment = await createCommentService({
      postId: req.params.id,
      authorId: req.user.id,
      content: req.body.content,
      parentCommentId: parentCommentId,
      images: images,
    });
    
    // Update user stats: increment totalComments
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'stats.totalComments': 1 },
      $set: { 'stats.lastActiveAt': new Date() },
    });
    
    // Get updated post with all comments
    const updatedPost = await Post.findById(req.params.id)
      .populate('author', 'name profileImage')
      .populate('plants');
    
    if (!updatedPost) {
      return next(httpError(404, 'Post not found after comment creation'));
    }
    
    // Get ALL comments (root + replies) and group them
    const commentsData = await getCommentsByPost(req.params.id, { limit: 200, includeReplies: true });
    const groupedComments = groupComments(commentsData.comments);
    
    // Convert to plain object
    const postObj = updatedPost.toObject ? updatedPost.toObject() : updatedPost;
    postObj.comments = groupedComments;
    
    // Create notifications for reply/mention
    try {
      if (parentCommentId) {
        // This is a reply - notify the parent comment author
        const parentComment = await Comment.findById(parentCommentId).populate('author');
        if (parentComment && parentComment.author._id.toString() !== req.user.id.toString()) {
          const notification = await createNotification({
            userId: parentComment.author._id,
            type: 'reply',
            actorId: req.user.id,
            postId: post._id,
            commentId: newComment._id,
            content: req.body.content.substring(0, 100),
            metadata: {
              postTitle: post.title,
            },
          });
          
          if (notification) {
            await broadcastNotification(parentComment.author._id.toString(), notification);
          }
        }
      } else {
        // This is a new comment - notify post author
        if (post.author.toString() !== req.user.id.toString()) {
          const notification = await createNotification({
            userId: post.author,
            type: 'comment',
            actorId: req.user.id,
            postId: post._id,
            commentId: newComment._id,
            content: req.body.content.substring(0, 100),
            metadata: {
              postTitle: post.title,
            },
          });
          
          if (notification) {
            await broadcastNotification(post.author.toString(), notification);
          }
        }
      }
      
      // Extract mentions and notify mentioned users
      const mentionedUserIds = await extractMentions(req.body.content);
      for (const mentionedUserId of mentionedUserIds) {
        if (mentionedUserId.toString() !== req.user.id.toString()) {
          const notification = await createNotification({
            userId: mentionedUserId,
            type: 'mention',
            actorId: req.user.id,
            postId: post._id,
            commentId: newComment._id,
            content: req.body.content.substring(0, 100),
            metadata: {
              postTitle: post.title,
            },
          });
          
          if (notification) {
            await broadcastNotification(mentionedUserId.toString(), notification);
          }
        }
      }
    } catch (error) {
      console.error('❌ [COMMENT] Error creating notifications:', error);
      // Don't fail the request if notification creation fails
    }
    
    const { statusCode, body } = httpSuccess(201, 'Comment added successfully', postObj);
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Update comment
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const updateComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return next(httpError(404, 'Post not found'));
    }
    
    const commentId = req.params.commentId;
    
    // 🔍 Content Moderation - Check updated comment before saving
    const moderationResult = await moderateComment({
      content: req.body.content,
    });
    
    if (!moderationResult.approved) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung bình luận không phù hợp với cộng đồng',
        code: 'CONTENT_MODERATION_FAILED',
        data: {
          reason: moderationResult.reason,
          issues: moderationResult.issues || [],
          suggestedContent: moderationResult.suggestedContent || null,
        },
      });
    }
    
    // Handle image uploads for comment if any
    let images = comment.images ? [...comment.images] : [];
    if (req.files && req.files.length > 0) {
      
      const hasCloudinaryConfig = 
        process.env.CLOUDINARY_CLOUD_NAME && 
        process.env.CLOUDINARY_API_KEY && 
        process.env.CLOUDINARY_API_SECRET;
      
      if (!hasCloudinaryConfig) {
        console.error('❌ [UPDATE COMMENT] Cloudinary not configured');
        return next(httpError(500, 'Image upload is not configured'));
      }
      
      const uploadPromises = req.files.map(async (file, index) => {
        try {
          const uploadResult = await cloudinaryService.uploadBuffer(
            file.buffer,
            'comments',
            {
              transformation: [
                { width: 1200, height: 1200, crop: 'limit' },
                { quality: 'auto' },
                { fetch_format: 'auto' },
              ],
            }
          );
          return {
            url: uploadResult.secure_url,
            caption: '',
          };
        } catch (error) {
          console.error(`   ❌ Error uploading image ${index + 1}:`, error);
          throw httpError(500, `Failed to upload image: ${error.message}`);
        }
      });
      
      const uploadResults = await Promise.allSettled(uploadPromises);
      const newImages = uploadResults
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);
      
      // Merge with existing images or replace
      if (req.body.replaceImages === 'true') {
        images = newImages;
      } else {
        images = [...images, ...newImages];
      }
      
    } else if (req.body.images && Array.isArray(req.body.images)) {
      // Handle base64 images from frontend (fallback)
      const base64Promises = req.body.images.map(async (imageData) => {
        if (imageData.url && imageData.url.startsWith('data:image/')) {
          try {
            const base64Data = imageData.url.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            
            const uploadResult = await cloudinaryService.uploadBuffer(
              buffer,
              'comments',
              {
                transformation: [
                  { width: 1200, height: 1200, crop: 'limit' },
                  { quality: 'auto' },
                ],
              }
            );
            return {
              url: uploadResult.secure_url,
              caption: imageData.caption || '',
            };
          } catch (error) {
            console.error('Error uploading base64 image:', error);
            throw httpError(500, `Failed to upload image: ${error.message}`);
          }
        }
        return {
          url: imageData.url,
          caption: imageData.caption || '',
        };
      });
      
      const newImages = await Promise.all(base64Promises);
      if (req.body.replaceImages === 'true') {
        images = newImages;
      } else {
        images = [...images, ...newImages];
      }
    }
    
    // Update comment using Comment service
    const updatedComment = await updateCommentService(commentId, req.user.id, {
      content: req.body.content,
      images: images,
    });
    
    // Get updated post with all comments
    const updatedPost = await Post.findById(req.params.id)
      .populate('author', 'name profileImage')
      .populate('plants');
    
    // Get ALL comments (root + replies) and group them
    const commentsData = await getCommentsByPost(req.params.id, { limit: 200, includeReplies: true });
    const groupedComments = groupComments(commentsData.comments);
    
    // Convert to plain object
    const postObj = updatedPost.toObject ? updatedPost.toObject() : updatedPost;
    postObj.comments = groupedComments;
    
    const { statusCode, body } = httpSuccess(200, 'Comment updated successfully', postObj);
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete comment
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const deleteComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return next(httpError(404, 'Post not found'));
    }
    
    const commentId = req.params.commentId;
    
    // Get comment before deletion to update user stats
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return next(httpError(404, 'Comment not found'));
    }
    
    // Delete comment using Comment service (includes recursive deletion of replies)
    const result = await deleteCommentService(commentId, req.user.id, req.user.role === 'admin');
    
    // Update user stats: decrement totalComments
    await User.findByIdAndUpdate(comment.author, {
      $inc: { 'stats.totalComments': -result.deletedCount },
    });
    
    // Get updated post with all comments
    const updatedPost = await Post.findById(req.params.id)
      .populate('author', 'name profileImage')
      .populate('plants');
    
    // Get ALL comments (root + replies) and group them
    const commentsData = await getCommentsByPost(req.params.id, { limit: 200, includeReplies: true });
    const groupedComments = groupComments(commentsData.comments);
    
    // Convert to plain object
    const postObj = updatedPost.toObject ? updatedPost.toObject() : updatedPost;
    postObj.comments = groupedComments;
    
    const { statusCode, body } = httpSuccess(200, 'Comment deleted successfully', postObj);
    
    res.status(statusCode).json(body);
  } catch (error) {
    if (error.message === 'Comment not found') {
      return next(httpError(404, error.message));
    }
    if (error.message === 'Not authorized to delete this comment') {
      return next(httpError(403, error.message));
    }
    next(error);
  }
};

/**
 * Like/unlike post
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return next(httpError(404, 'Post not found'));
    }
    
    // Only allow likes on published posts
    if (post.status !== 'published') {
      return next(httpError(400, 'Cannot like unpublished post'));
    }
    
    // Check if user already liked the post
    const index = post.likes.findIndex(
      (userId) => userId.toString() === req.user.id
    );
    
    // Get post author ID before updating
    const postAuthorId = post.author.toString();
    
    if (index === -1) {
      // Like post
      post.likes.push(req.user.id);
      
      // Update post author stats: increment totalLikes
      await User.findByIdAndUpdate(postAuthorId, {
        $inc: { 'stats.totalLikes': 1 },
      });
      
      // Create notification for like (only when liking, not unliking)
      try {
        if (postAuthorId !== req.user.id.toString()) {
          const notification = await createNotification({
            userId: postAuthorId,
            type: 'like',
            actorId: req.user.id,
            postId: post._id,
            content: post.title,
            metadata: {
              postTitle: post.title,
            },
          });
          
          if (notification) {
            await broadcastNotification(postAuthorId, notification);
          }
        }
      } catch (error) {
        console.error('❌ [POST] Error creating like notification:', error);
        // Don't fail the request if notification creation fails
      }
    } else {
      // Unlike post
      post.likes = post.likes.filter(
        (userId) => userId.toString() !== req.user.id
      );
      
      // Update post author stats: decrement totalLikes
      await User.findByIdAndUpdate(postAuthorId, {
        $inc: { 'stats.totalLikes': -1 },
      });
    }
    
    await post.save();
    
    // Populate author for response
    await post.populate('author', 'name profileImage');
    
    // Get ALL comments (root + replies) from Comment collection for grouping
    const commentsData = await getCommentsByPost(req.params.id, { limit: 100, includeReplies: true });
    const groupedComments = groupComments(commentsData.comments);
    
    // Convert to plain object
    const postObj = post.toObject ? post.toObject() : post;
    postObj.comments = groupedComments;
    
    const { statusCode, body } = httpSuccess(200, 'Post like toggled successfully', postObj);
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

export default {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  addComment,
  updateComment,
  deleteComment,
  toggleLike,
};
