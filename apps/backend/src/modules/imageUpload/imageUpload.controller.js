import cloudinaryService from '../../common/libs/cloudinary.js';
import { httpError } from '../../common/utils/http.js';

/**
 * Upload image to Cloudinary
 * Expects multipart/form-data with 'image' field
 */
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided',
      });
    }

    // Upload to Cloudinary
    const result = await cloudinaryService.uploadBuffer(
      req.file.buffer,
      'plant-analysis', // folder name
      {
        transformation: [
          { width: 1024, height: 1024, crop: 'limit' }, // Max dimensions
          { quality: 'auto' }, // Auto quality
          { fetch_format: 'auto' }, // Auto format
        ],
      }
    );

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      },
    });
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload image',
    });
  }
};

