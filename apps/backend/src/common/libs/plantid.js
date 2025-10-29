import axios from 'axios';

const PLANTID_API_KEY = process.env.PLANTID_API_KEY;
const PLANTID_BASE_URL = 'https://plant.id/api/v3';

/**
 * Convert image URL to base64 data
 * @param {string} imageUrl - Image URL (HTTP/HTTPS or data URL)
 * @returns {Promise<string>} Base64 encoded image with data URI prefix
 */
const imageUrlToBase64 = async (imageUrl) => {
  try {
    // Validate input
    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new Error('Invalid image URL: must be a non-empty string');
    }

    // If already base64 data URL, return as-is
    if (imageUrl.startsWith('data:image')) {
      return imageUrl;
    }

    // If blob URL, can't fetch it server-side
    if (imageUrl.startsWith('blob:')) {
      throw new Error('Blob URLs cannot be processed server-side. Please upload the image first.');
    }

    // Fetch image from URL
    console.log('📥 Fetching image from URL:', imageUrl);
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 15000  // 15 second timeout
    });

    // Convert to base64
    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    const contentType = response.headers['content-type'] || 'image/jpeg';
    
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error('❌ Failed to convert image URL to base64:', error.message);
    throw new Error(`Failed to load image from URL: ${error.message}`);
  }
};

/**
 * Call Plant.id V3 API for plant identification
 * @param {object} params - Parameters
 * @param {string} params.imageData - Base64 encoded image data (with data:image/...;base64, prefix) OR image URL
 * @returns {Promise<object>} Plant identification result
 */
export const identifyPlant = async ({ imageData }) => {
  try {
    if (!PLANTID_API_KEY) {
      throw new Error('Plant.id API key not configured');
    }

    console.log('🌿 Calling Plant.id API for plant identification...');

    // Convert URL to base64 if needed
    const base64Image = await imageUrlToBase64(imageData);
    console.log('✅ Image converted to base64, length:', base64Image.length);

    // Plant.id V3 expects base64 images in array
    const response = await axios.post(
      `${PLANTID_BASE_URL}/identification`,
      {
        images: [base64Image],  // Array of base64 images
        similar_images: true,
        health: 'all',  // Include health assessment
        classification_level: 'all'  // Get all classification levels
      },
      {
        headers: {
          'Api-Key': PLANTID_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 30000  // 30 second timeout
      }
    );

    console.log('✅ Plant.id API response received');

    const data = response.data;

    // Parse response
    const result = {
      is_plant: data.result?.is_plant?.binary || false,
      is_healthy: data.result?.is_healthy?.binary || true,
      suggestions: []
    };

    // Get top suggestions
    if (data.result?.classification?.suggestions) {
      result.suggestions = data.result.classification.suggestions.slice(0, 5).map(suggestion => ({
        id: suggestion.id,
        name: suggestion.name,
        probability: suggestion.probability,
        similar_images: suggestion.similar_images?.map(img => ({
          id: img.id,
          url: img.url,
          similarity: img.similarity
        })) || []
      }));
    }

    // Get disease information if unhealthy
    if (!result.is_healthy && data.result?.disease?.suggestions) {
      result.diseases = data.result.disease.suggestions.slice(0, 3).map(disease => ({
        id: disease.id,
        name: disease.name,
        probability: disease.probability,
        description: disease.details?.description || '',
        treatment: disease.details?.treatment || {},
        similar_images: disease.similar_images?.map(img => ({
          id: img.id,
          url: img.url,
          similarity: img.similarity
        })) || []
      }));
    }

    return {
      success: true,
      data: result,
      raw: data  // Keep raw response for debugging
    };

  } catch (error) {
    console.error('❌ Plant.id API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      throw new Error('Invalid Plant.id API key');
    }
    if (error.response?.status === 429) {
      throw new Error('Plant.id API rate limit exceeded');
    }
    
    throw new Error(`Plant.id API failed: ${error.message}`);
  }
};

/**
 * Format Plant.id response to match our application format
 * @param {object} plantIdResult - Raw Plant.id result
 * @returns {object} Formatted result
 */
export const formatPlantIdResult = (plantIdResult) => {
  const topSuggestion = plantIdResult.data.suggestions[0];
  
  if (!topSuggestion) {
    return {
      plant: null,
      disease: null,
      confidence: 0,
      isHealthy: true
    };
  }

  const formatted = {
    plant: {
      id: topSuggestion.id,
      commonName: topSuggestion.name,
      scientificName: topSuggestion.id,  // Plant.id uses scientific name as ID
      probability: topSuggestion.probability
    },
    isHealthy: plantIdResult.data.is_healthy,
    confidence: topSuggestion.probability,
    disease: null
  };

  // Add disease if unhealthy
  if (!plantIdResult.data.is_healthy && plantIdResult.data.diseases) {
    const topDisease = plantIdResult.data.diseases[0];
    if (topDisease && topDisease.probability > 0.5) {  // Only include if probability > 50%
      formatted.disease = {
        id: topDisease.id,
        name: topDisease.name,
        probability: topDisease.probability,
        description: topDisease.description,
        treatment: topDisease.treatment
      };
    }
  }

  return formatted;
};

export default {
  identifyPlant,
  formatPlantIdResult
};

