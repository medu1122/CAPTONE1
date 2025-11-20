import express from 'express';
import multer from 'multer';
import { uploadImage } from './imageUpload.controller.js';
import { authMiddleware } from '../../common/middleware/auth.js';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

/**
 * @route POST /api/v1/image-upload/upload
 * @desc Upload image to Cloudinary
 * @access Public (can be protected with authMiddleware if needed)
 */
router.post('/upload', upload.single('image'), uploadImage);

export default router;

