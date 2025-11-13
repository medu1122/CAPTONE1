import { httpSuccess, httpError } from '../../common/utils/http.js';
import Post from './post.model.js';
import User from '../auth/auth.model.js';
import cloudinaryService from '../../common/libs/cloudinary.js';

/**
 * Helper function to group comments by parent (convert flat structure to nested)
 * @param {Array} comments - Array of comments
 * @returns {Array} Nested comments structure with replies
 */
const groupComments = (comments) => {
  const commentsMap = new Map();
  const rootComments = [];
  
  comments.forEach(comment => {
    const commentObj = typeof comment.toObject === 'function' ? comment.toObject() : comment;
    if (!commentObj.parentComment) {
      commentObj.replies = [];
      commentsMap.set(commentObj._id.toString(), commentObj);
      rootComments.push(commentObj);
    } else {
      const parentId = commentObj.parentComment.toString();
      if (commentsMap.has(parentId)) {
        if (!commentsMap.get(parentId).replies) {
          commentsMap.get(parentId).replies = [];
        }
        commentsMap.get(parentId).replies.push(commentObj);
      } else {
        // If parent not found yet, add to root (shouldn't happen but handle gracefully)
        commentObj.replies = [];
        commentsMap.set(commentObj._id.toString(), commentObj);
        rootComments.push(commentObj);
      }
    }
  });
  
  // Sort replies by createdAt
  commentsMap.forEach(comment => {
    if (comment.replies) {
      comment.replies.sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
    }
  });
  
  // Sort root comments by createdAt
  return rootComments.sort((a, b) => 
    new Date(a.createdAt) - new Date(b.createdAt)
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
    console.log('📝 [POST] Creating new post...');
    console.log('   Title:', req.body.title);
    console.log('   Has files:', req.files ? req.files.length : 0);
    
    // Handle image uploads if any
    let images = [];
    if (req.files && req.files.length > 0) {
      console.log(`📤 [POST] Uploading ${req.files.length} image(s) to Cloudinary...`);
      
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
      
      console.log(`✅ [POST] ${images.length} image(s) uploaded successfully`);
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
      console.log(`✅ [POST] Processed ${images.length} base64 image(s)`);
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
    
    console.log('💾 [POST] Saving post to database...');
    const post = await Post.create(postData);
    console.log(`✅ [POST] Post created with ID: ${post._id}`);
    
    // Update user stats: increment totalPosts
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'stats.totalPosts': 1 },
      $set: { 'stats.lastActiveAt': new Date() },
    });
    console.log('✅ [POST] User stats updated');
    
    // Populate author after creation
    await post.populate('author', 'name profileImage');
    
    const { statusCode, body } = httpSuccess(201, 'Post created successfully', post);
    
    console.log('✅ [POST] Post creation completed successfully');
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
            commentsCount: { $size: { $ifNull: ['$comments', []] } },
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
      
      // Populate author and comments for each post
      const populatedPosts = await Post.populate(posts, [
        { path: 'author', select: 'name profileImage' },
        { path: 'comments.author', select: 'name profileImage' },
      ]);
      
      // Group comments by parent (convert flat structure to nested)
      populatedPosts.forEach(post => {
        post.comments = groupComments(post.comments);
      });
      
      const count = await Post.countDocuments(query);
      
      const { statusCode, body } = httpSuccess(200, 'Posts retrieved successfully', {
        posts: populatedPosts,
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
      .populate('comments.author', 'name profileImage')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sortOption);
    
    // Group comments by parent (convert flat structure to nested)
    posts.forEach(post => {
      post.comments = groupComments(post.comments);
    });
    
    const count = await Post.countDocuments(query);
    
    const { statusCode, body } = httpSuccess(200, 'Posts retrieved successfully', {
      posts,
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
      .populate('plants')
      .populate('comments.author', 'name profileImage');
      // Note: Don't populate likes - frontend expects array of IDs
    
    if (!post) {
      return next(httpError(404, 'Post not found'));
    }
    
    // Only show published posts to non-authors
    if (post.status !== 'published' && 
        (!req.user || post.author._id.toString() !== req.user.id && req.user.role !== 'admin')) {
      return next(httpError(404, 'Post not found'));
    }
    
    // Group comments by parent (convert flat structure to nested)
    post.comments = groupComments(post.comments);
    
    const { statusCode, body } = httpSuccess(200, 'Post retrieved successfully', post);
    
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
      .populate('comments.author', 'name profileImage');
    
    // Group comments by parent
    updatedPost.comments = groupComments(updatedPost.comments);
    
    const { statusCode, body } = httpSuccess(200, 'Post updated successfully', updatedPost);
    
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
    
    // If parentCommentId is provided, verify it exists
    let parentCommentId = req.body.parentId || null;
    if (parentCommentId) {
      const parentComment = post.comments.id(parentCommentId);
      if (!parentComment) {
        return next(httpError(404, 'Parent comment not found'));
      }
    }
    
    const comment = {
      content: req.body.content,
      author: req.user.id,
      parentComment: parentCommentId,
    };
    
    post.comments.push(comment);
    await post.save();
    
    // Update user stats: increment totalComments
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'stats.totalComments': 1 },
      $set: { 'stats.lastActiveAt': new Date() },
    });
    
    // Populate the new comment's author
    await post.populate('comments.author', 'name profileImage');
    
    // Group comments by parent
    post.comments = groupComments(post.comments);
    
    const { statusCode, body } = httpSuccess(201, 'Comment added successfully', post);
    
    res.status(statusCode).json(body);
  } catch (error) {
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
    
    // Populate author and comments for response
    await post.populate('author', 'name profileImage');
    await post.populate('comments.author', 'name profileImage');
    
    // Group comments by parent
    post.comments = groupComments(post.comments);
    
    const { statusCode, body } = httpSuccess(200, 'Post like toggled successfully', post);
    
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
  toggleLike,
};
