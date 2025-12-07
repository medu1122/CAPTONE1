import Comment from './comment.model.js';
import Post from '../posts/post.model.js';

/**
 * Get comments for a post
 * @param {string} postId - Post ID
 * @param {object} options - Query options
 * @param {number} options.limit - Limit results
 * @param {number} options.skip - Skip results
 * @param {string} options.parentCommentId - Filter by parent comment (null for root comments)
 * @returns {Promise<object>} Comments and metadata
 */
export const getCommentsByPost = async (postId, options = {}) => {
  try {
    const { limit = 100, skip = 0, parentCommentId = null, includeReplies = false } = options;

    const query = { post: postId };
    
    // If includeReplies is true, get ALL comments (root + replies) for grouping
    // Otherwise, filter by parentCommentId
    if (!includeReplies) {
      if (parentCommentId === null) {
        query.parentComment = null; // Root comments only
      } else if (parentCommentId) {
        query.parentComment = parentCommentId; // Replies to specific comment
      }
    }
    // If includeReplies is true, don't filter by parentComment (get all)

    const comments = await Comment.find(query)
      .populate('author', 'name profileImage')
      .populate('parentComment', 'content author')
      .sort({ createdAt: 1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await Comment.countDocuments(query);

    return {
      comments,
      total,
    };
  } catch (error) {
    console.error('❌ [Comment Service] Error getting comments:', error);
    throw error;
  }
};

/**
 * Get comment by ID
 * @param {string} commentId - Comment ID
 * @returns {Promise<object>} Comment object
 */
export const getCommentById = async (commentId) => {
  try {
    const comment = await Comment.findById(commentId)
      .populate('author', 'name profileImage')
      .populate('parentComment', 'content author')
      .populate('post', 'title');

    if (!comment) {
      throw new Error('Comment not found');
    }

    return comment;
  } catch (error) {
    console.error('❌ [Comment Service] Error getting comment:', error);
    throw error;
  }
};

/**
 * Create a new comment
 * @param {object} data - Comment data
 * @param {string} data.postId - Post ID
 * @param {string} data.authorId - Author ID
 * @param {string} data.content - Comment content
 * @param {string} data.parentCommentId - Parent comment ID (optional)
 * @param {Array} data.images - Comment images (optional)
 * @returns {Promise<object>} Created comment
 */
export const createComment = async (data) => {
  try {
    const { postId, authorId, content, parentCommentId = null, images = [] } = data;

    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // If parentCommentId is provided, verify it exists and belongs to the same post
    if (parentCommentId) {
      const parentComment = await Comment.findOne({
        _id: parentCommentId,
        post: postId,
      });
      if (!parentComment) {
        throw new Error('Parent comment not found');
      }
    }

    // Create comment
    const comment = await Comment.create({
      post: postId,
      author: authorId,
      parentComment: parentCommentId,
      content,
      images,
      likes: [],
      replyCount: 0,
    });

    // Update parent comment's replyCount if this is a reply
    if (parentCommentId) {
      await Comment.findByIdAndUpdate(parentCommentId, {
        $inc: { replyCount: 1 },
      });
    }

    // Update post's commentCount
    await Post.findByIdAndUpdate(postId, {
      $inc: { commentCount: 1 },
    });

    // Populate author
    await comment.populate('author', 'name profileImage');
    if (parentCommentId) {
      await comment.populate('parentComment', 'content author');
    }

    return comment;
  } catch (error) {
    console.error('❌ [Comment Service] Error creating comment:', error);
    throw error;
  }
};

/**
 * Update a comment
 * @param {string} commentId - Comment ID
 * @param {string} userId - User ID (for authorization)
 * @param {object} updates - Update data
 * @param {string} updates.content - New content (optional)
 * @param {Array} updates.images - New images (optional)
 * @returns {Promise<object>} Updated comment
 */
export const updateComment = async (commentId, userId, updates) => {
  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    // Check authorization
    if (comment.author.toString() !== userId) {
      throw new Error('Not authorized to update this comment');
    }

    // Update fields
    if (updates.content !== undefined) {
      comment.content = updates.content;
    }
    if (updates.images !== undefined) {
      comment.images = updates.images;
    }

    await comment.save();

    // Populate author
    await comment.populate('author', 'name profileImage');
    if (comment.parentComment) {
      await comment.populate('parentComment', 'content author');
    }

    return comment;
  } catch (error) {
    console.error('❌ [Comment Service] Error updating comment:', error);
    throw error;
  }
};

/**
 * Delete a comment
 * @param {string} commentId - Comment ID
 * @param {string} userId - User ID (for authorization)
 * @param {boolean} isAdmin - Whether user is admin
 * @returns {Promise<object>} Deletion result
 */
export const deleteComment = async (commentId, userId, isAdmin = false) => {
  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    // Check authorization
    if (comment.author.toString() !== userId && !isAdmin) {
      throw new Error('Not authorized to delete this comment');
    }

    const postId = comment.post;
    const parentCommentId = comment.parentComment;

    // Delete all replies first (recursive)
    const replies = await Comment.find({ parentComment: commentId });
    for (const reply of replies) {
      await deleteComment(reply._id.toString(), userId, isAdmin);
    }

    // Delete the comment
    await Comment.findByIdAndDelete(commentId);

    // Update parent comment's replyCount if this was a reply
    if (parentCommentId) {
      await Comment.findByIdAndUpdate(parentCommentId, {
        $inc: { replyCount: -1 },
      });
    }

    // Count total deleted (this comment + all replies)
    const totalDeleted = 1 + replies.length;
    
    // Update post's commentCount (decrement by total deleted)
    await Post.findByIdAndUpdate(postId, {
      $inc: { commentCount: -totalDeleted },
    });

    return { success: true, deletedCount: totalDeleted };
  } catch (error) {
    console.error('❌ [Comment Service] Error deleting comment:', error);
    throw error;
  }
};

