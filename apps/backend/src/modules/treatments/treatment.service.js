import Product from './product.model.js';
import BiologicalMethod from './biologicalMethod.model.js';
import CulturalPractice from './culturalPractice.model.js';
import { extractDiseaseKeywords, normalizeVietnamese } from '../../common/utils/vietnameseUtils.js';

/**
 * Search for disease names in database (for autocomplete/suggestions)
 * Returns suggestions based on query - supports partial matching
 * @param {string} query - Search query (can be empty for common diseases)
 * @returns {Promise<string[]>} Array of unique disease names (sorted by relevance)
 */
export const searchDiseaseNames = async (query) => {
  try {
    const searchQuery = query ? query.trim() : '';
    const normalizedQuery = searchQuery ? normalizeVietnamese(searchQuery) : '';

    // Search in both products and biological_methods
    const [products, biologicalMethods] = await Promise.all([
      Product.find({ verified: true }).select('targetDiseases').lean(),
      BiologicalMethod.find({ verified: true }).select('targetDiseases').lean(),
    ]);

    // Collect all unique disease names with scores
    const diseaseMap = new Map(); // disease -> score
    
    [...products, ...biologicalMethods].forEach(item => {
      if (item.targetDiseases && Array.isArray(item.targetDiseases)) {
        item.targetDiseases.forEach(disease => {
          if (disease && disease.trim()) {
            const normalizedDisease = normalizeVietnamese(disease);
            
            if (!searchQuery || searchQuery.length < 2) {
              // No query or too short: return all diseases (common diseases)
              if (!diseaseMap.has(disease)) {
                diseaseMap.set(disease, 1);
              }
            } else {
              // Has query: calculate match score
              let score = 0;
              
              // Exact match (highest priority)
              if (normalizedDisease === normalizedQuery || disease.toLowerCase() === searchQuery.toLowerCase()) {
                score = 100;
              }
              // Starts with query (high priority)
              else if (normalizedDisease.startsWith(normalizedQuery) || disease.toLowerCase().startsWith(searchQuery.toLowerCase())) {
                score = 80;
              }
              // Contains query (medium priority)
              else if (normalizedDisease.includes(normalizedQuery) || disease.toLowerCase().includes(searchQuery.toLowerCase())) {
                score = 60;
              }
              // Keyword match (lower priority)
              else {
                const keywords = extractDiseaseKeywords(searchQuery);
                const diseaseKeywords = extractDiseaseKeywords(disease);
                
                // Check if any keyword matches
                const keywordMatches = keywords.filter(k => {
                  const normalizedK = normalizeVietnamese(k);
                  return diseaseKeywords.some(dk => {
                    const normalizedDk = normalizeVietnamese(dk);
                    return normalizedDk.includes(normalizedK) || normalizedK.includes(normalizedDk);
                  });
                }).length;
                
                if (keywordMatches > 0) {
                  score = 40 + (keywordMatches * 5); // 40-50 based on number of matches
                }
              }
              
              // Update score if disease already exists (keep highest score)
              if (score > 0) {
                const currentScore = diseaseMap.get(disease) || 0;
                diseaseMap.set(disease, Math.max(currentScore, score));
              }
            }
          }
        });
      }
    });

    // Convert to array and sort by score (descending)
    const diseases = Array.from(diseaseMap.entries())
      .map(([disease, score]) => ({ disease, score }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.disease);

    // Return top results (more results for better suggestions)
    return diseases.slice(0, 15);
  } catch (error) {
    console.error('❌ [TreatmentService] Error searching disease names:', error);
    return [];
  }
};

/**
 * Get treatment recommendations based on disease and crop
 * @param {string} diseaseName - Name of the disease
 * @param {string} cropName - Name of the crop (optional)
 * @returns {Object} - Treatment recommendations
 */
export const getTreatmentRecommendations = async (diseaseName, cropName = null) => {
  try {
    const isHealthy = !diseaseName;
    console.log(`🔍 [TreatmentService] Searching treatments for ${isHealthy ? 'HEALTHY plant' : 'disease'}: ${diseaseName || 'none'}, crop: ${cropName || 'none'}`);

    let products = [];
    let biologicalMethods = [];
    let culturalPractices = [];

    if (isHealthy) {
      // Healthy plant: Only get general cultural practices
      culturalPractices = await getCulturalPractices(cropName);
    } else {
      // Has disease: Get all treatment types
      [products, biologicalMethods, culturalPractices] = await Promise.all([
        getChemicalTreatments(diseaseName, cropName),
        getBiologicalTreatments(diseaseName),
        getCulturalPractices(cropName),
      ]);
    }

    const treatments = [];

    // Add chemical treatments (only if has disease)
    // ✅ Return FULL product data (not formatted) for frontend to display details
    if (products && products.length > 0) {
      treatments.push({
        type: 'chemical',
        title: 'Thuốc Hóa học',
        items: products.map(p => ({
          name: p.name,
          activeIngredient: p.activeIngredient,
          manufacturer: p.manufacturer,
          targetDiseases: p.targetDiseases || [],
          targetCrops: p.targetCrops || [],
          dosage: p.dosage,
          usage: p.usage,
          imageUrl: p.imageUrl,
          frequency: p.frequency,
          isolationPeriod: p.isolationPeriod,
          precautions: p.precautions || [],
          price: p.price,
          source: p.source,
        })),
      });
    }

    // Add biological methods (only if has disease)
    if (biologicalMethods && biologicalMethods.length > 0) {
      treatments.push({
        type: 'biological',
        title: 'Phương pháp Sinh học',
        items: biologicalMethods.map(formatBiologicalItem),
      });
    }

    // Add cultural practices (always available)
    if (culturalPractices && culturalPractices.length > 0) {
      treatments.push({
        type: 'cultural',
        title: isHealthy ? 'Biện pháp Chăm sóc' : 'Biện pháp Canh tác',
        items: culturalPractices.map(formatCulturalItem),
      });
    }

    console.log(`✅ [TreatmentService] Found ${treatments.length} treatment types (${isHealthy ? 'healthy plant' : 'disease treatment'})`);
    return treatments;
  } catch (error) {
    console.error('❌ [TreatmentService] Error getting treatments:', error);
    return [];
  }
};

/**
 * Get chemical products for disease
 * Enhanced with keyword-based search for better matching
 */
const getChemicalTreatments = async (diseaseName, cropName) => {
  try {
    const query = {
      verified: true,
    };

    // Search in targetDiseases array with keyword extraction (supports no diacritics)
    if (diseaseName) {
      // Extract keywords (supports both with and without diacritics)
      const keywords = extractDiseaseKeywords(diseaseName);
      
      console.log(`🔍 [TreatmentService] Disease keywords extracted:`, keywords);
      
      // Search for ANY keyword match (OR condition) - both with and without diacritics
      if (keywords.length > 0) {
        const searchConditions = [];
        
        // For each keyword, search both original and normalized (no diacritics)
        keywords.forEach(keyword => {
          // Search with diacritics
          searchConditions.push({
            targetDiseases: {
              $elemMatch: {
                $regex: keyword,
                $options: 'i'
              }
            }
          });
          
          // Also search normalized version (no diacritics) for better matching
          const normalizedKeyword = normalizeVietnamese(keyword);
          if (normalizedKeyword !== keyword.toLowerCase()) {
            searchConditions.push({
              targetDiseases: {
                $elemMatch: {
                  $regex: normalizedKeyword,
                  $options: 'i'
                }
              }
            });
          }
        });
        
        // Also search the full normalized disease name
        const normalizedDisease = normalizeVietnamese(diseaseName);
        if (normalizedDisease && normalizedDisease.length > 3) {
          searchConditions.push({
            targetDiseases: {
              $elemMatch: {
                $regex: normalizedDisease,
                $options: 'i'
              }
            }
          });
        }
        
        query.$or = searchConditions;
      } else {
        // Fallback to original search if no keywords extracted
        query.targetDiseases = { 
          $elemMatch: { $regex: diseaseName, $options: 'i' } 
        };
      }
    }

    // If crop is specified, also filter by targetCrops array
    if (cropName) {
      const cropKeywords = cropName
        .toLowerCase()
        .replace(/cây|plant/gi, '')
        .trim()
        .split(/[\s,]+/)
        .filter(k => k.length > 2);
      
      if (cropKeywords.length > 0) {
        // Create OR conditions for crop keywords
        const cropConditions = cropKeywords.map(keyword => ({
          targetCrops: {
            $elemMatch: {
              $regex: keyword,
              $options: 'i'
            }
          }
        }));
        
        // Add to existing $or or create new one
        if (query.$or) {
          query.$and = [
            { $or: query.$or },
            { $or: cropConditions }
          ];
          delete query.$or;
        } else {
          query.$or = cropConditions;
        }
      } else {
        query.targetCrops = { 
          $elemMatch: { $regex: cropName, $options: 'i' } 
        };
      }
    }

    const products = await Product.find(query).limit(5).lean();
    console.log(`📦 [TreatmentService] Found ${products.length} products for disease: "${diseaseName}", crop: "${cropName}"`);
    return products;
  } catch (error) {
    console.error('❌ [TreatmentService] Error getting chemical treatments:', error);
    return [];
  }
};

/**
 * Get biological methods for disease
 * Enhanced with keyword-based search for better matching
 */
const getBiologicalTreatments = async (diseaseName) => {
  try {
    const query = { verified: true };

    // Search in targetDiseases array with keyword extraction (supports no diacritics)
    if (diseaseName) {
      // Extract keywords (supports both with and without diacritics)
      const keywords = extractDiseaseKeywords(diseaseName);
      
      console.log(`🔍 [TreatmentService] Biological method keywords:`, keywords);
      
      // Search for ANY keyword match (OR condition) - both with and without diacritics
      if (keywords.length > 0) {
        const searchConditions = [];
        
        keywords.forEach(keyword => {
          searchConditions.push({
            targetDiseases: {
              $elemMatch: {
                $regex: keyword,
                $options: 'i'
              }
            }
          });
          
          const normalizedKeyword = normalizeVietnamese(keyword);
          if (normalizedKeyword !== keyword.toLowerCase()) {
            searchConditions.push({
              targetDiseases: {
                $elemMatch: {
                  $regex: normalizedKeyword,
                  $options: 'i'
                }
              }
            });
          }
        });
        
        const normalizedDisease = normalizeVietnamese(diseaseName);
        if (normalizedDisease && normalizedDisease.length > 3) {
          searchConditions.push({
            targetDiseases: {
              $elemMatch: {
                $regex: normalizedDisease,
                $options: 'i'
              }
            }
          });
        }
        
        query.$or = searchConditions;
      } else {
        // Fallback to original search
        query.targetDiseases = { 
          $elemMatch: { $regex: diseaseName, $options: 'i' } 
        };
      }
    }

    const methods = await BiologicalMethod.find(query).limit(5).lean();

    console.log(`🌿 [TreatmentService] Found ${methods.length} biological methods for disease: "${diseaseName}"`);
    return methods;
  } catch (error) {
    console.error('❌ [TreatmentService] Error getting biological methods:', error);
    return [];
  }
};

/**
 * Get cultural practices (not disease-specific, general practices)
 * Enhanced with keyword-based search for better crop matching
 */
const getCulturalPractices = async (cropName) => {
  try {
    const query = { verified: true };

    // If crop specified, filter by applicable crops array with keyword extraction
    if (cropName) {
      const cropKeywords = cropName
        .toLowerCase()
        .replace(/cây|plant/gi, '')
        .trim()
        .split(/[\s,]+/)
        .filter(k => k.length > 2);
      
      console.log(`🔍 [TreatmentService] Crop keywords:`, cropKeywords);
      
      if (cropKeywords.length > 0) {
        query.$or = cropKeywords.map(keyword => ({
          applicableTo: {
            $elemMatch: {
              $regex: keyword,
              $options: 'i'
            }
          }
        }));
      } else {
        // Fallback to original search
        query.applicableTo = { 
          $elemMatch: { $regex: cropName, $options: 'i' } 
        };
      }
    }

    // Get practices sorted by priority (High first)
    // Priority order: High > Medium > Low
    const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
    
    const practices = await CulturalPractice.find(query)
      .limit(10)
      .lean();

    // Sort by priority in memory
    practices.sort((a, b) => {
      return (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
    });

    console.log(`🌾 [TreatmentService] Found ${practices.length} cultural practices for crop: "${cropName}"`);
    return practices;
  } catch (error) {
    console.error('❌ [TreatmentService] Error getting cultural practices:', error);
    return [];
  }
};

/**
 * Format product for frontend
 */
const formatProductItem = (product) => {
  return {
    name: product.name,
    description: `${product.activeIngredient} - ${product.manufacturer}`,
    dosage: product.dosage,
    source: product.source,
  };
};

/**
 * Format biological method for frontend
 */
const formatBiologicalItem = (method) => {
  return {
    name: method.name,
    description: method.steps,
    materials: method.materials,
    effectiveness: method.effectiveness,
    timeframe: method.timeframe,
    source: method.source,
  };
};

/**
 * Format cultural practice for frontend
 */
const formatCulturalItem = (practice) => {
  return {
    name: practice.action,
    description: practice.description,
    priority: practice.priority,
    source: practice.source,
  };
};

/**
 * Get additional info (product details for modal)
 * @param {string} diseaseName - Name of the disease
 * @param {string} cropName - Name of the crop
 * @returns {Array} - Additional info items
 */
export const getAdditionalInfo = async (diseaseName, cropName) => {
  try {
    console.log(`🔍 [TreatmentService] Getting additional info for disease: ${diseaseName}`);

    const products = await getChemicalTreatments(diseaseName, cropName);

    const additionalInfo = products.map((product) => ({
      type: 'product',
      title: product.name,
      summary: `${product.activeIngredient} - Dùng cho ${product.targetDiseases.join(', ')}`,
      imageUrl: product.imageUrl || '/images/products/placeholder.png',
      details: {
        usage: product.usage,
        dosage: product.dosage,
        frequency: product.frequency || 'Theo chỉ dẫn trên nhãn',
        precautions: product.precautions || [],
        isolation: product.isolationPeriod || 'Xem hướng dẫn trên bao bì',
        source: product.source,
      },
    }));

    console.log(`✅ [TreatmentService] Generated ${additionalInfo.length} additional info items`);
    return additionalInfo;
  } catch (error) {
    console.error('❌ [TreatmentService] Error getting additional info:', error);
    return [];
  }
};

/**
 * Create mock data for testing (will be replaced with real data from sheets)
 */
export const createMockData = async () => {
  try {
    console.log('🔧 [TreatmentService] Creating mock data...');

    // Mock Product
    const mockProduct = {
      name: 'Score 250EC',
      activeIngredient: 'Difenoconazole 250g/L',
      manufacturer: 'Syngenta Vietnam',
      targetDiseases: ['Phấn trắng', 'Đốm lá'],
      targetCrops: ['Cà chua', 'Ớt'],
      dosage: '0.5-0.8 ml/lít nước',
      usage: 'Pha thuốc với nước, phun đều lên lá và thân cây',
      price: '150,000-200,000 VNĐ',
      imageUrl: '/images/products/score-250ec.jpg',
      source: 'Syngenta Vietnam (2024)',
      verified: true,
      frequency: 'Phun lại sau 7-10 ngày',
      isolationPeriod: '14 ngày trước thu hoạch',
      precautions: ['Đeo găng tay khi phun', 'Tránh phun khi có gió mạnh'],
    };

    // Mock Biological Method
    const mockBiological = {
      name: 'Sử dụng Trichoderma',
      targetDiseases: ['Nấm đất', 'Thối rễ'],
      materials: 'Trichoderma sp., nước sạch',
      steps: 'Pha 10g Trichoderma với 10 lít nước, tưới đều vào gốc cây. Lặp lại sau 7 ngày.',
      timeframe: '2-3 tuần',
      effectiveness: '60-70%',
      source: 'FAO IPM Guidelines (2023)',
      verified: true,
    };

    // Mock Cultural Practice
    const mockCultural = {
      category: 'soil',
      action: 'Cải thiện thoát nước',
      description: 'Tạo luống cao 20-30cm, đào rãnh thoát nước giữa luống để tránh úng nước',
      priority: 'High',
      applicableTo: ['Cà chua', 'Ớt', 'Dưa'],
      source: 'Viện BVTV (2023)',
      verified: true,
    };

    // Check if mock data already exists
    const existingProduct = await Product.findOne({ name: mockProduct.name });
    const existingBio = await BiologicalMethod.findOne({ name: mockBiological.name });
    const existingCultural = await CulturalPractice.findOne({ action: mockCultural.action });

    if (!existingProduct) {
      await Product.create(mockProduct);
      console.log('✅ Created mock product');
    }

    if (!existingBio) {
      await BiologicalMethod.create(mockBiological);
      console.log('✅ Created mock biological method');
    }

    if (!existingCultural) {
      await CulturalPractice.create(mockCultural);
      console.log('✅ Created mock cultural practice');
    }

    console.log('✅ [TreatmentService] Mock data ready!');
    return true;
  } catch (error) {
    console.error('❌ [TreatmentService] Error creating mock data:', error);
    return false;
  }
};

