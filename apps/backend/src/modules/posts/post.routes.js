import express from 'express';
import postController from './post.controller.js';
import { authMiddleware } from '../../common/middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', postController.getAllPosts);
router.get('/:id', postController.getPostById);

// Protected routes
router.post('/', authMiddleware, postController.createPost);
router.put('/:id', authMiddleware, postController.updatePost);
router.delete('/:id', authMiddleware, postController.deletePost);
router.post('/:id/comments', authMiddleware, postController.addComment);
router.post('/:id/like', authMiddleware, postController.toggleLike);

export default router;
