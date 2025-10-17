import { httpSuccess, httpError } from '../../common/utils/http.js';
import Post from './post.model.js';

/**
 * Create a new post
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const createPost = async (req, res, next) => {
  try {
    const postData = {
      ...req.body,
      author: req.user.id,
    };
    
    const post = await Post.create(postData);
    const { statusCode, body } = httpSuccess(201, 'Post created successfully', post);
    
    res.status(statusCode).json(body);
  } catch (error) {
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
    const { page = 1, limit = 10, tag, search } = req.query;
    const query = {};
    
    // Filter by tag
    if (tag) {
      query.tags = tag;
    }
    
    // Search by text
    if (search) {
      query.$text = { $search: search };
    }
    
    const posts = await Post.find(query)
      .populate('author', 'name profileImage')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const count = await Post.countDocuments(query);
    
    const { statusCode, body } = httpSuccess(200, 'Posts retrieved successfully', {
      posts,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
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
    
    if (!post) {
      return next(httpError(404, 'Post not found'));
    }
    
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
    );
    
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
    
    await post.remove();
    
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
    
    const comment = {
      content: req.body.content,
      author: req.user.id,
    };
    
    post.comments.push(comment);
    await post.save();
    
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
    
    // Check if user already liked the post
    const index = post.likes.findIndex(
      (userId) => userId.toString() === req.user.id
    );
    
    if (index === -1) {
      // Like post
      post.likes.push(req.user.id);
    } else {
      // Unlike post
      post.likes = post.likes.filter(
        (userId) => userId.toString() !== req.user.id
      );
    }
    
    await post.save();
    
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
