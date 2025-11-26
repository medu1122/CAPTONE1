import express from 'express';
import postController from './post.controller.js';
import { authMiddleware } from '../../common/middleware/auth.js';
import { uploadImage } from '../../common/middleware/upload.js';
import {
  validateCreatePost,
  validateUpdatePost,
  validateAddComment,
  validateGetPosts,
} from './post.validation.js';

const router = express.Router();

// Public routes
router.get('/', validateGetPosts, postController.getAllPosts);
router.get('/:id', postController.getPostById);

// Protected routes
router.post('/', authMiddleware, uploadImage.array('images', 10), validateCreatePost, postController.createPost);
router.put('/:id', authMiddleware, validateUpdatePost, postController.updatePost);
router.delete('/:id', authMiddleware, postController.deletePost);
router.post('/:id/comments', authMiddleware, uploadImage.array('images', 5), validateAddComment, postController.addComment);
router.put('/:id/comments/:commentId', authMiddleware, uploadImage.array('images', 5), validateAddComment, postController.updateComment);
router.delete('/:id/comments/:commentId', authMiddleware, postController.deleteComment);
router.post('/:id/like', authMiddleware, postController.toggleLike);

export default router;
