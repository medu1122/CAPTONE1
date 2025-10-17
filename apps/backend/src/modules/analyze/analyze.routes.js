import express from 'express';
import { analyzePlant } from './analyze.controller.js';
import { streamAnalyzeResponse } from './analyze.stream.controller.js';
import { uploadImage } from '../../common/middleware/upload.js';
import { validateAnalyzeRequest } from './analyze.validation.js';

const router = express.Router();

// POST /api/v1/analyze - Main analyze endpoint
router.post(
  '/', 
  uploadImage.single('image'), 
  validateAnalyzeRequest, 
  analyzePlant
);

// GET /api/v1/analyze/stream - Stream analyze endpoint
router.get('/stream', streamAnalyzeResponse);

export default router;