import multer from 'multer';
import { httpError } from '../utils/http.js';
import { MAX_IMAGE_SIZE_MB, ALLOWED_IMAGE_MIME_TYPES } from '../constants.js';

// Convert MB to bytes
const MAX_FILE_SIZE = MAX_IMAGE_SIZE_MB * 1024 * 1024;

// Configure multer for memory storage (better for cloud uploads)
const storage = multer.memoryStorage();

// File filter function to validate file types
const fileFilter = (req, file, cb) => {
  // Check if the file mimetype is allowed
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      httpError(
        400, 
        `Invalid file type. Allowed types: ${ALLOWED_IMAGE_MIME_TYPES.join(', ')}`
      ),
      false
    );
  }
  cb(null, true);
};

// Create multer upload instance
const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

// Export middleware functions
export const uploadImage = {
  single: (fieldName = 'image') => upload.single(fieldName),
  array: (fieldName = 'images', maxCount = 5) => upload.array(fieldName, maxCount),
  fields: (fields) => upload.fields(fields),
};

export default uploadImage;