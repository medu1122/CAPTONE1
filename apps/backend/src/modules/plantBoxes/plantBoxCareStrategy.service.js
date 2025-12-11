import { generateAIResponse } from '../aiAssistant/ai.service.js';
import { httpError } from '../../common/utils/http.js';
import { getTreatmentRecommendations } from '../treatments/treatment.service.js';
import { getFruitingSeasonInfo } from './plantFruitingSeason.service.js';
import { analyzeForecast } from './weatherAnalysis.service.js';
import { getRecommendations } from '../productRecommendations/productRecommendation.service.js';

/**
 * Generate care strategy for plant box based on weather and plant info
 * @param {object} params - Parameters
 * @param {object} params.plantBox - Plant box data
 * @param {object} params.weather - Weather data (7 days forecast)
 * @returns {Promise<object>} Care strategy for next 7 days
 */
export const generateCareStrategy = async ({ plantBox, weather }) => {
  try {
    // Analyze weather forecast (backend quyết định cao/thấp)
    const analyzedWeather = analyzeForecast(weather.forecast);
    
    // Get fruiting season information
    const fruitingInfo = getFruitingSeasonInfo({
      plantName: plantBox.plantName,
      plantedDate: plantBox.plantedDate,
      locationName: plantBox.location.name,
      locationCoords: plantBox.location.coordinates,
    });
    
    // Filter out diseases that are resolved (no treatment needed)
    const activeDiseases = (plantBox.currentDiseases || []).filter(disease => {
      const latestFeedback = disease.feedback && disease.feedback.length > 0
        ? disease.feedback[disease.feedback.length - 1]
        : null;
      // Don't treat if status is 'resolved' or latest feedback is 'resolved'
      return disease.status !== 'resolved' && 
             (!latestFeedback || latestFeedback.status !== 'resolved');
    });
    
    // Get treatment recommendations if plant has ACTIVE diseases
    let treatmentInfo = '';
    let productRecommendations = '';
    if (activeDiseases.length > 0) {
      try {
        // Check if diseases have user-selected treatments
        const treatments = await Promise.all(
          activeDiseases.map(async (disease) => {
            // Priority 1: Use user-selected chemical treatments if available
            // Biological and cultural are always auto-suggested from database
            if (disease.selectedTreatments && 
                disease.selectedTreatments.chemical?.length > 0) {
              console.log(`✅ [CareStrategy] Using user-selected chemical treatments for disease: ${disease.name}`);
              
              // Get biological and cultural from database (auto-suggested)
              const dbTreatments = await getTreatmentRecommendations(disease.name, plantBox.plantName);
              
              // Format selected chemical treatments
              const formattedTreatments = [{
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
                })),
              }];
              
              // Add biological and cultural from database (auto-suggested)
              dbTreatments.forEach(t => {
                if (t.type === 'biological' || t.type === 'cultural') {
                  formattedTreatments.push(t);
                }
              });
              
              return formattedTreatments;
            } else {
              // Priority 2: Fetch all from database if no user selection
              console.log(`📋 [CareStrategy] Fetching all treatments from database for disease: ${disease.name}`);
              return await getTreatmentRecommendations(disease.name, plantBox.plantName);
            }
          })
        );
        
        // Get product recommendations
        try {
          const productResult = await getRecommendations({
            plant: plantBox.plantName,
            disease: activeDiseases.map(d => d.name).join(', '),
            limit: 5,
          });
          
          if (productResult.recommendations && productResult.recommendations.length > 0) {
            productRecommendations = `\n🛒 SẢN PHẨM ĐỀ XUẤT:\n`;
            productResult.recommendations.slice(0, 3).forEach((product, idx) => {
              productRecommendations += `\n[Sản phẩm ${idx + 1}] ${product.name}\n`;
              if (product.description) productRecommendations += `  → Mô tả: ${product.description}\n`;
              if (product.price) productRecommendations += `  → Giá: ${product.price}\n`;
              if (product.links && product.links.length > 0) {
                productRecommendations += `  → Link mua: ${product.links.map(l => l.url).join(', ')}\n`;
              }
            });
            productRecommendations += `\n`;
          }
        } catch (error) {
          console.error('❌ [CareStrategy] Error fetching product recommendations:', error);
        }
        
        // Format treatment info for prompt - MORE SPECIFIC AND ACTIONABLE
        treatmentInfo = treatments
          .filter(t => t && t.length > 0)
          .map((t, idx) => {
            const disease = activeDiseases[idx];
            const hasUserSelectedChemical = disease.selectedTreatments && 
              disease.selectedTreatments.chemical?.length > 0;
            // Get latest feedback if available
            const latestFeedback = disease.feedback && disease.feedback.length > 0 
              ? disease.feedback[disease.feedback.length - 1] 
              : null;
            
            let info = `\n═══════════════════════════════════════════════════════════\n`;
            info += `📋 THÔNG TIN ĐIỀU TRỊ CHO BỆNH: "${disease.name}"\n`;
            if (hasUserSelectedChemical) {
              info += `✅ (NGƯỜI DÙNG ĐÃ CHỌN THUỐC - PHẢI SỬ DỤNG CHÍNH XÁC)\n`;
            }
            info += `═══════════════════════════════════════════════════════════\n`;
            if (latestFeedback) {
              const feedbackText = {
                'worse': 'Bệnh đang TỆ HƠN',
                'same': 'Bệnh KHÔNG THAY ĐỔI',
                'better': 'Bệnh đang ĐỠ HƠN',
                'resolved': 'Bệnh ĐÃ KHỎI'
              };
              info += `\n🚨 PHẢN HỒI TỪ NGƯỜI DÙNG (QUAN TRỌNG - PHẢI ĐIỀU CHỈNH CHIẾN LƯỢC):\n`;
              info += `📊 Tình trạng: ${feedbackText[latestFeedback.status] || latestFeedback.status}\n`;
              if (latestFeedback.notes) {
                info += `   Ghi chú chi tiết: ${latestFeedback.notes}\n`;
              }
              
              // Add specific instructions based on feedback
              if (latestFeedback.status === 'worse') {
                info += `\n⚠️⚠️⚠️ HÀNH ĐỘNG CẦN THIẾT (Bệnh TỆ HƠN - ƯU TIÊN CAO):\n`;
                info += `   - PHẢI có 3-4 hành động điều trị trong 4 ngày đầu (ngày 1, 2, 3, 4)\n`;
                info += `   - TĂNG cường độ điều trị: phun thuốc 2 lần/ngày (sáng + chiều) nếu cần\n`;
                info += `   - KẾT HỢP nhiều phương pháp: thuốc hóa học + phương pháp sinh học + biện pháp canh tác\n`;
                info += `   - Sử dụng CẢ THUỐC HÓA HỌC VÀ PHƯƠNG PHÁP SINH HỌC trong cùng ngày hoặc xen kẽ\n`;
                info += `   - Thêm biện pháp canh tác như cắt tỉa lá bệnh, tăng thông thoáng\n`;
                info += `   - Kiểm tra hàng ngày và điều chỉnh kịp thời\n`;
                info += `   - Có thể cần đổi thuốc nếu thuốc hiện tại không hiệu quả\n`;
              } else if (latestFeedback.status === 'same') {
                info += `\n⚠️ HÀNH ĐỘNG CẦN THIẾT (Bệnh KHÔNG ĐỔI - CẦN ĐỔI PHƯƠNG PHÁP):\n`;
                info += `   - PHẢI có 2-3 hành động điều trị trong 3 ngày đầu (ngày 1, 2, 3)\n`;
                info += `   - CẦN XEM XÉT đổi phương pháp: thử phương pháp sinh học hoặc biện pháp canh tác\n`;
                info += `   - KẾT HỢP: thuốc hóa học + phương pháp sinh học (ví dụ: ngày 1 dùng thuốc, ngày 2 dùng sinh học)\n`;
                info += `   - Thêm biện pháp canh tác như cải thiện môi trường, tăng dinh dưỡng\n`;
                info += `   - Có thể tăng liều lượng hoặc tần suất\n`;
                info += `   - Duy trì điều trị đều đặn và theo dõi sát sao\n`;
              } else if (latestFeedback.status === 'better') {
                info += `\n✅ HÀNH ĐỘNG CẦN THIẾT (Bệnh ĐỠ HƠN - GIẢM TẦN SUẤT):\n`;
                info += `   - Có 1-2 hành động điều trị trong 2 ngày đầu (ngày 1, 2)\n`;
                info += `   - GIẢM tần suất: từ 2 lần/ngày xuống 1 lần/ngày hoặc cách ngày\n`;
                info += `   - CHUYỂN SANG phương pháp nhẹ hơn: ưu tiên phương pháp sinh học và biện pháp canh tác\n`;
                info += `   - Tập trung vào biện pháp PHÒNG NGỪA tái phát (canh tác: vệ sinh, dinh dưỡng)\n`;
                info += `   - Có thể giảm liều lượng thuốc hóa học, tăng cường sinh học\n`;
                info += `   - Vẫn cần theo dõi và điều trị duy trì nhẹ nhàng\n`;
              } else if (latestFeedback.status === 'resolved') {
                info += `\n✅ HÀNH ĐỘNG CẦN THIẾT (Bệnh ĐÃ KHỎI - CHỈ PHÒNG NGỪA):\n`;
                info += `   - KHÔNG cần hành động điều trị tích cực (KHÔNG phun thuốc)\n`;
                info += `   - CHỈ có 1-2 hành động PHÒNG NGỪA trong tuần (có thể là biện pháp canh tác)\n`;
                info += `   - Tập trung vào biện pháp canh tác: vệ sinh vườn, cải thiện dinh dưỡng, tăng sức đề kháng\n`;
                info += `   - Có thể sử dụng phương pháp sinh học nhẹ nhàng để tăng cường sức khỏe cây\n`;
                info += `   - Tập trung vào chăm sóc thường xuyên (tưới nước đúng cách, bón phân cân đối)\n`;
                info += `   - Vẫn cần kiểm tra định kỳ (1-2 lần/tuần) để phát hiện sớm nếu tái phát\n`;
              }
              info += `\n`;
            }
            
            let hasTreatment = false;
            t.forEach(treatment => {
              if (treatment.type === 'chemical' && treatment.items && treatment.items.length > 0) {
                hasTreatment = true;
                info += `\n💊 THUỐC HÓA HỌC (BẮT BUỘC SỬ DỤNG TRONG CHIẾN LƯỢC):\n`;
                treatment.items.slice(0, 2).forEach((product, pIdx) => {
                  info += `\n[THUỐC ${pIdx + 1}] ${product.name}\n`;
                  info += `  → Hoạt chất: ${product.activeIngredient}\n`;
                  info += `  → Liều lượng: ${product.dosage}\n`;
                  info += `  → Cách dùng: ${product.usage}\n`;
                  if (product.frequency) info += `  → Tần suất: ${product.frequency}\n`;
                  if (product.isolationPeriod) info += `  → Cách ly trước thu hoạch: ${product.isolationPeriod}\n`;
                  if (product.precautions && product.precautions.length > 0) {
                    info += `  → Lưu ý: ${product.precautions.join(', ')}\n`;
                  }
                  info += `  → SỬ DỤNG: Phải đưa "${product.name}" vào hành động điều trị với liều lượng "${product.dosage}" và cách dùng "${product.usage}"\n`;
                });
              }
              
              if (treatment.type === 'biological' && treatment.items && treatment.items.length > 0) {
                hasTreatment = true;
                info += `\n🌿 PHƯƠNG PHÁP SINH HỌC (BẮT BUỘC SỬ DỤNG TRONG CHIẾN LƯỢC):\n`;
                info += `⚠️ QUAN TRỌNG: Phương pháp sinh học PHẢI được đưa vào plan, đặc biệt khi:\n`;
                info += `   - Bệnh "tệ hơn": KẾT HỢP với thuốc hóa học (cùng ngày hoặc xen kẽ)\n`;
                info += `   - Bệnh "không đổi": THỬ phương pháp sinh học thay thế hoặc bổ sung\n`;
                info += `   - Bệnh "đỡ hơn": CHUYỂN SANG ưu tiên phương pháp sinh học\n`;
                info += `   - Bệnh "đã khỏi": Sử dụng sinh học nhẹ nhàng để tăng cường sức khỏe\n`;
                treatment.items.slice(0, 2).forEach((method, mIdx) => {
                  info += `\n[PHƯƠNG PHÁP ${mIdx + 1}] ${method.name}\n`;
                  info += `  → Vật liệu cần: ${method.materials}\n`;
                  info += `  → Các bước: ${method.steps}\n`;
                  info += `  → Thời gian: ${method.timeframe}\n`;
                  if (method.effectiveness) {
                    info += `  → Hiệu quả: ${method.effectiveness}\n`;
                  }
                  info += `  → SỬ DỤNG: PHẢI đưa "${method.name}" vào hành động điều trị với các bước: "${method.steps}"\n`;
                });
              }
              
              if (treatment.type === 'cultural' && treatment.items && treatment.items.length > 0) {
                hasTreatment = true;
                info += `\n🌾 BIỆN PHÁP CANH TÁC (BẮT BUỘC SỬ DỤNG TRONG CHIẾN LƯỢC):\n`;
                info += `⚠️ QUAN TRỌNG: Biện pháp canh tác PHẢI được đưa vào plan:\n`;
                info += `   - Bệnh "tệ hơn": Thêm biện pháp canh tác như cắt tỉa, vệ sinh, tăng thông thoáng\n`;
                info += `   - Bệnh "không đổi": Cải thiện môi trường, dinh dưỡng, điều kiện trồng\n`;
                info += `   - Bệnh "đỡ hơn": Tập trung vào phòng ngừa tái phát bằng canh tác\n`;
                info += `   - Bệnh "đã khỏi": CHỈ sử dụng biện pháp canh tác để phòng ngừa\n`;
                treatment.items.slice(0, 3).forEach((practice, cIdx) => {
                  info += `\n[BIỆN PHÁP ${cIdx + 1}] ${practice.action} (Ưu tiên: ${practice.priority || 'medium'})\n`;
                  info += `  → Mô tả: ${practice.description}\n`;
                  info += `  → SỬ DỤNG: PHẢI đưa "${practice.action}" vào hành động chăm sóc với mô tả: "${practice.description}"\n`;
                });
              }
            });
            
            if (!hasTreatment) {
              info += `\n⚠️ Không tìm thấy thông tin điều trị cụ thể trong cơ sở dữ liệu cho bệnh này.\n`;
              info += `   Vui lòng đưa ra hành động điều trị chung dựa trên kinh nghiệm.\n`;
            }
            
            info += `\n═══════════════════════════════════════════════════════════\n`;
            if (hasUserSelectedChemical) {
              info += `⚠️⚠️⚠️ QUAN TRỌNG: Đây là các THUỐC HÓA HỌC NGƯỜI DÙNG ĐÃ CHỌN.\n`;
              info += `   PHẢI sử dụng CHÍNH XÁC các thuốc này trong chiến lược.\n`;
              info += `   KHÔNG được thay đổi hoặc đề xuất thuốc khác.\n`;
              info += `   PHẢI ghi rõ tên thuốc và liều lượng từ thông tin trên.\n`;
              info += `   Phương pháp sinh học và canh tác là gợi ý tự động, có thể sử dụng để bổ sung.\n`;
            } else {
              info += `⚠️ LƯU Ý: PHẢI sử dụng thông tin trên để tạo hành động điều trị CỤ THỂ trong chiến lược.\n`;
              info += `   KHÔNG được chỉ nói chung chung như "phun thuốc trị bệnh".\n`;
              info += `   PHẢI ghi rõ tên thuốc/phương pháp và liều lượng từ thông tin trên.\n`;
            }
            info += `═══════════════════════════════════════════════════════════\n`;
            
            return info;
          })
          .join('\n');
      } catch (error) {
        console.error('❌ [CareStrategy] Error fetching treatments:', error);
        // Continue without treatment info
      }
    }
    
    // Build prompt for GPT to generate care strategy
    const strategyPrompt = `
Bạn là chuyên gia nông nghiệp. Hãy tạo chiến lược chăm sóc CỤ THỂ cho cây trồng dựa trên thông tin sau:

🌱 THÔNG TIN CÂY:
- Tên: ${plantBox.plantName}${plantBox.scientificName ? ` (${plantBox.scientificName})` : ''}
- Trạng thái: ${plantBox.plantType === 'existing' ? 'Đang trồng' : 'Dự định trồng'}
${plantBox.plantedDate ? `- Ngày trồng: ${new Date(plantBox.plantedDate).toLocaleDateString('vi-VN')}` : ''}
${plantBox.plannedDate ? `- Ngày dự định trồng: ${new Date(plantBox.plannedDate).toLocaleDateString('vi-VN')}` : ''}
- Vị trí: ${plantBox.location.name}
${plantBox.location.soilType && plantBox.location.soilType.length > 0 
  ? `- Loại đất: ${Array.isArray(plantBox.location.soilType) ? plantBox.location.soilType.join(', ') : plantBox.location.soilType}` 
  : ''}
${plantBox.location.sunlight ? `- Ánh sáng: ${plantBox.location.sunlight}` : ''}
${plantBox.growthStage ? `- Giai đoạn: ${plantBox.growthStage}` : ''}
${plantBox.currentHealth ? `- Sức khỏe: ${plantBox.currentHealth}` : ''}
${plantBox.careLevel ? `- Mức độ chăm sóc: ${plantBox.careLevel}` : ''}
${plantBox.wateringMethod ? `- Phương pháp tưới: ${plantBox.wateringMethod}` : ''}
${activeDiseases.length > 0 ? `
🦠 BỆNH / VẤN ĐỀ SỨC KHỎE (CẦN ĐIỀU TRỊ):
${activeDiseases.map((disease, i) => `
Bệnh ${i + 1}:
- Tên/Triệu chứng: ${disease.name}
${disease.symptoms ? `- Mô tả: ${disease.symptoms}` : ''}
- Mức độ: ${disease.severity === 'mild' ? 'Nhẹ' : disease.severity === 'moderate' ? 'Trung bình' : 'Nghiêm trọng'}
- Trạng thái: ${disease.status === 'active' ? 'Đang hoạt động' : disease.status === 'treating' ? 'Đang điều trị' : 'Đã khỏi'}
`).join('\n')}
⚠️ QUAN TRỌNG: Chiến lược chăm sóc PHẢI ưu tiên điều trị bệnh này. Bao gồm các hành động cụ thể để xử lý bệnh.
${treatmentInfo ? `\n${treatmentInfo}\n` : ''}
${productRecommendations ? `${productRecommendations}\n` : ''}
` : ''}
${plantBox.currentDiseases && plantBox.currentDiseases.length > activeDiseases.length ? `
✅ BỆNH ĐÃ KHỎI (KHÔNG CẦN ĐIỀU TRỊ):
${plantBox.currentDiseases.filter(d => {
  const latestFeedback = d.feedback && d.feedback.length > 0 ? d.feedback[d.feedback.length - 1] : null;
  return d.status === 'resolved' || (latestFeedback && latestFeedback.status === 'resolved');
}).map(d => `- ${d.name} (đã khỏi)`).join('\n')}
⚠️ LƯU Ý: Các bệnh này đã khỏi, KHÔNG cần đưa ra hành động điều trị tích cực. Chỉ cần biện pháp phòng ngừa tái phát.
` : ''}
${plantBox.healthNotes ? `- Ghi chú sức khỏe: ${plantBox.healthNotes}` : ''}
${fruitingInfo.message ? `\n🌱 THÔNG TIN MÙA RA TRÁI:\n${fruitingInfo.message}\n` : ''}

🌤️ THỜI TIẾT 7 NGÀY TỚI (ĐÃ PHÂN TÍCH - PHẢI SỬ DỤNG NHÃN NÀY):
${analyzedWeather.map((day, i) => `
Ngày ${i + 1} (${new Date(day.date).toLocaleDateString('vi-VN')}):
- Nhiệt độ: ${day.temp.min}°C - ${day.temp.max}°C → ${day.temp.label}
- Độ ẩm: ${day.humidity.value}% → ${day.humidity.label}
- Mưa: ${day.rain.value}mm → ${day.rain.label}
- Nhu cầu tưới: ${day.wateringNeed.reason}
${day.alerts.length > 0 ? `- Cảnh báo: ${day.alerts.join(', ')}` : ''}
`).join('\n')}

⚠️⚠️⚠️ QUAN TRỌNG TUYỆT ĐỐI:
- PHẢI sử dụng NHÃN ĐÃ PHÂN TÍCH ở trên (ví dụ: "${analyzedWeather[0]?.temp.label}", "${analyzedWeather[0]?.humidity.label}", "${analyzedWeather[0]?.wateringNeed.reason}")
- KHÔNG được tự suy luận từ số thô (ví dụ: KHÔNG được nói "nhiệt độ cao" nếu nhãn là "Bình thường")
- KHÔNG được nói "cần bổ sung nước" nếu nhãn là "Có mưa, không cần tưới" hoặc độ ẩm là "Rất cao"
- Sử dụng CHÍNH XÁC nhãn và lý do từ phần "Nhu cầu tưới" ở trên

YÊU CẦU:
${activeDiseases.length > 0 ? `
🚨🚨🚨 YÊU CẦU ĐẦU TIÊN VÀ QUAN TRỌNG NHẤT:
Cây đang có bệnh CẦN ĐIỀU TRỊ: ${activeDiseases.map(d => d.name).join(', ')} - Mức độ: ${activeDiseases.map(d => d.severity === 'mild' ? 'Nhẹ' : d.severity === 'moderate' ? 'Trung bình' : 'Nghiêm trọng').join(', ')}

