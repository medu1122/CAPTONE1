// import { identifyPlant } from '../../common/libs/plantid.js'; // Disabled to save credits
import { httpError } from '../../common/utils/http.js';

/**
 * Validate Image Controller
 * Quick validation to check if image contains a plant
 */

/**
 * POST /api/v1/analyze/validate-image
 * Quick validation to check if image is a valid plant image
 */
export const validateImageController = async (req, res, next) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return next(httpError(400, 'imageUrl is required'));
    }

    console.log('🔍 [validateImageController] Validation DISABLED - returning valid by default to save credits');

    // ⚠️ VALIDATION DISABLED - Skip Plant.id API call to save credits
    // Always return valid to allow user to proceed with analysis
    return res.json({
      success: true,
      data: {
        isValid: true,
        isPlant: true,
        confidence: 1,
        message: 'Hình ảnh đã sẵn sàng để phân tích',
      },
    });

    // OLD VALIDATION CODE - COMMENTED OUT TO SAVE CREDITS
    /*
    try {
      // Call Plant.id API for quick validation
      const plantIdResponse = await identifyPlant({ imageData: imageUrl });

      if (!plantIdResponse || !plantIdResponse.success) {
        return res.json({
          success: true,
          data: {
            isValid: false,
            isPlant: false,
            confidence: 0,
            message: 'Không thể nhận diện cây trong hình. Vui lòng thử hình khác.',
          },
        });
      }

      // Check if we got plant results
      const suggestions = plantIdResponse.data?.suggestions || [];
      const hasPlantResults = suggestions.length > 0;

      if (!hasPlantResults) {
        return res.json({
          success: true,
          data: {
            isValid: false,
            isPlant: false,
            confidence: 0,
            message: 'Hình ảnh không phải là cây trồng. Vui lòng upload ảnh cây.',
          },
        });
      }

      // Get top suggestion confidence
      const topSuggestion = suggestions[0];
      const topConfidence = topSuggestion?.probability || 0;

      // ✅ IMPORTANT: Check for diseases FIRST - if diseases detected, allow even with low plant confidence
      // This handles cases where plant is misidentified but disease is clear (e.g., mango with spots)
      const hasDiseases = plantIdResponse.data?.diseases && plantIdResponse.data.diseases.length > 0;
      const hasHighConfidenceDisease = hasDiseases && 
        plantIdResponse.data.diseases.some((d) => d.probability >= 0.3);

      // If diseases detected with decent confidence, allow the image
      if (hasHighConfidenceDisease) {
        console.log('✅ [validateImageController] Diseases detected, allowing image despite low plant confidence');
        const plantName = topSuggestion?.plant_details?.common_names?.[0] || 
                         topSuggestion?.plant_name || 
                         'Cây trồng';

        return res.json({
          success: true,
          data: {
            isValid: true,
            isPlant: true,
            confidence: topConfidence,
            plantName: plantName,
            message: 'Hình ảnh hợp lệ. Phát hiện dấu hiệu bệnh trên cây.',
            hasDisease: true,
          },
        });
      }

      // Check if confidence is too low (might be generic/not clear)
      // But only reject if NO diseases detected
      if (topConfidence < 0.3 && !hasDiseases) {
        return res.json({
          success: true,
          data: {
            isValid: false,
            isPlant: true,
            confidence: topConfidence,
            message: 'Hình ảnh quá chung hoặc không rõ ràng. Vui lòng upload ảnh cây rõ ràng hơn.',
          },
        });
      }

      // Check if multiple low-confidence results (too generic)
      // But only reject if NO diseases detected
      const lowConfidenceCount = suggestions.filter((s) => s.probability < 0.2).length;
      if (lowConfidenceCount > 3 && topConfidence < 0.5 && !hasDiseases) {
        return res.json({
          success: true,
          data: {
            isValid: false,
            isPlant: true,
            confidence: topConfidence,
            message: 'Hình ảnh quá chung hoặc không rõ ràng. Vui lòng upload ảnh cây rõ ràng hơn.',
          },
        });
      }

      // Valid plant image
      const plantName = topSuggestion?.plant_details?.common_names?.[0] || 
                       topSuggestion?.plant_name || 
                       'Cây trồng';

      return res.json({
        success: true,
        data: {
          isValid: true,
          isPlant: true,
          confidence: topConfidence,
          plantName: plantName,
          message: 'Hình ảnh hợp lệ. Bạn có thể bắt đầu phân tích.',
        },
      });
    } catch (error) {
      console.error('❌ [validateImageController] Plant.id API error:', error);
      
      // If API fails, we can't validate, but don't block user
      // They can still try to analyze
      return res.json({
        success: true,
        data: {
          isValid: true, // Allow to proceed
          isPlant: null, // Unknown
          confidence: 0,
          message: 'Không thể kiểm tra hình ảnh. Bạn vẫn có thể thử phân tích.',
          warning: true,
        },
      });
    }
    */

  } catch (error) {
    console.error('❌ [validateImageController] Error:', error);
    next(error);
  }
};

