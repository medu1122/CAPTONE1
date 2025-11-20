import { identifyPlant, formatPlantIdResult } from '../../common/libs/plantid.js';
import { getTreatmentRecommendations, getAdditionalInfo } from '../treatments/treatment.service.js';
import { generateTreatmentAdvice } from '../treatments/treatmentAdvisor.service.js';
import { getPlantCareInfo } from '../plants/plant.service.js';
import { httpError } from '../../common/utils/http.js';

/**
 * Analyze Service - Pure Image Analysis (No Chat)
 * Focuses on plant identification and disease detection
 */

/**
 * Analyze plant image and return comprehensive results
 * @param {object} params - Parameters
 * @param {string} params.imageUrl - Image URL to analyze
 * @param {string} params.userId - User ID (optional)
 * @returns {Promise<object>} Complete analysis results
 */
export const analyzeImage = async ({ imageUrl, userId = null }) => {
  try {
    console.log('🔬 [analyzeImage] Starting analysis:', { imageUrl: imageUrl?.substring(0, 50), userId });

    // 1. Call Plant.id API
    const plantIdResponse = await identifyPlant({ imageData: imageUrl });
    
    if (!plantIdResponse || !plantIdResponse.success) {
      throw httpError(400, 'Plant identification failed');
    }

    // 2. Format Plant.id result (translate + structure)
    const plantIdResult = await formatPlantIdResult(plantIdResponse);

    console.log('🌿 [analyzeImage] Plant.id result:', {
      plant: plantIdResult.plant?.commonName,
      disease: plantIdResult.disease?.name,
      isHealthy: plantIdResult.isHealthy,
      allDiseasesCount: plantIdResult.allDiseases?.length || 0
    });

    // 2. Extract analysis data
    const analysis = {
      plant: plantIdResult.plant,
      disease: plantIdResult.disease,
      isHealthy: plantIdResult.isHealthy,
      confidence: plantIdResult.confidence
    };

    // 3. Get ALL diseases from Plant.id (not just top 1)
    // Note: We need to enhance plantid.js to return all diseases
    const allDiseases = plantIdResult.allDiseases || [];
    
    if (allDiseases.length > 0) {
      console.log(`🦠 [analyzeImage] Found ${allDiseases.length} possible diseases`);
    }

    // 4. Get treatments for EACH disease
    const treatmentsByDisease = {};
    const additionalInfoByDisease = {};
    const aiAdviceByDisease = {};  // ✨ NEW: Store AI-generated advice

    if (allDiseases.length > 0) {
      for (const disease of allDiseases) {
        // ✅ Use VIETNAMESE names for database query (DB has Vietnamese data)
        const diseaseName = disease.name;  // Vietnamese name from GPT translation
        const plantName = analysis.plant?.commonName;  // Vietnamese plant name
        
        console.log(`💊 [analyzeImage] Getting treatments for: "${diseaseName}" (plant: "${plantName}")`);
        
        const treatments = await getTreatmentRecommendations(diseaseName, plantName);
        const additionalInfo = await getAdditionalInfo(diseaseName, plantName);
        
        treatmentsByDisease[disease.name] = treatments;
        additionalInfoByDisease[disease.name] = additionalInfo;
        
        // ✨ NEW: Generate AI advice for this disease
        try {
          console.log(`🤖 [analyzeImage] Generating AI advice for: "${diseaseName}"`);
          const aiAdvice = await generateTreatmentAdvice({
            diseaseName,
            diseaseConfidence: disease.confidence,
            plantName,
            treatments
          });
          aiAdviceByDisease[disease.name] = aiAdvice;
          console.log(`✅ [analyzeImage] AI advice generated (${aiAdvice.length} chars)`);
        } catch (error) {
          console.warn(`⚠️  [analyzeImage] Failed to generate AI advice for "${diseaseName}":`, error.message);
          aiAdviceByDisease[disease.name] = null;
        }
      }
    }

    // 5. Get plant care info (if healthy or low disease confidence)
    let careInfo = null;
    if (analysis.isHealthy || (analysis.plant && !analysis.disease)) {
      try {
        const plantName = analysis.plant?.scientificName || analysis.plant?.commonName;
        careInfo = await getPlantCareInfo({ plantName });
      } catch (error) {
        console.warn('Failed to get plant care info:', error.message);
      }
    }

    // 6. Build result object
    const result = {
      // Plant identification
      plant: {
        commonName: analysis.plant?.commonName || null,
        scientificName: analysis.plant?.scientificName || null,
        confidence: analysis.plant?.probability || 0,
        reliable: analysis.plant?.reliable || false
      },
      
      // Health status
      isHealthy: analysis.isHealthy,
      
      // All detected diseases (sorted by confidence)
      diseases: allDiseases.map(d => ({
        name: d.name,
        originalName: d.originalName,
        confidence: d.probability || d.confidence,
        description: d.description || null
      })),
      
      // Treatments organized by disease
      treatments: treatmentsByDisease,
      
      // Additional information by disease
      additionalInfo: additionalInfoByDisease,
      
      // ✨ NEW: AI-generated advice by disease
      aiAdvice: aiAdviceByDisease,
      
      // General care info (for healthy plants)
      care: careInfo || null,
      
      // Metadata
      analyzedAt: new Date(),
      imageUrl
    };

    console.log('✅ [analyzeImage] Analysis complete:', {
      plant: result.plant.commonName,
      diseaseCount: result.diseases.length,
      hasTreatments: Object.keys(result.treatments).length > 0
    });

    return result;

  } catch (error) {
    console.error('❌ [analyzeImage] Error:', error);
    throw httpError(error.statusCode || 500, error.message || 'Image analysis failed');
  }
};

/**
 * Get analysis history for a user
 * @param {object} params - Parameters
 * @param {string} params.userId - User ID
 * @param {number} params.limit - Number of records (default: 10)
 * @returns {Promise<array>} Array of analysis records
 */
export const getAnalysisHistory = async ({ userId, limit = 10 }) => {
  try {
    // Import Analysis model
    const { default: Analysis } = await import('../analyses/analysis.model.js');
    
    const analyses = await Analysis.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    return analyses;
  } catch (error) {
    console.error('❌ [getAnalysisHistory] Error:', error);
    throw httpError(500, 'Failed to get analysis history');
  }
};

/**
 * Get single analysis by ID
 * @param {object} params - Parameters
 * @param {string} params.analysisId - Analysis ID
 * @param {string} params.userId - User ID (for auth check)
 * @returns {Promise<object>} Analysis record
 */
export const getAnalysisById = async ({ analysisId, userId }) => {
  try {
    const { default: Analysis } = await import('../analyses/analysis.model.js');
    
    const analysis = await Analysis.findOne({
      _id: analysisId,
      userId
    }).lean();
    
    if (!analysis) {
      throw httpError(404, 'Analysis not found');
    }
    
    return analysis;
  } catch (error) {
    console.error('❌ [getAnalysisById] Error:', error);
    throw httpError(error.statusCode || 500, error.message || 'Failed to get analysis');
  }
};
