const express = require('express');
const postController = require('./post.controller');
const { authMiddleware } = require('../../common/middleware/auth');

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

module.exports = router;
