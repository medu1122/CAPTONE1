import { API_CONFIG } from '../config/api';

interface UploadOptions {
  folder?: string;
  quality?: string;
  format?: string;
}

interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
}

class ImageUploadService {
  private static instance: ImageUploadService;
  private cloudinaryConfigured: boolean = false;

  private constructor() {
    // Check if Cloudinary credentials are available
    if (API_CONFIG.CLOUDINARY.CLOUD_NAME && API_CONFIG.CLOUDINARY.API_KEY && API_CONFIG.CLOUDINARY.API_SECRET) {
      this.cloudinaryConfigured = true;
    } else {
      console.warn('Cloudinary credentials are not fully configured. Image upload will not work.');
    }
  }

  public static getInstance(): ImageUploadService {
    if (!ImageUploadService.instance) {
      ImageUploadService.instance = new ImageUploadService();
    }
    return ImageUploadService.instance;
  }

  async uploadImage(file: File, options?: UploadOptions): Promise<UploadResult> {
    if (!this.cloudinaryConfigured) {
      throw new Error('Cloudinary service is not configured. Cannot upload image.');
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onloadend = () => {
        const base64 = reader.result as string;
        
        // Create form data for Cloudinary upload
        const formData = new FormData();
        formData.append('file', base64);
        formData.append('cloud_name', API_CONFIG.CLOUDINARY.CLOUD_NAME);
        formData.append('api_key', API_CONFIG.CLOUDINARY.API_KEY);
        formData.append('upload_preset', 'ml_default'); // You may need to create this preset
        
        // Upload to Cloudinary using fetch
        fetch(`https://api.cloudinary.com/v1_1/${API_CONFIG.CLOUDINARY.CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: formData
        })
        .then(response => response.json())
        .then(result => {
          if (result.error) {
            throw new Error(`Cloudinary upload failed: ${result.error.message}`);
          }
          
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
          });
        })
        .catch(error => {
          console.error('Cloudinary upload error:', error);
          reject(new Error(`Failed to upload image: ${error.message}`));
        });
      };
      
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        reject(new Error('Failed to read file.'));
      };
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    if (!this.cloudinaryConfigured) {
      throw new Error('Cloudinary service is not configured. Cannot delete image.');
    }

    // For deletion, we need to use the admin API with signature
    // This is a simplified version - in production, you should handle this on the backend
    console.warn('Image deletion requires backend implementation for security reasons.');
    return Promise.resolve();
  }

  getImageUrl(publicId: string, options?: any): string {
    if (!this.cloudinaryConfigured) {
      console.warn('Cloudinary service is not configured. Returning placeholder for image URL.');
      return `https://via.placeholder.com/150?text=${publicId}`;
    }
    
    // Build Cloudinary URL manually
    const baseUrl = `https://res.cloudinary.com/${API_CONFIG.CLOUDINARY.CLOUD_NAME}/image/upload`;
    const params = new URLSearchParams();
    
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        params.append(key, String(value));
      });
    }
    
    return `${baseUrl}/${params.toString() ? '?' + params.toString() : ''}/${publicId}`;
  }
}

export const imageUploadService = ImageUploadService.getInstance();