BẮT BUỘC: PHẢI đưa hành động điều trị bệnh vào ít nhất 2-3 ngày đầu tiên (ngày 1, 2, 3).
Nếu không có hành động điều trị bệnh, chiến lược sẽ bị từ chối và yêu cầu tạo lại.

Sử dụng THÔNG TIN ĐIỀU TRỊ TỪ CƠ SỞ DỮ LIỆU ở phần 📋 ĐIỀU TRỊ CHO... ở trên.
Mỗi hành động điều trị PHẢI có:
- type: "protect"
- description: TÊN THUỐC/PHƯƠNG PHÁP CỤ THỂ từ cơ sở dữ liệu
- reason: Giải thích rõ về điều trị bệnh
- products: Tên thuốc/phương pháp từ cơ sở dữ liệu

` : ''}
1. Tạo chiến lược chăm sóc THÔNG MINH và THỰC TẾ cho 7 ngày tới
2. ${plantBox.currentDiseases && plantBox.currentDiseases.length > 0 ? `
⚠️⚠️⚠️ ƯU TIÊN TỐI ĐA - ĐIỀU TRỊ BỆNH:
- Cây đang có bệnh: ${plantBox.currentDiseases.map(d => d.name).join(', ')}
- Mức độ: ${plantBox.currentDiseases.map(d => d.severity === 'mild' ? 'Nhẹ' : d.severity === 'moderate' ? 'Trung bình' : 'Nghiêm trọng').join(', ')}
${plantBox.currentDiseases.some(d => d.feedback && d.feedback.length > 0) ? `
- 🚨 PHẢN HỒI TỪ NGƯỜI DÙNG: Xem phần "PHẢN HỒI TỪ NGƯỜI DÙNG" ở trên để điều chỉnh chiến lược
  * Nếu "TỆ HƠN" → Tăng cường độ, tần suất điều trị
  * Nếu "KHÔNG ĐỔI" → Xem xét đổi phương pháp, tăng liều lượng
  * Nếu "ĐỠ HƠN" → Giảm tần suất, chuyển sang phương pháp nhẹ hơn
  * Nếu "ĐÃ KHỎI" → Dừng điều trị tích cực, chuyển sang phòng ngừa
` : ''}
- PHẢI đưa hành động điều trị bệnh vào CHÍNH XÁC các ngày trong tuần
- Sử dụng THÔNG TIN ĐIỀU TRỊ TỪ CƠ SỞ DỮ LIỆU ở trên (phần 📋 ĐIỀU TRỊ CHO...)
- ĐIỀU CHỈNH chiến lược dựa trên PHẢN HỒI từ người dùng (xem phần 🚨 PHẢN HỒI ở trên)
- Mỗi hành động điều trị PHẢI bao gồm:
  * Tên thuốc/phương pháp CỤ THỂ từ cơ sở dữ liệu (ví dụ: "Phun thuốc [Tên thuốc từ DB]" hoặc "Áp dụng [Phương pháp sinh học từ DB]")
  * Liều lượng/cách dùng từ cơ sở dữ liệu
  * Thời gian phù hợp (sáng sớm hoặc chiều tối, tránh nắng gắt)
  * Lý do: "Điều trị bệnh [tên bệnh], mức độ [mild/moderate/severe]" ${plantBox.currentDiseases.some(d => d.feedback && d.feedback.length > 0) ? '+ "Dựa trên phản hồi: [tình trạng từ phản hồi]"' : ''}
