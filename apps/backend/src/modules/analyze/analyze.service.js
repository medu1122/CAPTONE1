import { httpError } from '../../common/utils/http.js';
import { getPlantCareInfo } from '../plants/plant.service.js';

/**
 * Mock analysis service that returns AnalysisResult according to the required schema
 * @param {object} params - Analysis parameters
 * @param {string} params.text - Text query
 * @param {string} params.imageUrl - Image URL (data URL for testing)
 * @returns {object} AnalysisResult object
 */
export const analyzeService = async ({ text, imageUrl }) => {
  try {
    // Mock data based on input
    const hasImage = !!imageUrl;
    const hasText = !!text;
    
    // Determine plant based on input
    let plantName, scientificName, confidence;
    
    if (hasText && text.includes('đốm nâu')) {
      plantName = 'Cây Monstera';
      scientificName = 'Monstera deliciosa';
      confidence = 0.85;
    } else if (hasText && text.includes('lá vàng')) {
      plantName = 'Cây Fiddle Leaf Fig';
      scientificName = 'Ficus lyrata';
      confidence = 0.75;
    } else if (hasImage) {
      plantName = 'Cây Trầu Bà';
      scientificName = 'Epipremnum aureum';
      confidence = 0.90;
    } else {
      plantName = 'Cây Sen Đá';
      scientificName = 'Echeveria elegans';
      confidence = 0.60;
    }
    
    // Determine disease based on confidence
    let disease = null;
    if (confidence <= 0.5) {
      disease = null;
    } else if (hasText && text.includes('đốm')) {
      disease = {
        name: 'Bệnh đốm lá',
        description: 'Lá xuất hiện các đốm nâu, có thể do nấm hoặc vi khuẩn gây ra. Cần điều trị kịp thời để tránh lây lan.'
      };
    } else if (hasText && text.includes('vàng')) {
      disease = {
        name: 'Lá vàng do thiếu dinh dưỡng',
        description: 'Lá chuyển màu vàng thường do thiếu nitơ hoặc ánh sáng không đủ. Cần bổ sung phân bón và điều chỉnh vị trí đặt cây.'
      };
    }
    
    // Get plant care information from database
    let plantCareInfo = null;
    try {
      plantCareInfo = await getPlantCareInfo({ plantName });
    } catch (error) {
      console.warn('Failed to get plant care info:', error.message);
    }

    // Use database care instructions if available, otherwise use default
    const care = plantCareInfo?.careInstructions ? [
      `Tưới nước: ${plantCareInfo.careInstructions.watering}`,
      `Ánh sáng: ${plantCareInfo.careInstructions.sunlight}`,
      `Đất trồng: ${plantCareInfo.careInstructions.soil}`,
      `Nhiệt độ: ${plantCareInfo.careInstructions.temperature}`,
      ...(plantCareInfo.growthStages?.map(stage => 
        `${stage.stage}: ${stage.description} (${stage.duration})`
      ) || [])
    ] : [
      'Tưới nước khi đất khô 2-3cm trên bề mặt',
      'Đặt cây ở nơi có ánh sáng gián tiếp, tránh ánh nắng trực tiếp',
      'Bón phân hữu cơ 2-3 tuần một lần trong mùa sinh trưởng',
      'Kiểm tra độ ẩm đất thường xuyên, tránh úng nước',
      'Lau lá định kỳ để cây quang hợp tốt hơn'
    ];
    
    // Mock products
    const products = [
      {
        name: 'Phân bón hữu cơ cho cây trồng',
        imageUrl: 'https://via.placeholder.com/150x150/4CAF50/FFFFFF?text=Phân+bón',
        price: '125.000đ',
        note: 'Phù hợp cho hầu hết các loại cây trồng trong nhà'
      },
      {
        name: 'Chậu đất nung tự nhiên',
        imageUrl: 'https://via.placeholder.com/150x150/8D6E63/FFFFFF?text=Chậu+đất',
        price: '89.000đ',
        note: 'Thoát nước tốt, giúp rễ cây phát triển khỏe mạnh'
      },
      {
        name: 'Đất trồng cây đa năng',
        imageUrl: 'https://via.placeholder.com/150x150/795548/FFFFFF?text=Đất+trồng',
        price: '45.000đ',
        note: 'Giàu dinh dưỡng, thoát nước tốt'
      },
      {
        name: 'Bình tưới nước mini',
        imageUrl: 'https://via.placeholder.com/150x150/2196F3/FFFFFF?text=Bình+tưới',
        price: '75.000đ',
        note: 'Thiết kế nhỏ gọn, dễ sử dụng cho cây cảnh'
      }
    ];
    
    // Image insights with bounding boxes (mock coordinates in percentages)
    const imageInsights = {
      imageUrl: imageUrl || 'https://via.placeholder.com/400x300/4CAF50/FFFFFF?text=Plant+Image',
      boxes: [
        {
          top: 25.5,
          left: 30.2,
          width: 15.8,
          height: 12.3,
          label: hasText && text.includes('đốm') ? 'Vùng bệnh đốm lá' : 'Lá cây'
        },
        {
          top: 45.0,
          left: 50.5,
          width: 20.0,
          height: 18.5,
          label: 'Thân cây chính'
        },
        {
          top: 70.2,
          left: 25.8,
          width: 12.5,
          height: 8.0,
          label: 'Lá non'
        }
      ]
    };
    
    // Return AnalysisResult according to schema
    return {
      plant: {
        commonName: plantName,
        scientificName: scientificName
      },
      disease: disease,
      confidence: confidence,
      care: care,
      products: products,
      imageInsights: imageInsights,
      // Add enhanced plant information if available
      plantInfo: plantCareInfo ? {
        category: plantCareInfo.category,
        commonDiseases: plantCareInfo.commonDiseases,
        growthStages: plantCareInfo.growthStages
      } : null
    };
    
  } catch (error) {
    throw httpError(500, `Analysis failed: ${error.message}`);
  }
};