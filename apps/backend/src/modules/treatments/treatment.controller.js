import { createMockData, searchDiseaseNames, getTreatmentRecommendations } from './treatment.service.js';

/**
 * Initialize mock data for testing
 * @route POST /api/v1/treatments/init-mock
 */
export const initMockData = async (req, res, next) => {
  try {
    console.log('🔧 [TreatmentController] Initializing mock data...');
    
    const success = await createMockData();
    
    if (success) {
      return res.status(200).json({
        success: true,
        message: 'Mock data initialized successfully',
        data: {
          collections: ['products', 'biological_methods', 'cultural_practices'],
          status: 'ready'
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to initialize mock data'
      });
    }
  } catch (error) {
    console.error('❌ [TreatmentController] Error:', error);
    next(error);
  }
};

/**
 * Get treatment stats
 * @route GET /api/v1/treatments/stats
 */
export const getStats = async (req, res, next) => {
  try {
    const Product = (await import('./product.model.js')).default;
    const BiologicalMethod = (await import('./biologicalMethod.model.js')).default;
    const CulturalPractice = (await import('./culturalPractice.model.js')).default;

    const [productsCount, bioMethodsCount, culturalCount] = await Promise.all([
      Product.countDocuments(),
      BiologicalMethod.countDocuments(),
      CulturalPractice.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        products: productsCount,
        biologicalMethods: bioMethodsCount,
        culturalPractices: culturalCount,
        total: productsCount + bioMethodsCount + culturalCount
      }
    });
  } catch (error) {
    console.error('❌ [TreatmentController] Error getting stats:', error);
    next(error);
  }
};

/**
 * Search disease names for autocomplete
 * @route GET /api/v1/treatments/search-diseases
 */
export const searchDiseases = async (req, res, next) => {
  try {
    const { q } = req.query;
    
    // Allow empty query to return common diseases
    const query = q ? q.trim() : '';
    
    const results = await searchDiseaseNames(query);
    
    return res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('❌ [TreatmentController] Error searching diseases:', error);
    next(error);
  }
};

/**
 * Get treatment recommendations for a disease and plant
 * @route GET /api/v1/treatments/recommendations
 */
export const getRecommendations = async (req, res, next) => {
  try {
    const { disease, plant } = req.query;
    
    if (!disease) {
      return res.status(400).json({
        success: false,
        message: 'Disease name is required'
      });
    }
    
    const recommendations = await getTreatmentRecommendations(disease, plant || null);
    
    return res.status(200).json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('❌ [TreatmentController] Error getting recommendations:', error);
    next(error);
  }
};