/**
 * Group comments into nested structure (root comments with replies)
 * @param {Array} comments - Flat array of comments
 * @returns {Array} Nested structure with replies
 */
export const groupComments = (comments) => {
  if (!comments || !Array.isArray(comments) || comments.length === 0) {
    return [];
  }

  const commentsMap = new Map();
  const rootComments = [];

  // First pass: create map and identify root comments
  comments.forEach((comment) => {
    // Handle both Mongoose documents and plain objects (from .lean())
    let commentObj;
    if (typeof comment.toObject === 'function') {
      commentObj = comment.toObject({ virtuals: false });
    } else {
      // Deep clone to avoid reference issues
      commentObj = JSON.parse(JSON.stringify(comment));
    }
    
    // Normalize parentComment to string or null
    let parentId = null;
    if (commentObj.parentComment) {
      if (typeof commentObj.parentComment === 'object' && commentObj.parentComment._id) {
        parentId = commentObj.parentComment._id.toString();
      } else if (typeof commentObj.parentComment === 'object') {
        parentId = commentObj.parentComment.toString();
      } else {
        parentId = String(commentObj.parentComment);
      }
    }
    
    // Store normalized parentComment
    commentObj.parentComment = parentId;
    commentObj.replies = [];
    
    const commentId = commentObj._id.toString();
    commentsMap.set(commentId, commentObj);

    if (!parentId) {
      rootComments.push(commentObj);
    }
  });

  // Second pass: add replies to their parents
  comments.forEach((comment) => {
    const commentId = comment._id.toString();
    const commentObj = commentsMap.get(commentId);
    
    if (commentObj && commentObj.parentComment) {
      const parentId = commentObj.parentComment.toString();
      const parent = commentsMap.get(parentId);
      if (parent) {
        // Deep clone reply to avoid reference issues
        const replyCopy = JSON.parse(JSON.stringify(commentObj));
        parent.replies.push(replyCopy);
      } else {
        console.warn(`⚠️  [groupComments] Parent comment ${parentId} not found for reply ${commentId}`);
      }
    }
  });

  // Sort replies by createdAt
  commentsMap.forEach((comment) => {
    if (comment.replies && comment.replies.length > 0) {
      comment.replies.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    }
  });

  // Sort root comments by createdAt
  rootComments.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

  // Deep clone result to ensure proper serialization
  return JSON.parse(JSON.stringify(rootComments));
};

