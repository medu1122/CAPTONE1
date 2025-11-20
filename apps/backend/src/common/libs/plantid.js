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
    
    // DEBUG: Log full response structure
    console.log('🔍 [DEBUG] Plant.id response structure:', {
      hasResult: !!data.result,
      hasClassification: !!data.result?.classification,
      hasDisease: !!data.result?.disease,
      isHealthy: data.result?.is_healthy?.binary,
      diseaseCount: data.result?.disease?.suggestions?.length || 0
    });

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

    // Get disease information
    // Always check for diseases, even if is_healthy = true
    if (data.result?.disease?.suggestions && data.result.disease.suggestions.length > 0) {
      console.log('🦠 [DEBUG] Found diseases:', data.result.disease.suggestions.length);
      data.result.disease.suggestions.forEach((d, i) => {
        console.log(`   ${i+1}. ${d.name}: ${(d.probability * 100).toFixed(1)}%`);
      });
      
      // ✅ Show ALL diseases (no limit) - sorted by probability (already sorted by API)
      result.diseases = data.result.disease.suggestions.map(disease => ({
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
    } else {
      console.log('⚠️  [DEBUG] No diseases found in API response');
      console.log('   is_healthy:', result.is_healthy);
      console.log('   has disease object:', !!data.result?.disease);
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
 * Translate to Vietnamese using GPT
 * @param {string} text - Text to translate
 * @param {string} type - Type: 'plant' or 'disease'
 * @returns {Promise<string>} Vietnamese translation
 */
const translateWithGPT = async (text, type = 'plant') => {
  try {
    const { generateAIResponse } = await import('../../modules/aiAssistant/ai.service.js');
    
    // 🚨 EXTREME STRICT PROMPT: Force GPT to return ONLY the name
    const prompt = type === 'plant' 
      ? `You are a translation bot. Return ONLY the Vietnamese plant name. NO explanations. NO sentences. NO prefixes.

Plant name: "${text}"

Examples:
Input: "Oryza sativa" → Output: "Lúa"
Input: "Solanum lycopersicum" → Output: "Cà chua"
Input: "Vigna unguiculata" → Output: "Đậu lăng"

⛔ DO NOT write:
- "Cây này được gọi là..."
- "Đây là..."
- Any explanation

✅ ONLY write the Vietnamese name (2-4 words max):
`
      : `You are a translation bot. Return ONLY the Vietnamese disease name. NO explanations. NO sentences.

Disease name: "${text}"

Examples:
Input: "herbicide damage" → Output: "Thiệt hại do thuốc diệt cỏ"
Input: "leaf spot" → Output: "Đốm lá"

⛔ DO NOT write explanations.

✅ ONLY write the Vietnamese disease name:
`;
    
    const response = await generateAIResponse({
      messages: [{ role: 'user', content: prompt }],
      weather: null,
      analysis: null,
      products: null
    });
    
    // Extract just the name from response (clean up any extra text)
    let translated = response.data.message.trim();
    
    // Remove common prefixes that GPT might add
    translated = translated
      .replace(/^(Output:|Answer:|Tên tiếng Việt:|Vietnamese name:|Đây là|Cây này là|Bệnh này là|This is):?\s*/i, '')
      .replace(/["'`]/g, '')  // Remove quotes
      .replace(/\.$/, '')  // Remove trailing period
      .trim();
    
    // If still contains explanatory text, take only first line or first few words
    if (translated.includes('được gọi là') || translated.includes('trong tiếng Việt')) {
      const match = translated.match(/là\s+([^.]+)/);
      if (match) {
        translated = match[1].trim();
      }
    }
    
    // Final cleanup: If longer than 50 chars, probably wrong - fallback to original
    if (translated.length > 50) {
      console.warn(`⚠️  Translation too long (${translated.length} chars), using original`);
      translated = text;
    }
    
    console.log(`🔄 Translated "${text}" → "${translated}"`);
    return translated;
  } catch (error) {
    console.warn(`Translation failed for "${text}":`, error.message);
    return text; // Fallback to original
  }
};

/**
 * Format Plant.id response to match our application format
 * @param {object} plantIdResult - Raw Plant.id result
 * @returns {object} Formatted result
 */
export const formatPlantIdResult = async (plantIdResult) => {
  const topSuggestion = plantIdResult.data.suggestions[0];
  
  if (!topSuggestion) {
    return {
      plant: null,
      disease: null,
      confidence: 0,
      isHealthy: true
    };
  }

  // Require at least 70% confidence to identify plant name
  // Below 70% = unreliable, don't show specific plant name
  const isReliable = topSuggestion.probability >= 0.7;
  
  if (!isReliable) {
    console.log(`⚠️  Low plant confidence: ${(topSuggestion.probability * 100).toFixed(1)}% - Cannot reliably identify plant`);
  }

  // ✅ ALWAYS translate plant name (even if low confidence)
  // Show top result regardless of confidence level
  const plantNameVi = await translateWithGPT(topSuggestion.name, 'plant');

  const formatted = {
    plant: {
      id: topSuggestion.id,
      commonName: plantNameVi,  // Vietnamese name (always show)
      scientificName: topSuggestion.name,  // ✅ Always show scientific name
      probability: topSuggestion.probability,
      lowConfidence: !isReliable,  // Flag: < 70% = unreliable
      reliable: isReliable  // Flag: >= 70% = reliable
    },
    isHealthy: plantIdResult.data.is_healthy,
    confidence: topSuggestion.probability,
    disease: null,
    allDiseases: []  // ✅ NEW: All detected diseases
  };

  // Add disease information
  // Check diseases REGARDLESS of is_healthy flag (Plant.id can be inconsistent)
  if (plantIdResult.data.diseases && plantIdResult.data.diseases.length > 0) {
    // ✅ NEW: Process ALL diseases (not just top 1)
    const allDiseases = [];
    
    for (const disease of plantIdResult.data.diseases) {
      // Only include diseases with confidence >= 5% (filter out noise)
      if (disease && disease.probability >= 0.05) {
        try {
          // Translate disease name to Vietnamese using GPT
          const diseaseNameVi = await translateWithGPT(disease.name, 'disease');
          
          allDiseases.push({
            id: disease.id,
            name: diseaseNameVi,  // Vietnamese name from GPT
            originalName: disease.name,  // Keep original English name
            probability: disease.probability,
            description: disease.description,
            treatment: disease.treatment
          });
        } catch (error) {
          console.warn(`Failed to translate disease: ${disease.name}`, error);
          // Add with original name if translation fails
          allDiseases.push({
            id: disease.id,
            name: disease.name,
            originalName: disease.name,
            probability: disease.probability,
            description: disease.description,
            treatment: disease.treatment
          });
        }
      }
    }
    
    formatted.allDiseases = allDiseases;
    
    // Set top disease (for backward compatibility)
    const topDisease = allDiseases[0];
    if (topDisease && topDisease.probability >= 0.5) {
      formatted.disease = topDisease;
      
      // If disease detected with high confidence, mark as unhealthy
      if (topDisease.probability > 0.5) {
        formatted.isHealthy = false;
      }
      
      console.log(`🦠 Top disease: ${topDisease.name} (${(topDisease.probability * 100).toFixed(1)}%)`);
    }
    
    console.log(`🦠 Total diseases found: ${allDiseases.length}`);
  }

  return formatted;
};

export default {
  identifyPlant,
  formatPlantIdResult
};