- Ví dụ hành động điều trị:
  {
    "type": "protect",
    "time": "07:00",
    "description": "Phun thuốc [Tên thuốc từ DB] - [Liều lượng từ DB]",
    "reason": "Điều trị bệnh [tên bệnh], mức độ nghiêm trọng. Sử dụng [Tên thuốc] với liều lượng [liều lượng từ DB] theo hướng dẫn từ cơ sở dữ liệu.",
    "products": ["[Tên thuốc từ DB]"]
  }
- BẮT BUỘC sử dụng phương pháp sinh học và biện pháp canh tác:
  * Nếu có phương pháp sinh học trong DB → PHẢI đưa vào hành động (đặc biệt khi bệnh "tệ hơn", "không đổi", "đỡ hơn")
  * Nếu có biện pháp canh tác trong DB → PHẢI đưa vào hành động (đặc biệt khi bệnh "đã khỏi" hoặc "đỡ hơn")
  * KẾT HỢP: có thể kết hợp thuốc + sinh học + canh tác trong cùng ngày hoặc xen kẽ
- KHÔNG được bỏ qua hoặc chỉ nói chung chung về điều trị bệnh
- PHẢI sử dụng CỤ THỂ tên phương pháp sinh học và biện pháp canh tác từ cơ sở dữ liệu
` : ''}
3. Mỗi ngày chỉ cần có các hành động THỰC SỰ CẦN THIẾT:
   - ${plantBox.currentDiseases && plantBox.currentDiseases.length > 0 ? `
   ⚠️ ĐIỀU CHỈNH SỐ LƯỢNG HÀNH ĐỘNG ĐIỀU TRỊ DỰA TRÊN PHẢN HỒI:
     * Nếu phản hồi "TỆ HƠN": 
       - PHẢI có 3-4 hành động điều trị trong 4 ngày đầu (ngày 1, 2, 3, 4)
       - KẾT HỢP: thuốc hóa học + phương pháp sinh học + biện pháp canh tác
       - Tăng tần suất: có thể 2 lần/ngày (sáng + chiều)
       - Ví dụ: Ngày 1: phun thuốc + áp dụng sinh học, Ngày 2: phun thuốc + biện pháp canh tác
     * Nếu phản hồi "KHÔNG ĐỔI": 
       - PHẢI có 2-3 hành động điều trị trong 3 ngày đầu (ngày 1, 2, 3)
       - ĐỔI PHƯƠNG PHÁP: thử phương pháp sinh học hoặc biện pháp canh tác
       - KẾT HỢP: thuốc + sinh học (ví dụ: ngày 1 thuốc, ngày 2 sinh học)
     * Nếu phản hồi "ĐỠ HƠN": 
       - CHỈ có 1 hành động điều trị trong ngày đầu (ngày 1) - GIẢM MẠNH
       - CHUYỂN SANG ưu tiên phương pháp sinh học và biện pháp canh tác (KHÔNG dùng thuốc hóa học nữa)
       - Tập trung phòng ngừa tái phát bằng canh tác
       - KHÔNG lặp lại các hành động giống nhau (KHÔNG bón phân NPK nhiều lần, KHÔNG tưới nước nhiều lần)
       - Mỗi hành động phải có LÝ DO CỤ THỂ dựa trên thời tiết và tình trạng cây
     * Nếu phản hồi "ĐÃ KHỎI": 
       - KHÔNG có hành động điều trị tích cực (KHÔNG phun thuốc)
       - CHỈ có 1-2 hành động PHÒNG NGỪA (biện pháp canh tác hoặc sinh học nhẹ)
       - Tập trung vào chăm sóc thường xuyên
     * Nếu chưa có phản hồi: PHẢI có ít nhất 2-3 hành động điều trị trong tuần đầu (ngày 1-3)
   ` : ''}
   - CHỈ đưa ra hành động khi:
     * ${plantBox.currentDiseases && plantBox.currentDiseases.length > 0 ? 'Cần điều trị bệnh (BẮT BUỘC - sử dụng thông tin từ cơ sở dữ liệu)' : ''}
     * Cần tưới nước (dựa trên thời tiết: mưa ít, nhiệt độ cao, độ ẩm thấp)
     * Có cảnh báo thời tiết (mưa lớn, sương giá, hạn hán)
     * Cần kiểm tra (khi có dấu hiệu bất thường)
   - Mỗi hành động cần có:
     * Thời gian hợp lý (ví dụ: "Sáng sớm", "Chiều tối", "07:00" nếu cần cụ thể)
     * Mô tả hành động RÕ RÀNG ${plantBox.currentDiseases && plantBox.currentDiseases.length > 0 ? 'và bao gồm TÊN THUỐC/PHƯƠNG PHÁP CỤ THỂ từ cơ sở dữ liệu' : ''}
     * Lý do CỤ THỂ (dựa trên thời tiết ${plantBox.currentDiseases && plantBox.currentDiseases.length > 0 ? ', tình trạng bệnh, và phản hồi từ người dùng' : ''})
     * Sản phẩm cần dùng (${plantBox.currentDiseases && plantBox.currentDiseases.length > 0 ? 'BẮT BUỘC cho hành động điều trị bệnh - sử dụng tên thuốc/phương pháp từ cơ sở dữ liệu' : 'CHỈ khi thực sự cần'})
4. ${fruitingInfo.isFruitingSeason ? '⚠️ LƯU Ý: Hiện tại đang là mùa ra trái, cần chăm sóc đặc biệt để đảm bảo chất lượng trái.' : ''}
5. Phân tích thời tiết và đưa ra cảnh báo nếu cần
6. Trả lời bằng JSON format sau:

${plantBox.currentDiseases && plantBox.currentDiseases.length > 0 ? `
VÍ DỤ CHO CÂY CÓ BỆNH (PHẢI LÀM TƯƠNG TỰ):
{
  "next7Days": [
    {
      "date": "2024-01-15",
      "actions": [
        {
          "type": "protect",
          "time": "07:00",
          "description": "Phun thuốc [Tên thuốc từ DB] với liều lượng [liều lượng từ DB]",
          "reason": "Điều trị bệnh [tên bệnh] mức độ [mild/moderate/severe]. Sử dụng [Tên thuốc] theo hướng dẫn: [cách dùng từ DB]. Tần suất: [tần suất từ DB]",
          "products": ["[Tên thuốc từ DB]"]
        },
        {
          "type": "water",
          "time": "08:00",
          "description": "Tưới nước đủ ẩm",
          "reason": "Nhiệt độ cao 32°C, độ ẩm thấp 45%, cây cần nhiều nước",
          "products": []
        }
      ],
      "weather": {
        "temp": { "min": 25, "max": 32 },
        "humidity": 45,
        "rain": 0,
        "alerts": []
      }
    },
    {
      "date": "2024-01-16",
      "actions": [
        {
          "type": "protect",
          "time": "17:00",
          "description": "Áp dụng [Phương pháp sinh học từ DB]",
          "reason": "Tiếp tục điều trị bệnh [tên bệnh]. Áp dụng [Phương pháp sinh học] với các bước: [các bước từ DB]",
          "products": ["[Phương pháp sinh học từ DB]"]
        }
      ],
      "weather": {
        "temp": { "min": 24, "max": 31 },
        "humidity": 50,
        "rain": 0,
        "alerts": []
      }
    }
  ],
  "summary": "Chiến lược tập trung vào điều trị bệnh [tên bệnh] với [Tên thuốc] và [Phương pháp sinh học]..."
}
` : `
{
  "next7Days": [
    {
      "date": "2024-01-15",
      "actions": [
        {
          "type": "water",
          "time": "08:00",
          "description": "Tưới nước đủ ẩm",
          "reason": "Nhiệt độ cao 32°C, độ ẩm thấp 45%, cây cần nhiều nước",
          "products": []
        }
      ],
      "weather": {
        "temp": { "min": 25, "max": 32 },
        "humidity": 45,
        "rain": 0,
        "alerts": []
      }
    }
  ],
  "summary": "Tóm tắt chiến lược chăm sóc 7 ngày..."
}
`}

QUAN TRỌNG:
${plantBox.currentDiseases && plantBox.currentDiseases.length > 0 ? `
🚨🚨🚨🚨🚨 BẮT BUỘC TUYỆT ĐỐI CHO CÂY CÓ BỆNH - ĐỌC KỸ:
1. PHẢI đưa hành động điều trị bệnh vào ÍT NHẤT 2-3 ngày đầu tiên (ngày 1, 2, 3)
2. Mỗi hành động điều trị PHẢI có:
   * type: "protect" (cho thuốc/phương pháp điều trị)
   * time: "07:00" hoặc "17:00" (sáng sớm hoặc chiều tối)
   * description: PHẢI bao gồm TÊN THUỐC/PHƯƠNG PHÁP CỤ THỂ từ phần 📋 ĐIỀU TRỊ CHO... ở trên
     Ví dụ: "Phun thuốc [Tên thuốc từ DB] với liều lượng [liều lượng từ DB]"
     HOẶC: "Áp dụng [Phương pháp sinh học từ DB] với các bước: [các bước từ DB]"
   * reason: PHẢI giải thích rõ:
     - "Điều trị bệnh [tên bệnh] mức độ [mild/moderate/severe]"
     - "Sử dụng [Tên thuốc/phương pháp từ DB]"
     - "Liều lượng: [liều lượng từ DB]"
     - "Cách dùng: [cách dùng từ DB]"
     - "Tần suất: [tần suất từ DB]" (nếu có)
   * products: Mảng chứa TÊN THUỐC/PHƯƠNG PHÁP từ cơ sở dữ liệu
     Ví dụ: ["[Tên thuốc từ DB]"] hoặc ["[Phương pháp sinh học từ DB]"]
