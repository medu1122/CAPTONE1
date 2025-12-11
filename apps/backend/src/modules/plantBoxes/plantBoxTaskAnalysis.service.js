import { generateAIResponse } from '../aiAssistant/ai.service.js';
import { httpError } from '../../common/utils/http.js';
import { getTreatmentRecommendations } from '../treatments/treatment.service.js';
import { getRecommendations } from '../productRecommendations/productRecommendation.service.js';
import { analyzeWeather } from './weatherAnalysis.service.js';

/**
 * Analyze a specific task and provide detailed guidance
 * @param {object} params - Parameters
 * @param {object} params.plantBox - Plant box data
 * @param {object} params.action - Action to analyze
 * @param {object} params.weather - Weather data for the day
 * @param {number} params.dayIndex - Day index (0-6)
 * @returns {Promise<object>} Detailed task analysis
 */
export const analyzeTask = async ({ plantBox, action, weather, dayIndex }) => {
  try {
    // Analyze weather for the day
    const analyzedWeather = analyzeWeather({
      temp: weather.temp || weather.temperature,
      humidity: weather.humidity,
      rain: weather.rain,
    });

    // Get treatment info if action is for disease treatment
    let treatmentInfo = '';
    let productInfo = '';
    let productDetails = []; // Store product details with targetDiseases and targetCrops
    
    if (action.type === 'protect' && plantBox.currentDiseases && plantBox.currentDiseases.length > 0) {
      try {
        // Check if user has selected treatments
        const treatments = await Promise.all(
          plantBox.currentDiseases.map(async (disease) => {
            // Priority: Use selected treatments if available
            if (disease.selectedTreatments && disease.selectedTreatments.chemical?.length > 0) {
              // Get biological and cultural from database
              const dbTreatments = await getTreatmentRecommendations(disease.name, plantBox.plantName);
              const formatted = [{
                type: 'chemical',
                title: 'Thuốc Hóa học',
                items: disease.selectedTreatments.chemical.map(p => ({
                  name: p.name,
                  activeIngredient: p.activeIngredient,
                  manufacturer: p.manufacturer,
                  dosage: p.dosage,
                  usage: p.usage,
                  frequency: p.frequency,
                  isolationPeriod: p.isolationPeriod,
                  precautions: p.precautions || [],
                  targetDiseases: [disease.name], // Use disease name
                  targetCrops: [plantBox.plantName], // Use plant name
                })),
              }];
              
              // Add biological and cultural from database
              dbTreatments.forEach(t => {
                if (t.type === 'biological' || t.type === 'cultural') {
                  formatted.push(t);
                }
              });
              
              return formatted;
            } else {
              return await getTreatmentRecommendations(disease.name, plantBox.plantName);
            }
          })
        );

        // Format treatment info and collect product details
        treatmentInfo = treatments
          .filter(t => t && t.length > 0)
          .map((t, idx) => {
            const disease = plantBox.currentDiseases[idx];
            let info = `\n📋 THÔNG TIN ĐIỀU TRỊ CHO BỆNH: "${disease.name}"\n`;
            
            t.forEach(treatment => {
              if (treatment.type === 'chemical' && treatment.items && treatment.items.length > 0) {
                info += `\n💊 THUỐC HÓA HỌC:\n`;
                treatment.items.slice(0, 2).forEach((product) => {
                  info += `- ${product.name}\n`;
                  info += `  → Hoạt chất: ${product.activeIngredient}\n`;
                  info += `  → Liều lượng: ${product.dosage}\n`;
                  info += `  → Cách dùng: ${product.usage}\n`;
                  if (product.frequency) info += `  → Tần suất: ${product.frequency}\n`;
                  if (product.precautions && product.precautions.length > 0) {
                    info += `  → Lưu ý: ${product.precautions.join(', ')}\n`;
                  }
                  
                  // Store product details for response
                  productDetails.push({
                    name: product.name,
                    targetDiseases: product.targetDiseases || [disease.name],
                    targetCrops: product.targetCrops || [plantBox.plantName],
                  });
                });
              }

              if (treatment.type === 'biological' && treatment.items && treatment.items.length > 0) {
                info += `\n🌿 PHƯƠNG PHÁP SINH HỌC:\n`;
                treatment.items.slice(0, 2).forEach((method) => {
                  info += `- ${method.name}\n`;
                  info += `  → Vật liệu: ${method.materials}\n`;
                  info += `  → Các bước: ${method.steps}\n`;
                  info += `  → Thời gian: ${method.timeframe}\n`;
                });
              }

              if (treatment.type === 'cultural' && treatment.items && treatment.items.length > 0) {
                info += `\n🌾 BIỆN PHÁP CANH TÁC:\n`;
                treatment.items.slice(0, 3).forEach((practice) => {
                  info += `- ${practice.action}\n`;
                  info += `  → Mô tả: ${practice.description}\n`;
                });
              }
            });

            return info;
          })
          .join('\n');

        // Get product recommendations
        try {
          const productResult = await getRecommendations({
            plant: plantBox.plantName,
            disease: plantBox.currentDiseases.map(d => d.name).join(', '),
            limit: 3,
          });

          if (productResult.recommendations && productResult.recommendations.length > 0) {
            productInfo = `\n🛒 SẢN PHẨM ĐỀ XUẤT:\n`;
            productResult.recommendations.forEach((product) => {
              productInfo += `- ${product.name}\n`;
              if (product.description) productInfo += `  → ${product.description}\n`;
              if (product.price) productInfo += `  → Giá: ${product.price}\n`;
              if (product.links && product.links.length > 0) {
                productInfo += `  → Link: ${product.links.map(l => l.url).join(', ')}\n`;
              }
            });
          }
        } catch (error) {
          console.error('❌ [TaskAnalysis] Error fetching products:', error);
        }
      } catch (error) {
        console.error('❌ [TaskAnalysis] Error fetching treatments:', error);
      }
    }

    // Build prompt for GPT
    const analysisPrompt = `
Bạn là chuyên gia nông nghiệp. Hãy phân tích CHI TIẾT công việc chăm sóc cây trồng sau:

🌱 THÔNG TIN CÂY VÀ QUY MÔ TRỒNG:
- Tên: ${plantBox.plantName}${plantBox.scientificName ? ` (${plantBox.scientificName})` : ''}
- Giai đoạn: ${plantBox.growthStage || 'Không xác định'}
- Sức khỏe: ${plantBox.currentHealth || 'Không xác định'}
- Số lượng cây: ${plantBox.quantity || 1} ${plantBox.quantity > 1 ? 'cây' : 'cây'}
${plantBox.location.area ? `- Diện tích: ${plantBox.location.area}m²` : ''}
- Vị trí: ${plantBox.location.name}
${plantBox.location.coordinates ? `- Tọa độ: ${plantBox.location.coordinates.lat}, ${plantBox.location.coordinates.lon}` : ''}
${plantBox.location.soilType ? `- Loại đất: ${Array.isArray(plantBox.location.soilType) ? plantBox.location.soilType.join(', ') : plantBox.location.soilType}` : ''}
${plantBox.location.sunlight ? `- Ánh sáng: ${plantBox.location.sunlight === 'full' ? 'Đầy đủ' : plantBox.location.sunlight === 'partial' ? 'Một phần' : 'Bóng râm'}` : ''}

📋 CÔNG VIỆC CẦN PHÂN TÍCH:
- Loại: ${action.type === 'water' ? 'Tưới nước' : action.type === 'fertilize' ? 'Bón phân' : action.type === 'protect' ? 'Điều trị bệnh' : action.type === 'check' ? 'Kiểm tra' : 'Cắt tỉa'}
- Thời gian: ${action.time}
- Mô tả: ${action.description}
- Lý do: ${action.reason}
${action.products && action.products.length > 0 ? `- Sản phẩm: ${action.products.join(', ')}` : ''}

🌤️ THỜI TIẾT NGÀY HÔM ĐÓ:
- Nhiệt độ: ${analyzedWeather.temp.min}°C - ${analyzedWeather.temp.max}°C (${analyzedWeather.temp.label})
- Độ ẩm: ${analyzedWeather.humidity.value}% (${analyzedWeather.humidity.label})
- Mưa: ${analyzedWeather.rain.value}mm (${analyzedWeather.rain.label})
${analyzedWeather.alerts.length > 0 ? `- Cảnh báo: ${analyzedWeather.alerts.join(', ')}` : ''}

${treatmentInfo ? `\n${treatmentInfo}\n` : ''}
${productInfo ? `\n${productInfo}\n` : ''}

YÊU CẦU:
1. Phân tích CHI TIẾT từng bước thực hiện công việc này
2. Liệt kê VẬT LIỆU cần thiết (cụ thể, có thể mua ở đâu)
3. Đưa ra LƯU Ý quan trọng (an toàn, hiệu quả)
4. Ước tính THỜI GIAN thực hiện
5. Đưa ra MẸO để làm tốt hơn
6. Nếu là điều trị bệnh, phải sử dụng thông tin từ database ở trên
7. ⚠️ QUAN TRỌNG - TÍNH TOÁN LIỀU LƯỢNG:
   - Nếu có sử dụng thuốc/phân bón, PHẢI tính toán liều lượng CỤ THỂ dựa trên:
     * Số lượng cây: ${plantBox.quantity || 1} cây
     ${plantBox.location.area ? `* Diện tích: ${plantBox.location.area}m²` : ''}
     * Loại đất: ${plantBox.location.soilType ? (Array.isArray(plantBox.location.soilType) ? plantBox.location.soilType.join(', ') : plantBox.location.soilType) : 'Không xác định'}
     * Khu vực trồng: ${plantBox.location.name}
   - Ví dụ: Nếu liều lượng trong DB là "20g/10L nước" cho 1 cây, thì với ${plantBox.quantity || 1} cây cần:
     * Tổng lượng thuốc: ${plantBox.quantity || 1} × 20g = ${(plantBox.quantity || 1) * 20}g
     * Tổng lượng nước: ${plantBox.quantity || 1} × 10L = ${(plantBox.quantity || 1) * 10}L
   - PHẢI điều chỉnh liều lượng theo loại đất:
     * Đất phù sa: Giữ nguyên hoặc giảm 10-15%
     * Đất thịt: Giữ nguyên
     * Đất cát: Tăng 10-15% (thoát nước nhanh)
     * Đất sét: Giảm 10-15% (giữ nước tốt)
   - PHẢI tính toán tổng lượng thuốc/phân cần mua cho toàn bộ quy mô

Trả lời bằng JSON format:
{
  "detailedSteps": [
    "Bước 1: Chuẩn bị...",
    "Bước 2: Thực hiện...",
    ...
  ],
  "materials": [
    "Vật liệu 1 (có thể mua ở...)",
    "Vật liệu 2",
    ...
  ],
  "precautions": [
    "Lưu ý 1",
    "Lưu ý 2",
    ...
  ],
  "tips": "Mẹo từ chuyên gia...",
  "estimatedDuration": "Khoảng 30 phút",
  "dosageCalculation": {
    "baseDosage": "Liều lượng cơ bản từ DB (ví dụ: 20g/10L nước)",
    "totalQuantity": "Tổng lượng thuốc/phân cần cho ${plantBox.quantity || 1} cây",
    "totalWater": "Tổng lượng nước cần pha",
    "soilAdjustment": "Điều chỉnh theo loại đất ${plantBox.location.soilType ? (Array.isArray(plantBox.location.soilType) ? plantBox.location.soilType.join(', ') : plantBox.location.soilType) : ''}",
    "finalDosage": "Liều lượng cuối cùng sau điều chỉnh",
    "purchaseAmount": "Lượng thuốc/phân cần mua (tính dư 10-20% để dự phòng)"
  }
}

CHỈ TRẢ VỀ JSON, KHÔNG CÓ MARKDOWN, KHÔNG CÓ TEXT THÊM:
`;

    // Call GPT
    const response = await generateAIResponse({
      messages: [
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
    });

    // Parse JSON response
    let analysisData;
    try {
      let jsonString = response.data.message || response.data || '';
      jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        let jsonToParse = jsonMatch[0];
        jsonToParse = jsonToParse.replace(/,(\s*[}\]])/g, '$1');
        jsonToParse = jsonToParse.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
        analysisData = JSON.parse(jsonToParse);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse analysis JSON:', parseError);
      // Fallback analysis
      analysisData = {
        detailedSteps: [
          'Chuẩn bị vật liệu cần thiết',
          'Thực hiện theo hướng dẫn',
          'Kiểm tra kết quả sau khi hoàn thành',
        ],
        materials: action.products || [],
        precautions: ['Thực hiện đúng theo hướng dẫn', 'Đảm bảo an toàn'],
        tips: 'Làm vào thời gian được chỉ định để đạt hiệu quả tốt nhất',
        estimatedDuration: '30-60 phút',
      };
    }

    return {
      analyzedAt: new Date(),
      detailedSteps: analysisData.detailedSteps || [],
      materials: analysisData.materials || [],
      precautions: analysisData.precautions || [],
      tips: analysisData.tips || '',
      estimatedDuration: analysisData.estimatedDuration || '30 phút',
      dosageCalculation: analysisData.dosageCalculation || undefined,
      productDetails: productDetails.length > 0 ? productDetails : undefined,
    };
  } catch (error) {
    console.error('Failed to analyze task:', error);
    throw httpError(500, `Failed to analyze task: ${error.message}`);
  }
};

export default {
  analyzeTask,
};

