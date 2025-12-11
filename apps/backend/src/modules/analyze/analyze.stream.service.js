import { identifyPlant, formatPlantIdResult } from '../../common/libs/plantid.js';
import { getTreatmentRecommendations, getAdditionalInfo } from '../treatments/treatment.service.js';
import { generateTreatmentAdvice } from '../treatments/treatmentAdvisor.service.js';
import { getPlantCareInfo } from '../plants/plant.service.js';
import { httpError } from '../../common/utils/http.js';

/**
 * Streaming Analysis Service
 * Analyzes plant image with progress callbacks for real-time updates
 */

/**
 * Analyze plant image with streaming callbacks
 * @param {object} params - Parameters
 * @param {string} params.imageUrl - Image URL to analyze
 * @param {string} params.userId - User ID (optional)
 * @param {function} params.onProgress - Progress callback (event, data)
 * @returns {Promise<object>} Complete analysis results
 */
export const analyzeImageStreaming = async ({ imageUrl, userId = null, onProgress }) => {
  try {
    console.log('🔬 [analyzeImageStreaming] Starting streaming analysis:', { imageUrl: imageUrl?.substring(0, 50), userId });

    // Step 1: Validation
    onProgress('validation', { type: 'input', message: 'Đang kiểm tra hình ảnh...' });
    
    if (!imageUrl) {
      throw httpError(400, 'imageUrl is required');
    }

    onProgress('validation', { type: 'validated', message: 'Hình ảnh hợp lệ' });

    // Step 2: Upload (already done, but notify)
    onProgress('upload', { type: 'complete', message: 'Đã upload hình ảnh' });

    // Step 3: Call Plant.id API
    onProgress('plant_id', { type: 'calling', message: 'Đang gọi Plant.id API...' });
    
    const plantIdResponse = await identifyPlant({ imageData: imageUrl });
    
    if (!plantIdResponse || !plantIdResponse.success) {
      throw httpError(400, 'Plant identification failed');
    }

    onProgress('plant_id', { type: 'processing', message: 'Đang xử lý kết quả từ Plant.id...' });

    // Step 4: Format Plant.id result (translate + structure)
    const plantIdResult = await formatPlantIdResult(plantIdResponse);

    console.log('🌿 [analyzeImageStreaming] Plant.id result:', {
      plant: plantIdResult.plant?.commonName,
      disease: plantIdResult.disease?.name,
      isHealthy: plantIdResult.isHealthy,
      allDiseasesCount: plantIdResult.allDiseases?.length || 0
    });

    // Step 5: Send plant identified event
    if (plantIdResult.plant) {
      onProgress('plant_identified', {
        plant: {
          commonName: plantIdResult.plant.commonName || null,
          scientificName: plantIdResult.plant.scientificName || null,
          confidence: plantIdResult.plant.probability || 0,
          reliable: plantIdResult.plant.reliable || false,
        },
        message: `Đã nhận diện: ${plantIdResult.plant.commonName || 'Cây trồng'}`,
      });
      // Delay để user thấy plant info trước khi load diseases
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Step 6: Check for diseases
    onProgress('disease_check', { type: 'checking', message: 'Đang kiểm tra bệnh...' });

    const allDiseases = plantIdResult.allDiseases || [];
    const isHealthy = plantIdResult.isHealthy || allDiseases.length === 0;

    if (allDiseases.length > 0) {
      console.log(`🦠 [analyzeImageStreaming] Found ${allDiseases.length} possible diseases`);
      
      // Send each disease as it's found with small delay between each
      for (let i = 0; i < allDiseases.length; i++) {
        const disease = allDiseases[i];
        onProgress('disease_found', {
          disease: {
            name: disease.name,
            originalName: disease.originalName,
            confidence: disease.probability || disease.confidence,
            description: disease.description || null,
          },
          index: i,
          total: allDiseases.length,
          message: `Phát hiện bệnh: ${disease.name} (${Math.round((disease.probability || disease.confidence) * 100)}%)`,
        });
        // Small delay between diseases for better UX
        if (i < allDiseases.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      // Delay sau khi xong tất cả diseases để user thấy rõ danh sách bệnh
      await new Promise(resolve => setTimeout(resolve, 800));
    } else {
      onProgress('disease_check', { type: 'healthy', message: 'Không phát hiện bệnh. Cây đang khỏe mạnh!' });
    }

    // Step 7: Get treatments for each disease
    const treatmentsByDisease = {};
    const additionalInfoByDisease = {};
    const aiAdviceByDisease = {};

    if (allDiseases.length > 0) {
      onProgress('treatments', { type: 'starting', message: 'Đang tìm phương pháp điều trị...' });

      for (let i = 0; i < allDiseases.length; i++) {
        const disease = allDiseases[i];
        const diseaseName = disease.name;
        const plantName = plantIdResult.plant?.commonName;

        onProgress('treatments', {
          type: 'searching',
          disease: diseaseName,
          message: `Đang tìm phương pháp điều trị cho: ${diseaseName}...`,
        });

        // Import treatment service functions directly to call them separately
        const { 
          getChemicalTreatments, 
          getBiologicalTreatments, 
          getCulturalPractices 
        } = await import('../treatments/treatment.service.js');
        const { getAdditionalInfo } = await import('../treatments/treatment.service.js');

        // Get treatments progressively - send each type as soon as it's ready
        const treatmentPromises = [];
        const treatmentsArray = [];

        // Start fetching all treatment types in parallel
        const chemicalPromise = getChemicalTreatments(diseaseName, plantName).then(products => {
          if (products && products.length > 0) {
            const chemicalTreatments = {
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
            };
            treatmentsArray.push(chemicalTreatments);
            
            // Send immediately when ready
            onProgress('treatments_chemical', {
              disease: diseaseName,
              treatments: chemicalTreatments.items,
              count: chemicalTreatments.items.length,
              message: `Đã tìm thấy ${chemicalTreatments.items.length} thuốc hóa học`,
            });
            return chemicalTreatments;
          }
          return null;
        });

        const biologicalPromise = getBiologicalTreatments(diseaseName).then(methods => {
          if (methods && methods.length > 0) {
            const biologicalMethods = {
              type: 'biological',
              title: 'Phương pháp Sinh học',
              items: methods.map(m => ({
                name: m.name,
                description: m.steps, // Use steps as description
                materials: m.materials,
                timeframe: m.timeframe,
                effectiveness: m.effectiveness,
                steps: m.steps,
                source: m.source,
              })),
            };
            treatmentsArray.push(biologicalMethods);
            
            // Send immediately when ready
            onProgress('treatments_biological', {
              disease: diseaseName,
              treatments: biologicalMethods.items,
              count: biologicalMethods.items.length,
              message: `Đã tìm thấy ${biologicalMethods.items.length} phương pháp sinh học`,
            });
            return biologicalMethods;
          }
          return null;
        });

        const culturalPromise = getCulturalPractices(plantName).then(practices => {
          if (practices && practices.length > 0) {
            const culturalPractices = {
              type: 'cultural',
              title: 'Biện Pháp Canh tác',
              items: practices.map(p => ({
                name: p.action || p.name, // Use action field if available
                description: p.description,
                priority: p.priority,
                source: p.source,
              })),
            };
            treatmentsArray.push(culturalPractices);
            
            // Send immediately when ready
            onProgress('treatments_cultural', {
              disease: diseaseName,
              treatments: culturalPractices.items,
              count: culturalPractices.items.length,
              message: `Đã tìm thấy ${culturalPractices.items.length} biện pháp canh tác`,
            });
            return culturalPractices;
          }
          return null;
        });

        // Wait for all treatments to complete (they send events as they finish)
        await Promise.all([chemicalPromise, biologicalPromise, culturalPromise]);

        // Store all treatments for this disease
        treatmentsByDisease[disease.name] = treatmentsArray;
        
        // Get additional info
        const additionalInfo = await getAdditionalInfo(diseaseName, plantName);
        additionalInfoByDisease[disease.name] = additionalInfo;
        
        // Small delay after all treatments for this disease are sent
        await new Promise(resolve => setTimeout(resolve, 300));

        // Generate AI advice (optional, can be slow)
        try {
          onProgress('ai_advice', {
            type: 'generating',
            disease: diseaseName,
            message: `Đang tạo lời khuyên AI cho: ${diseaseName}...`,
          });

          const aiAdvice = await generateTreatmentAdvice({
            diseaseName,
            diseaseConfidence: disease.probability || disease.confidence,
            plantName,
            treatments: {
              chemical: chemicalTreatments?.items || [],
              biological: biologicalMethods?.items || [],
              cultural: culturalPractices?.items || [],
            },
          });

          aiAdviceByDisease[disease.name] = aiAdvice;

          onProgress('ai_advice', {
            type: 'complete',
            disease: diseaseName,
            message: `Đã tạo lời khuyên AI cho: ${diseaseName}`,
          });
        } catch (error) {
          console.warn(`⚠️  [analyzeImageStreaming] Failed to generate AI advice for "${diseaseName}":`, error.message);
          aiAdviceByDisease[disease.name] = null;
        }
      }
    }

    // Step 8: Get plant care info (if healthy)
    let careInfo = null;
    if (isHealthy || (plantIdResult.plant && allDiseases.length === 0)) {
      try {
        onProgress('care', { type: 'fetching', message: 'Đang lấy thông tin chăm sóc cây...' });

        const plantName = plantIdResult.plant?.scientificName || plantIdResult.plant?.commonName;
        careInfo = await getPlantCareInfo({ plantName });

        onProgress('care', { type: 'complete', care: careInfo, message: 'Đã lấy thông tin chăm sóc' });
      } catch (error) {
        console.warn('Failed to get plant care info:', error.message);
      }
    }

    // Step 9: Build final result
    const result = {
      plant: {
        commonName: plantIdResult.plant?.commonName || null,
        scientificName: plantIdResult.plant?.scientificName || null,
        confidence: plantIdResult.plant?.probability || 0,
        reliable: plantIdResult.plant?.reliable || false,
      },
      isHealthy,
      diseases: allDiseases.map((d) => ({
        name: d.name,
        originalName: d.originalName,
        confidence: d.probability || d.confidence,
        description: d.description || null,
      })),
      treatments: treatmentsByDisease,
      additionalInfo: additionalInfoByDisease,
      aiAdvice: aiAdviceByDisease,
      care: careInfo || null,
      analyzedAt: new Date(),
      imageUrl,
    };

    // Step 10: Save to database
    try {
      onProgress('saving', { type: 'saving', message: 'Đang lưu kết quả phân tích...' });

      const { default: Analysis } = await import('../analyses/analysis.model.js');

      const inputImages = [{ url: imageUrl }];
      const resultTop = result.plant?.commonName
        ? {
            plant: {
              commonName: result.plant.commonName || '',
              scientificName: result.plant.scientificName || '',
            },
            confidence: result.plant.confidence || 0,
            summary: result.isHealthy
              ? 'Cây khỏe mạnh'
              : `Phát hiện ${result.diseases?.length || 0} bệnh`,
          }
        : null;

      const raw = {
        plant: result.plant,
        diseases: result.diseases || [],
        isHealthy: result.isHealthy,
        treatments: result.treatments,
        care: result.care,
        analyzedAt: result.analyzedAt || new Date(),
      };

      const analysisRecord = new Analysis({
        user: userId || null,
        source: 'plantid',
        inputImages,
        resultTop,
        raw,
      });

      await analysisRecord.save();

      result.analysisId = analysisRecord._id.toString();

      onProgress('saving', { type: 'complete', message: 'Đã lưu kết quả phân tích' });
    } catch (error) {
      console.error('❌ [analyzeImageStreaming] Failed to save analysis:', error);
      // Don't fail the request if save fails
    }

    onProgress('complete', {
      type: 'complete',
      message: 'Phân tích hoàn tất!',
      result,
    });

    console.log('✅ [analyzeImageStreaming] Analysis complete:', {
      plant: result.plant.commonName,
      diseaseCount: result.diseases.length,
      hasTreatments: Object.keys(result.treatments).length > 0,
    });

    return result;
  } catch (error) {
    console.error('❌ [analyzeImageStreaming] Error:', error);
    throw httpError(error.statusCode || 500, error.message || 'Image analysis failed');
  }
};