3. KHÔNG được:
   - Bỏ qua hành động điều trị bệnh
   - Chỉ nói chung chung như "phun thuốc trị bệnh", "bón phân NPK", "tưới nước"
- KHÔNG lặp lại các hành động giống nhau nhiều lần (ví dụ: không bón phân NPK 20-20-20 nhiều ngày liên tiếp)
- Mỗi hành động phải có LÝ DO CỤ THỂ dựa trên thời tiết, tình trạng cây, và phản hồi từ người dùng
- KHÔNG tạo ra các hành động "mock data" như: 3 ngày đầu dùng thuốc, 2 ngày không làm gì, 1 ngày bón phân, 1 ngày tưới nước
- PHẢI suy nghĩ và tạo plan dựa trên THỰC TẾ: thời tiết, bệnh tật, phản hồi người dùng
   - Đưa ra hành động không liên quan đến điều trị bệnh mà không có hành động điều trị
4. Nếu có nhiều thuốc/phương pháp trong cơ sở dữ liệu:
   - Ưu tiên thuốc hóa học cho ngày đầu
   - Có thể kết hợp phương pháp sinh học cho ngày sau
   - Có thể thêm biện pháp canh tác
5. Nếu KHÔNG có thông tin trong cơ sở dữ liệu:
   - Vẫn PHẢI đưa ra hành động điều trị dựa trên kinh nghiệm
   - Mô tả cụ thể: "Phun thuốc trị bệnh đốm lá [tên bệnh]"
   - Lý do: "Điều trị bệnh [tên bệnh] mức độ [mild/moderate/severe]"

