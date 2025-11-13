import cloudinary from 'cloudinary';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Use v2 API
const cloudinaryV2 = cloudinary.v2;

// Validate Cloudinary configuration
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.warn('⚠️  Cloudinary credentials not found in environment variables.');
  console.warn('   Upload functionality will not work without Cloudinary configuration.');
  console.warn('   Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env file');
}

// Configure cloudinary (only if credentials are available)
if (cloudName && apiKey && apiSecret) {
  cloudinaryV2.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
  
  // Test connection on startup (async, non-blocking)
  cloudinaryV2.api.ping((error, result) => {
    if (error) {
      console.error('❌ Cloudinary connection test failed:', error.message);
      console.error('   Please verify your Cloudinary credentials in .env file');
    } else {
      console.log('✅ Cloudinary configured and connected successfully');
      console.log(`   Cloud: ${cloudName}`);
    }
  });
}

/**
 * Upload file to cloudinary
 * @param {string} filePath - Path to file
 * @param {object} options - Upload options
 * @returns {Promise} Upload result
 */
const uploadFile = async (filePath, options = {}) => {
  try {
    const result = await cloudinaryV2.uploader.upload(filePath, options);
    return result;
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

/**
 * Upload file buffer to cloudinary (for multer memory storage)
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} folder - Cloudinary folder path
 * @param {object} options - Upload options
 * @returns {Promise} Upload result with secure_url
 */
const uploadBuffer = async (fileBuffer, folder = 'profiles', options = {}) => {
  // Check if Cloudinary is configured
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env file');
  }
  
  return new Promise((resolve, reject) => {
    // Set timeout for upload (60 seconds)
    const timeout = setTimeout(() => {
      reject(new Error('Cloudinary upload timeout: Upload took longer than 60 seconds'));
    }, 60000);
    
    const uploadOptions = {
      folder,
      resource_type: 'image',
      timeout: 60000, // 60 seconds timeout
      ...options,
    };
    
    const uploadStream = cloudinaryV2.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        clearTimeout(timeout); // Clear timeout on completion
        
        if (error) {
          console.error('❌ [Cloudinary] Upload error:', error);
          reject(new Error(`Cloudinary upload failed: ${error.message || 'Unknown error'}`));
        } else {
          console.log('✅ [Cloudinary] Upload successful:', result?.secure_url);
          resolve(result);
        }
      }
    );
    
    // Handle stream errors
    uploadStream.on('error', (error) => {
      clearTimeout(timeout);
      console.error('❌ [Cloudinary] Stream error:', error);
      reject(new Error(`Cloudinary stream error: ${error.message || 'Unknown error'}`));
    });
    
    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete file from cloudinary
 * @param {string} publicId - Public ID of the file
 * @returns {Promise} Deletion result
 */
const deleteFile = async (publicId) => {
  try {
    const result = await cloudinaryV2.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Cloudinary deletion failed: ${error.message}`);
  }
};

export default {
  cloudinary: cloudinaryV2,
  uploadFile,
  uploadBuffer,
  deleteFile,
};