VÍ DỤ ĐÚNG (PHẢI LÀM TƯƠNG TỰ):
{
  "type": "protect",
  "time": "07:00",
  "description": "Phun thuốc Mancozeb với liều lượng 20g/10L nước",
  "reason": "Điều trị bệnh đốm lá mức độ nhẹ. Sử dụng Mancozeb với liều lượng 20g/10L nước. Cách dùng: Phun đều lên lá, tần suất: 3-5 ngày/lần",
  "products": ["Mancozeb"]
}

VÍ DỤ SAI (KHÔNG được làm):
{
  "type": "water",
  "description": "Tưới nước",
  "reason": "Cây cần nước"
}
HOẶC
{
  "type": "fertilize",
  "description": "Bón phân NPK",
  "reason": "Cây cần dinh dưỡng"
}
→ Những hành động này KHÔNG điều trị bệnh, chỉ là chăm sóc thường xuyên
` : ''}
- CHỈ đưa ra hành động THỰC SỰ CẦN THIẾT, không đưa ra hành động định kỳ không có lý do
- Nếu một ngày không có hành động nào cần thiết (và không có bệnh), để actions = []
- Phải giải thích LÝ DO CỤ THỂ dựa trên thời tiết, tình trạng bệnh, và phản hồi từ người dùng
- Phải có cảnh báo nếu thời tiết bất lợi
- CHỈ TRẢ VỀ JSON THUẦN TÚY, KHÔNG CÓ MARKDOWN, KHÔNG CÓ TEXT THÊM
- JSON phải hợp lệ, không có trailing commas, không có comments
- Đảm bảo tất cả strings đều được escape đúng cách

TRẢ LỜI CHỈ BẰNG JSON, KHÔNG CÓ GÌ KHÁC:
`;

    // Call GPT to generate strategy
    const response = await generateAIResponse({
      messages: [
        {
          role: 'user',
          content: strategyPrompt,
        },
      ],
      weather: weather,
    });

    // Parse JSON response
    let strategyData;
    try {
      let jsonString = response.data.message || response.data || '';
      
      // Remove markdown code blocks if present
      jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      // Try to extract JSON object
      let jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // Try to find JSON array
        jsonMatch = jsonString.match(/\[[\s\S]*\]/);
      }
      
      if (jsonMatch) {
        try {
          let jsonToParse = jsonMatch[0];
          
          // Fix common JSON issues
          // Remove trailing commas before closing brackets/braces
          jsonToParse = jsonToParse.replace(/,(\s*[}\]])/g, '$1');
          
          // Remove comments (single line and multi-line)
          jsonToParse = jsonToParse.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
          
          strategyData = JSON.parse(jsonToParse);
        } catch (parseError) {
          console.error('Failed to parse extracted JSON:', parseError);
          console.error('JSON position:', parseError.message);
          console.error('Extracted JSON (first 1000 chars):', jsonMatch[0].substring(0, 1000));
          throw parseError;
        }
      } else {
        console.error('No JSON found in response. Full response:', jsonString.substring(0, 500));
        throw new Error('No JSON found in response');
      }
      
      // Validate structure
      if (!strategyData.next7Days || !Array.isArray(strategyData.next7Days)) {
        console.error('Invalid strategy structure:', strategyData);
        throw new Error('Invalid strategy structure');
      }

      // Validate that treatment actions exist if plant has ACTIVE diseases
      if (activeDiseases.length > 0) {
        const hasTreatmentActions = strategyData.next7Days.some(day => 
          day.actions && day.actions.some(action => 
            action.type === 'protect' && 
            action.description && 
            (action.description.toLowerCase().includes('thuốc') || 
             action.description.toLowerCase().includes('phun') ||
             action.description.toLowerCase().includes('điều trị') ||
             action.description.toLowerCase().includes('bệnh'))
          )
        );

        if (!hasTreatmentActions) {
          console.warn('⚠️ [CareStrategy] No treatment actions found in strategy, but plant has active diseases. Adding treatment actions...');
          
          // Auto-add treatment actions to first 2-3 days
          const treatmentInfo = activeDiseases.map(d => d.name).join(', ');
          for (let i = 0; i < Math.min(3, strategyData.next7Days.length); i++) {
            const day = strategyData.next7Days[i];
            if (!day.actions) day.actions = [];
            
            // Check if already has treatment action
            const hasTreatment = day.actions.some(a => a.type === 'protect');
            if (!hasTreatment) {
              day.actions.unshift({
                _id: `action_${i}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'protect',
                time: '07:00',
                description: `Phun thuốc trị bệnh ${treatmentInfo}`,
                reason: `Điều trị bệnh ${treatmentInfo}. Cần sử dụng thuốc đặc trị theo hướng dẫn từ cơ sở dữ liệu (xem phần 📋 ĐIỀU TRỊ CHO... ở trên).`,
                products: treatmentInfo.split(', ').map(d => `Thuốc trị ${d}`),
                completed: false,
              });
            }
          }
        }
      }
    } catch (parseError) {
      console.error('Failed to parse strategy JSON:', parseError);
      console.error('Original response:', response.data?.message?.substring(0, 1000));
      // Fallback: Create basic strategy
      strategyData = createFallbackStrategy(plantBox, weather);
    }

    // Format dates - ensure we have exactly 7 days
    const next7Days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);

      const dayData = strategyData.next7Days[i] || {};
      const weatherData = weather.forecast[i] || {};

      // Ensure each action has a unique _id
      const actions = Array.isArray(dayData.actions) 
        ? dayData.actions.map((action, actionIdx) => ({
            ...action,
            _id: action._id || `action_${i}_${actionIdx}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            completed: action.completed || false,
          }))
        : [];

      next7Days.push({
        date,
        actions,
        weather: {
          temp: dayData.weather?.temp || weatherData.temperature || { min: 20, max: 30 },
          humidity: dayData.weather?.humidity ?? weatherData.humidity ?? 60,
          rain: dayData.weather?.rain ?? weatherData.rain ?? 0,
          alerts: Array.isArray(dayData.weather?.alerts) ? dayData.weather.alerts : [],
        },
      });
    }

    // Note: Strategy is saved to database in refreshCareStrategy service function

    return {
      lastUpdated: new Date(),
      next7Days,
      summary: strategyData.summary || 'Chiến lược chăm sóc được tạo tự động dựa trên thời tiết và thông tin cây trồng.',
    };
  } catch (error) {
    console.error('Failed to generate care strategy:', error);
    // Return fallback strategy
    return createFallbackStrategy(plantBox, weather);
  }
};

/**
 * Create fallback strategy if GPT fails
 * @param {object} plantBox - Plant box data
 * @param {object} weather - Weather data
 * @returns {object} Basic care strategy
 */
const createFallbackStrategy = (plantBox, weather) => {
  // Filter active diseases (not resolved)
  const activeDiseases = (plantBox.currentDiseases || []).filter(disease => {
    const latestFeedback = disease.feedback && disease.feedback.length > 0
      ? disease.feedback[disease.feedback.length - 1]
      : null;
    return disease.status !== 'resolved' && 
           (!latestFeedback || latestFeedback.status !== 'resolved');
  });
  
  const next7Days = weather.forecast.slice(0, 7).map((day, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    date.setHours(0, 0, 0, 0);

    const actions = [];

    // PRIORITY: Treatment actions if plant has ACTIVE diseases
    if (activeDiseases.length > 0 && index < 3) {
      // Add treatment action for first 3 days
      const diseaseNames = activeDiseases.map(d => d.name).join(', ');
      const severity = activeDiseases[0].severity || 'moderate';
      const severityText = severity === 'mild' ? 'nhẹ' : severity === 'moderate' ? 'trung bình' : 'nghiêm trọng';
      
      actions.push({
        _id: `action_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'protect',
        time: index === 0 ? '07:00' : '17:00', // Alternate morning/evening
        description: `Phun thuốc trị bệnh ${diseaseNames}`,
        reason: `Điều trị bệnh ${diseaseNames} mức độ ${severityText}. Cần sử dụng thuốc đặc trị theo hướng dẫn từ cơ sở dữ liệu.`,
        products: activeDiseases.map(d => `Thuốc trị ${d.name}`),
        completed: false,
      });
    }

    // Watering based on temperature and rain (only if not treating disease on same day)
    if (day.rain < 5 && (!plantBox.currentDiseases || plantBox.currentDiseases.length === 0 || index >= 3)) {
      // No rain or light rain, need watering
      const waterAmount = day.temperature.max > 30 ? 'đủ ẩm' : 'vừa phải';
      actions.push({
        _id: `action_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'water',
        time: '08:00',
        description: `Tưới nước ${waterAmount} vào sáng sớm`,
        reason: `Nhiệt độ cao ${day.temperature.max}°C, độ ẩm ${day.humidity}%, cần bổ sung nước`,
        products: [],
        completed: false,
      });
    }

    // Check action
    if (day.rain > 20) {
      actions.push({
        _id: `action_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'check',
        time: '18:00',
        description: 'Kiểm tra hệ thống thoát nước',
        reason: `Mưa lớn dự báo ${day.rain}mm, cần kiểm tra tránh úng nước`,
        products: [],
        completed: false,
      });
    }

    // DON'T add generic fertilize actions - let GPT decide based on actual conditions
    // Only add if really necessary and not already in strategy

    const alerts = [];
    if (day.temperature.min < 5) {
      alerts.push('Cảnh báo sương giá');
    }
    if (day.rain > 20) {
      alerts.push('Cảnh báo mưa lớn');
    }
    if (day.humidity < 30) {
      alerts.push('Cảnh báo hạn hán');
    }

    return {
      date,
      actions,
      weather: {
        temp: day.temperature,
        humidity: day.humidity,
        rain: day.rain || 0,
        alerts,
      },
    };
  });

  return {
    lastUpdated: new Date(),
    next7Days,
    summary: 'Chiến lược chăm sóc cơ bản dựa trên thời tiết. Vui lòng cập nhật để có chiến lược chi tiết hơn.',
  };
};

export default {
  generateCareStrategy,
};

