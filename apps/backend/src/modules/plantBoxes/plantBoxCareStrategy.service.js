import { generateAIResponse, callGPT } from '../aiAssistant/ai.service.js';
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
    // Validate weather data
    if (!weather || !weather.forecast || !Array.isArray(weather.forecast) || weather.forecast.length === 0) {
      console.error('❌ [generateCareStrategy] Invalid weather data:', weather);
      throw new Error('Weather data is required and must have forecast array');
    }
    
    console.log(`🌤️ [generateCareStrategy] Weather forecast received: ${weather.forecast.length} days`);
    weather.forecast.forEach((day, i) => {
      console.log(`  Day ${i + 1}: ${day.temperature?.min ?? 'N/A'}°C - ${day.temperature?.max ?? 'N/A'}°C, ${day.humidity ?? 'N/A'}%, ${day.rain ?? 0}mm`);
    });
    
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
            
            // Get severity score (0-10 scale)
            // 0-2: resolved/mild, 3-4: improving, 5-6: moderate, 7-8: severe, 9-10: critical
            const severityScore = disease.severityScore !== undefined && disease.severityScore !== null
              ? disease.severityScore
              : (disease.severity === 'mild' ? 3 : disease.severity === 'moderate' ? 5 : 7);
            
            // Determine effective status based on score
            let effectiveStatus = null;
            if (severityScore <= 0) {
              effectiveStatus = 'resolved';
            } else if (severityScore <= 2) {
              effectiveStatus = 'resolved'; // Almost resolved
            } else if (severityScore <= 4) {
              effectiveStatus = 'better'; // Improving
            } else if (severityScore <= 6) {
              effectiveStatus = latestFeedback?.status || 'same'; // Moderate
            } else if (severityScore <= 8) {
              effectiveStatus = 'same'; // Severe but stable
            } else {
              effectiveStatus = 'worse'; // Critical
            }
            
            let info = `\n═══════════════════════════════════════════════════════════\n`;
            info += `📋 THÔNG TIN ĐIỀU TRỊ CHO BỆNH: "${disease.name}"\n`;
            if (hasUserSelectedChemical) {
              info += `✅ (NGƯỜI DÙNG ĐÃ CHỌN THUỐC - PHẢI SỬ DỤNG CHÍNH XÁC)\n`;
            }
            info += `═══════════════════════════════════════════════════════════\n`;
            
            // Use severity score for more accurate assessment
            const severityLevel = severityScore <= 2 ? 'ĐÃ KHỎI/PHỤC HỒI' :
                                  severityScore <= 4 ? 'ĐỠ HƠN' :
                                  severityScore <= 6 ? 'TRUNG BÌNH' :
                                  severityScore <= 8 ? 'NẶNG' : 'RẤT NẶNG';
            
            info += `\n🚨 ĐÁNH GIÁ MỨC ĐỘ BỆNH (DỰA TRÊN ĐIỂM SỐ):\n`;
            info += `📊 Điểm số: ${severityScore}/10 (${severityLevel})\n`;
            if (latestFeedback) {
              const feedbackText = {
                'worse': 'Bệnh đang TỆ HƠN',
                'same': 'Bệnh KHÔNG THAY ĐỔI',
                'better': 'Bệnh đang ĐỠ HƠN',
                'resolved': 'Bệnh ĐÃ KHỎI'
              };
              info += `📝 Phản hồi gần nhất: ${feedbackText[latestFeedback.status] || latestFeedback.status}\n`;
              if (latestFeedback.notes) {
                info += `   Ghi chú: ${latestFeedback.notes}\n`;
              }
            }
            
            // Add specific instructions based on severity score
            if (severityScore >= 9) {
              info += `\n🚨🚨🚨 HÀNH ĐỘNG KHẨN CẤP (Điểm ${severityScore}/10 - RẤT NẶNG):\n`;
              info += `   - PHẢI có 4 hành động điều trị trong 4 ngày đầu (ngày 1, 2, 3, 4)\n`;
              info += `   - Phun thuốc 2 lần/ngày (sáng + chiều)\n`;
              info += `   - KẾT HỢP: thuốc hóa học + sinh học + canh tác (mỗi cái là ACTION RIÊNG)\n`;
            } else if (severityScore >= 7) {
              info += `\n⚠️⚠️⚠️ HÀNH ĐỘNG CẦN THIẾT (Điểm ${severityScore}/10 - NẶNG):\n`;
              info += `   - PHẢI có 3-4 hành động điều trị trong 4 ngày đầu (ngày 1, 2, 3, 4)\n`;
              info += `   - Phun thuốc 1 lần/ngày (sáng hoặc chiều)\n`;
              info += `   - KẾT HỢP: thuốc hóa học + sinh học + canh tác (mỗi cái là ACTION RIÊNG)\n`;
            } else if (severityScore >= 5) {
              info += `\n⚠️ HÀNH ĐỘNG CẦN THIẾT (Điểm ${severityScore}/10 - TRUNG BÌNH):\n`;
              info += `   - PHẢI có 2-3 hành động điều trị trong 3 ngày đầu (ngày 1, 2, 3)\n`;
              info += `   - Phun thuốc cách ngày (ngày 1, 3) hoặc 1 lần/ngày trong 2 ngày đầu\n`;
              info += `   - KẾT HỢP: thuốc hóa học + sinh học (mỗi cái là ACTION RIÊNG)\n`;
            } else if (severityScore >= 3) {
              info += `\n✅ HÀNH ĐỘNG CẦN THIẾT (Điểm ${severityScore}/10 - ĐỠ HƠN):\n`;
              info += `   - GIẢM TẦN SUẤT: chỉ phun thuốc 1 lần trong 2-3 ngày đầu (ví dụ: ngày 1 hoặc ngày 2)\n`;
              info += `   - KHÔNG BỎ THUỐC HOÀN TOÀN, chỉ giảm tần suất (từ mỗi ngày → cách ngày → 1 lần/3 ngày)\n`;
              info += `   - Tăng cường phương pháp sinh học và canh tác (mỗi cái là ACTION RIÊNG)\n`;
              info += `   - Ưu tiên sinh học và canh tác, nhưng vẫn cần thuốc để củng cố điều trị\n`;
            } else {
              info += `\n✅ HÀNH ĐỘNG CẦN THIẾT (Điểm ${severityScore}/10 - ĐÃ KHỎI/PHỤC HỒI):\n`;
              info += `   - KHÔNG có hành động điều trị tích cực (KHÔNG phun thuốc)\n`;
              info += `   - CHỈ có 1-2 hành động PHÒNG NGỪA (canh tác hoặc sinh học nhẹ)\n`;
              info += `   - Mỗi phương pháp là ACTION RIÊNG BIỆT\n`;
            }
            info += `\n`;
            
            let hasTreatment = false;
            t.forEach(treatment => {
              if (treatment.type === 'chemical' && treatment.items && treatment.items.length > 0) {
                hasTreatment = true;
                info += `\n💊 THUỐC HÓA HỌC:\n`;
                treatment.items.slice(0, 1).forEach((product) => { // Chỉ lấy 1 thuốc để giảm độ dài
                  info += `${product.name} - ${product.dosage} - ${product.usage}\n`;
                });
              }
              
              if (treatment.type === 'biological' && treatment.items && treatment.items.length > 0) {
                hasTreatment = true;
                info += `\n🌿 SINH HỌC (ACTION RIÊNG):\n`;
                treatment.items.slice(0, 1).forEach((method) => { // Chỉ lấy 1 phương pháp
                  info += `${method.name}: ${method.steps}\n`;
                });
              }
              
              if (treatment.type === 'cultural' && treatment.items && treatment.items.length > 0) {
                hasTreatment = true;
                info += `\n🌾 CANH TÁC (ACTION RIÊNG):\n`;
                treatment.items.slice(0, 2).forEach((practice) => { // Chỉ lấy 2 biện pháp
                  info += `${practice.action}: ${practice.description}\n`;
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
    
    // Build prompt for GPT to generate care strategy (OPTIMIZED - shorter)
    const strategyPrompt = `
Bạn là chuyên gia nông nghiệp. Tạo chiến lược chăm sóc CỤ THỂ cho ĐẦY ĐỦ 7 NGÀY (bắt buộc phải có đủ 7 ngày):

🚨 QUAN TRỌNG: PHẢI tạo đủ 7 ngày trong next7Days array. Mỗi ngày phải có: date, actions (có thể là mảng rỗng nếu không cần), weather.

🌱 CÂY: ${plantBox.plantName}${plantBox.scientificName ? ` (${plantBox.scientificName})` : ''}
${plantBox.plantedDate ? `- Trồng: ${new Date(plantBox.plantedDate).toLocaleDateString('vi-VN')}` : ''}
${plantBox.plantedDate ? (() => {
  const daysSince = Math.floor((new Date().getTime() - new Date(plantBox.plantedDate).getTime()) / (1000 * 60 * 60 * 24))
  const monthsSince = Math.floor(daysSince / 30)
  const isYoung = daysSince < 60 // Less than 2 months = young plant
  return `- Tuổi cây: ${monthsSince} tháng (${isYoung ? 'Cây con - CẨN THẬN với thuốc hóa học' : 'Cây trưởng thành - Có thể dùng thuốc hóa học khi cần'})`
})() : ''}
- Vị trí: ${plantBox.location.name}
${plantBox.location.soilType && plantBox.location.soilType.length > 0 
  ? `- Đất: ${Array.isArray(plantBox.location.soilType) ? plantBox.location.soilType.join(', ') : plantBox.location.soilType}` 
  : ''}
${plantBox.location.sunlight ? `- Ánh sáng: ${plantBox.location.sunlight === 'full' ? 'Đầy đủ' : plantBox.location.sunlight === 'partial' ? 'Một phần' : 'Bóng râm'}` : ''}
${plantBox.location.area ? `- Diện tích: ${plantBox.location.area}m²` : ''}
${plantBox.quantity ? `- Số lượng: ${plantBox.quantity} cây` : ''}
${plantBox.growthStage ? `- Giai đoạn: ${plantBox.growthStage === 'seed' ? 'Hạt giống' : plantBox.growthStage === 'seedling' ? 'Cây con' : plantBox.growthStage === 'vegetative' ? 'Sinh trưởng' : plantBox.growthStage === 'flowering' ? 'Ra hoa' : 'Đậu quả'}` : ''}
${plantBox.currentHealth ? `- Sức khỏe: ${plantBox.currentHealth === 'excellent' ? 'Tuyệt vời' : plantBox.currentHealth === 'good' ? 'Tốt' : plantBox.currentHealth === 'fair' ? 'Bình thường' : 'Yếu'}` : ''}
${plantBox.careLevel ? `- Mức độ chăm sóc: ${plantBox.careLevel === 'low' ? 'Thấp' : plantBox.careLevel === 'medium' ? 'Trung bình' : 'Cao'}` : ''}
${plantBox.wateringMethod ? `- Phương pháp tưới: ${plantBox.wateringMethod === 'manual' ? 'Tưới tay' : plantBox.wateringMethod === 'drip' ? 'Tưới nhỏ giọt' : 'Tưới phun'}` : ''}
${plantBox.fertilizerType ? `- Loại phân bón: ${plantBox.fertilizerType}` : ''}
${plantBox.specialRequirements ? `- Yêu cầu đặc biệt: ${plantBox.specialRequirements}` : ''}
${plantBox.companionPlants && plantBox.companionPlants.length > 0 ? `- Cây trồng kèm: ${plantBox.companionPlants.join(', ')}` : ''}
${fruitingInfo.isFruitingSeason ? `- ⚠️ Đang mùa ra trái` : ''}
${activeDiseases.length > 0 ? `
🦠 BỆNH CẦN ĐIỀU TRỊ:
${activeDiseases.map((disease, i) => {
  const score = disease.severityScore !== undefined && disease.severityScore !== null
    ? disease.severityScore
    : (disease.severity === 'mild' ? 3 : disease.severity === 'moderate' ? 5 : 7);
  return `- ${disease.name} (Điểm: ${score}/10 - ${score <= 2 ? 'Đã khỏi' : score <= 4 ? 'Đỡ hơn' : score <= 6 ? 'Trung bình' : score <= 8 ? 'Nặng' : 'Rất nặng'})`;
}).join('\n')}
${treatmentInfo ? `\n${treatmentInfo}\n` : ''}
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

🌤️ THỜI TIẾT 7 NGÀY TỚI (DỮ LIỆU THỰC TẾ TỪ OPENWEATHER - PHẢI SỬ DỤNG CHÍNH XÁC):
${analyzedWeather.map((day, i) => {
  const w = weather.forecast[i] || {};
  const dateStr = day.date ? new Date(day.date).toLocaleDateString('vi-VN') : 
                  w.date ? new Date(w.date).toLocaleDateString('vi-VN') : 
                  `Ngày ${i + 1}`;
  return `
Ngày ${i + 1} (${dateStr}):
- Nhiệt độ: ${w.temperature?.min ?? 'N/A'}°C - ${w.temperature?.max ?? 'N/A'}°C (${day.temp?.label || 'N/A'})
- Độ ẩm: ${w.humidity ?? 'N/A'}% (${day.humidity?.label || 'N/A'})
- Mưa: ${w.rain ?? 0}mm (${day.rain?.label || 'N/A'})
- Nhu cầu tưới: ${day.wateringNeed.reason}
${day.alerts.length > 0 ? `- Cảnh báo: ${day.alerts.join(', ')}` : ''}`;
}).join('\n')}

🚨 QUAN TRỌNG VỀ THỜI TIẾT:
- PHẢI sử dụng CHÍNH XÁC dữ liệu thời tiết ở trên (từ OpenWeather API)
- KHÔNG được tự bịa ra hoặc thay đổi dữ liệu thời tiết
- Trong JSON response, KHÔNG cần trả về "weather" (hệ thống sẽ tự động dùng dữ liệu thực tế)
- CHỈ cần trả về: date, actions (array)

YÊU CẦU:
${activeDiseases.length > 0 ? `
🚨 ƯU TIÊN: Điều trị bệnh dựa trên ĐIỂM SỐ (xem phần 📊 Điểm số ở trên):
- Điểm 9-10: 4 hành động/4 ngày đầu, phun 2 lần/ngày, kết hợp thuốc+sinh học+canh tác (mỗi cái ACTION RIÊNG)
- Điểm 7-8: 3-4 hành động/4 ngày đầu, phun 1 lần/ngày, kết hợp thuốc+sinh học+canh tác (mỗi cái ACTION RIÊNG)
- Điểm 5-6: 2-3 hành động/3 ngày đầu, phun thuốc cách ngày (ngày 1, 3) hoặc 1 lần/ngày trong 2 ngày đầu, kết hợp thuốc+sinh học (mỗi cái ACTION RIÊNG)
- Điểm 3-4: GIẢM TẦN SUẤT (KHÔNG BỎ THUỐC): chỉ phun thuốc 1 lần trong 2-3 ngày đầu (ví dụ: ngày 1 hoặc ngày 2), tăng cường sinh học+canh tác (mỗi cái ACTION RIÊNG)
- Điểm 0-2: KHÔNG phun thuốc, CHỈ 1-2 hành động phòng ngừa (canh tác/sinh học nhẹ, mỗi cái ACTION RIÊNG)

BẮT BUỘC:
- Sử dụng TÊN THUỐC CỤ THỂ từ DB (ví dụ: "Phun thuốc Amistar® 250SC (10ml/10 lít)" thay vì "Phun thuốc trị bệnh")
- Sinh học và canh tác PHẢI là ACTION RIÊNG, KHÔNG phải trong taskAnalysis của action phun thuốc
- Mỗi action có _id, type, time, description CỤ THỂ, reason dựa trên điểm số và thời tiết
${plantBox.plantedDate ? (() => {
  const daysSince = Math.floor((new Date().getTime() - new Date(plantBox.plantedDate).getTime()) / (1000 * 60 * 60 * 24))
  const isYoung = daysSince < 60
  return isYoung 
    ? `\n⚠️⚠️⚠️ QUAN TRỌNG: Cây con (${Math.floor(daysSince / 30)} tháng tuổi) - KHÔNG được dùng thuốc hóa học mạnh. CHỈ dùng phương pháp sinh học và canh tác.`
    : ''
})() : ''}
` : ''}
- Tưới nước: 
  * PHẢI dựa trên TẦN SUẤT TƯỚI CỤ THỂ cho từng loại cây:
    - Cà chua: 3-7 lần/tuần (thời tiết mát: 2-3 lần/tuần, nắng nóng: 4-7 lần/tuần)
    - Cây con mới trồng (1-2 tuần đầu): tưới nhẹ nhưng đều, thường mỗi ngày hoặc cách ngày
    - Đang ra hoa - đậu quả: cần nước ổn định, thường 3-5 lần/tuần
    - Mẹo: chọc tay xuống đất 2-3 cm — nếu khô thì tưới, nếu ẩm thì chưa cần
  * 🚨 QUY TẮC QUAN TRỌNG:
    - Nếu "Nhu cầu tưới" = "Có mưa, không cần tưới" → KHÔNG tưới
    - Nếu "Nhu cầu tưới" = "Điều kiện bình thường, KHÔNG BẮT BUỘC tưới" → VẪN PHẢI tưới theo tần suất (ví dụ: 3 lần/tuần = ngày 1, 3, 5), nhưng có thể giảm lượng nước
    - Nếu "Nhu cầu tưới" = "Cần tưới nhiều/vừa phải" → Tưới ngay
    - KHÔNG PHẢI tưới mỗi ngày, nhưng PHẢI đảm bảo đủ tần suất (ví dụ: 3 lần/tuần = 3 ngày trong 7 ngày)
  * PHÂN BỐ ĐỀU: Nếu cần tưới 3 lần/tuần, PHẢI tưới đúng 3 lần trong 7 ngày, phân bố đều (ví dụ: ngày 1, 3, 5 hoặc ngày 2, 4, 6)
  * 🚨 LƯU Ý: Độ ẩm cao (80-90%) KHÔNG có nghĩa là không cần tưới. Vẫn phải tưới theo tần suất, chỉ giảm lượng nước. Chỉ KHÔNG tưới khi có mưa lớn (> 5mm)
  * Tưới buổi sáng sớm (07:00-08:00), tránh tưới lên lá (dễ bệnh)
  * Nếu mưa > 5mm trong ngày thì KHÔNG cần tưới
  * ${plantBox.quantity ? `Lưu ý: ${plantBox.quantity} cây - cần đủ nước cho tất cả` : ''}
  * ${plantBox.location.area ? `Diện tích ${plantBox.location.area}m² - tính lượng nước phù hợp` : ''}
  * ${plantBox.wateringMethod ? `Phương pháp ${plantBox.wateringMethod === 'drip' ? 'nhỏ giọt' : plantBox.wateringMethod === 'sprinkler' ? 'phun' : 'tay'} - ${plantBox.wateringMethod === 'drip' ? 'tần suất có thể thấp hơn' : plantBox.wateringMethod === 'sprinkler' ? 'tần suất trung bình' : 'tần suất cao hơn'}` : ''}
- Mỗi hành động: time cụ thể (07:00, 17:00), description CỤ THỂ, reason dựa trên thời tiết/tình trạng
${fruitingInfo.isFruitingSeason ? '- ⚠️ Đang mùa ra trái, cần chăm sóc đặc biệt' : ''}

🚨 QUAN TRỌNG VỀ PHÒNG NGỪA BỆNH NẤM (KHI KHÔNG CÓ BỆNH ACTIVE):
- Khi độ ẩm cao NHƯNG KHÔNG có bệnh active trong currentDiseases: 
  * CHỈ tạo action type="check" với description="Kiểm tra có phát hiện bệnh nấm hay không"
  * KHÔNG được tạo action "Phun thuốc chống nấm" hoặc bất kỳ action phun thuốc nào
  * KHÔNG được hướng dẫn phun thuốc trong taskAnalysis
- CHỈ phun thuốc khi CÓ bệnh nấm đang active (trong currentDiseases với status !== 'resolved')
- Phòng ngừa = kiểm tra (check) + canh tác, KHÔNG phải phun thuốc ngay

🚨🚨🚨 BẮT BUỘC TUYỆT ĐỐI:
- PHẢI tạo ĐẦY ĐỦ 7 NGÀY trong next7Days array
- Mỗi ngày phải có: date (YYYY-MM-DD), actions (array, có thể rỗng)
- KHÔNG cần trả về "weather" trong JSON (hệ thống sẽ tự động dùng dữ liệu thực tế từ OpenWeather)
- Ngày 1-3: Tập trung điều trị nếu có bệnh
- Ngày 4-7: Tiếp tục chăm sóc, phòng ngừa, tưới nước theo thời tiết
- KHÔNG được chỉ tạo 3 ngày đầu rồi dừng lại

Trả lời CHỈ bằng JSON (KHÔNG có markdown, KHÔNG có text thêm):

${plantBox.currentDiseases && plantBox.currentDiseases.length > 0 ? `
VÍ DỤ (PHẢI CÓ ĐỦ 7 NGÀY):
⚠️ LƯU Ý: Trong JSON response, KHÔNG cần trả về "weather" (hệ thống sẽ tự động dùng dữ liệu thực tế từ OpenWeather)
{"next7Days":[
  {"date":"2024-01-15","actions":[{"_id":"a1","type":"protect","time":"07:00","description":"Phun thuốc [Tên thuốc]","reason":"Điều trị bệnh","products":["[Tên thuốc]"]}]},
  {"date":"2024-01-16","actions":[{"_id":"a2","type":"protect","time":"17:00","description":"[Sinh học]","reason":"Kết hợp","products":[]}]},
  {"date":"2024-01-17","actions":[{"_id":"a3","type":"prune","time":"08:00","description":"[Canh tác]","reason":"Phòng ngừa","products":[]}]},
  {"date":"2024-01-18","actions":[{"_id":"a4","type":"water","time":"08:00","description":"Tưới nước","reason":"Cần nước","products":[]}]},
  {"date":"2024-01-19","actions":[]},
  {"date":"2024-01-20","actions":[{"_id":"a5","type":"water","time":"08:00","description":"Tưới nước","reason":"Cần nước","products":[]}]},
  {"date":"2024-01-21","actions":[]}
],"summary":"Tóm tắt..."}
` : `
VÍ DỤ (PHẢI CÓ ĐỦ 7 NGÀY - LƯU Ý TƯỚI NƯỚC):
⚠️ LƯU Ý: Trong JSON response, KHÔNG cần trả về "weather" (hệ thống sẽ tự động dùng dữ liệu thực tế từ OpenWeather)
⚠️ QUAN TRỌNG: Nếu cần tưới 3 lần/tuần, PHẢI có đúng 3 action "water" trong 7 ngày, phân bố đều (ví dụ: ngày 1, 3, 5)
⚠️ KHÔNG được bỏ qua tưới nước chỉ vì độ ẩm cao, chỉ bỏ khi có mưa lớn (> 5mm)
{"next7Days":[
  {"date":"2024-01-15","actions":[{"_id":"a1","type":"water","time":"08:00","description":"Tưới nước vừa phải","reason":"Theo tần suất 3 lần/tuần, ngày 1","products":[]}]},
  {"date":"2024-01-16","actions":[]},
  {"date":"2024-01-17","actions":[{"_id":"a2","type":"water","time":"08:00","description":"Tưới nước vừa phải","reason":"Theo tần suất 3 lần/tuần, ngày 3","products":[]}]},
  {"date":"2024-01-18","actions":[]},
  {"date":"2024-01-19","actions":[{"_id":"a3","type":"water","time":"08:00","description":"Tưới nước vừa phải","reason":"Theo tần suất 3 lần/tuần, ngày 5","products":[]}]},
  {"date":"2024-01-20","actions":[]},
  {"date":"2024-01-21","actions":[]}
],"summary":"Tóm tắt..."}
`}

QUAN TRỌNG:
${plantBox.currentDiseases && plantBox.currentDiseases.length > 0 ? `
BẮT BUỘC:
1. Đưa hành động điều trị vào 2-3 ngày đầu
2. Mỗi action có: _id, type, time, description CỤ THỂ (tên thuốc/phương pháp từ DB), reason, products
3. Sinh học và canh tác là ACTION RIÊNG (không trong taskAnalysis)
4. KHÔNG lặp lại hành động giống nhau
5. Dựa trên điểm số bệnh và thời tiết
` : ''}
- CHỈ đưa ra hành động THỰC SỰ CẦN THIẾT, không đưa ra hành động định kỳ không có lý do
- Nếu một ngày không có hành động nào cần thiết (và không có bệnh), để actions = []
- Phải giải thích LÝ DO CỤ THỂ dựa trên thời tiết, tình trạng bệnh, và phản hồi từ người dùng
- Phải có cảnh báo nếu thời tiết bất lợi
- Khi độ ẩm cao NHƯNG KHÔNG có bệnh: CHỈ "Kiểm tra có phát hiện bệnh nấm hay không" (type="check"), KHÔNG phun thuốc
- CHỈ TRẢ VỀ JSON THUẦN TÚY, KHÔNG CÓ MARKDOWN, KHÔNG CÓ TEXT THÊM
- JSON phải hợp lệ, không có trailing commas, không có comments
- Đảm bảo tất cả strings đều được escape đúng cách

TRẢ LỜI CHỈ BẰNG JSON, KHÔNG CÓ GÌ KHÁC:
`;

    // Log prompt length for debugging
    console.log(`📝 [CareStrategy] Prompt length: ${strategyPrompt.length} characters`);
    
    // Call GPT to generate strategy (with higher max_tokens for longer response)
    let gptResponse;
    try {
      gptResponse = await callGPT({
        messages: [
          {
            role: 'user',
            content: strategyPrompt,
          },
        ],
      context: { weather },
      maxTokens: 3000, // Increased to allow for full 7 days response
      temperature: 0.7,
      });
    } catch (error) {
      console.error('❌ [CareStrategy] Error calling GPT:', error);
      console.error('❌ [CareStrategy] Error details:', error.message);
      if (error.response) {
        console.error('❌ [CareStrategy] Error response:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
    
    // Format response to match generateAIResponse format
    const response = {
      success: true,
      data: {
        message: gptResponse.content,
        role: gptResponse.role,
        meta: gptResponse.meta,
      },
    };

    // Parse JSON response
    let strategyData;
    try {
      let jsonString = response.data.message || response.data || '';
      
      if (!jsonString || typeof jsonString !== 'string') {
        console.error('❌ [generateCareStrategy] Invalid response format:', typeof jsonString);
        throw new Error('Invalid response format from GPT');
      }
      
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
          console.log('✅ [generateCareStrategy] Successfully parsed JSON response');
        } catch (parseError) {
          console.error('❌ [generateCareStrategy] Failed to parse extracted JSON:', parseError);
          console.error('❌ [generateCareStrategy] JSON position:', parseError.message);
          console.error('❌ [generateCareStrategy] Extracted JSON (first 1000 chars):', jsonMatch[0].substring(0, 1000));
          throw parseError;
        }
      } else {
        console.error('❌ [generateCareStrategy] No JSON found in response. Full response (first 500 chars):', jsonString.substring(0, 500));
        throw new Error('No JSON found in response');
      }
      
      // Validate structure
      if (!strategyData || typeof strategyData !== 'object') {
        console.error('❌ [generateCareStrategy] Invalid strategy data type:', typeof strategyData);
        throw new Error('Invalid strategy data type');
      }
      
      if (!strategyData.next7Days || !Array.isArray(strategyData.next7Days)) {
        console.error('❌ [generateCareStrategy] Invalid strategy structure - next7Days missing or not array');
        console.error('❌ [generateCareStrategy] Strategy data:', JSON.stringify(strategyData, null, 2).substring(0, 1000));
        throw new Error('Invalid strategy structure: next7Days must be an array');
      }
      
      console.log(`✅ [generateCareStrategy] Strategy structure validated. Days count: ${strategyData.next7Days.length}`);
      
      // Log each day to see what GPT returned
      strategyData.next7Days.forEach((day, idx) => {
        const actionCount = day.actions ? day.actions.length : 0;
        console.log(`📅 [generateCareStrategy] Day ${idx + 1}: ${actionCount} actions`);
      });
      
      // Validate that we have exactly 7 days
      if (strategyData.next7Days.length < 7) {
        console.warn(`⚠️ [generateCareStrategy] GPT only returned ${strategyData.next7Days.length} days, expected 7. Padding with empty days...`);
        // Pad with empty days if GPT didn't return enough
        while (strategyData.next7Days.length < 7) {
          const dayIndex = strategyData.next7Days.length;
          const date = new Date();
          date.setDate(date.getDate() + dayIndex);
          date.setHours(0, 0, 0, 0);
          const weatherData = weather.forecast[dayIndex] || {};
          strategyData.next7Days.push({
            date: date.toISOString().split('T')[0],
            actions: [],
            weather: {
              temp: weatherData.temperature || { min: 20, max: 30 },
              humidity: weatherData.humidity || 60,
              rain: weatherData.rain || 0,
              alerts: [],
            },
          });
        }
      } else if (strategyData.next7Days.length > 7) {
        console.warn(`⚠️ [generateCareStrategy] GPT returned ${strategyData.next7Days.length} days, expected 7. Truncating to 7...`);
        strategyData.next7Days = strategyData.next7Days.slice(0, 7);
      }

      // Validate that treatment actions exist if plant has ACTIVE diseases
      if (activeDiseases.length > 0) {
        try {
          const hasTreatmentActions = strategyData.next7Days.some(day => 
            day && day.actions && Array.isArray(day.actions) && day.actions.some(action => 
              action && action.type === 'protect' && 
              action.description && 
              (action.description.toLowerCase().includes('thuốc') || 
               action.description.toLowerCase().includes('phun') ||
               action.description.toLowerCase().includes('điều trị') ||
               action.description.toLowerCase().includes('bệnh'))
            )
          );

          if (!hasTreatmentActions) {
            console.warn('⚠️ [generateCareStrategy] No treatment actions found in strategy, but plant has active diseases. Adding treatment actions...');
            
            // Auto-add treatment actions to first 2-3 days
            const treatmentInfo = activeDiseases.map(d => d.name).join(', ');
            for (let i = 0; i < Math.min(3, strategyData.next7Days.length); i++) {
              const day = strategyData.next7Days[i];
              if (!day) continue;
              if (!day.actions) day.actions = [];
              
              // Check if already has treatment action
              const hasTreatment = day.actions.some(a => a && a.type === 'protect');
              if (!hasTreatment) {
                day.actions.unshift({
                  _id: `action_${i}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  type: 'protect',
                  time: '07:00',
                  description: `Phun thuốc trị bệnh ${treatmentInfo}`,
                  reason: `Điều trị bệnh ${treatmentInfo}. Cần sử dụng thuốc đặc trị theo hướng dẫn từ cơ sở dữ liệu.`,
                  products: treatmentInfo.split(', ').map(d => `Thuốc trị ${d}`),
                  completed: false,
                });
              }
            }
          }
        } catch (validationError) {
          console.warn('⚠️ [generateCareStrategy] Error validating treatment actions:', validationError);
          // Continue anyway, don't fail the whole strategy
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

      // ALWAYS use real weather data from OpenWeather, NOT from GPT response
      // GPT should only generate actions, not weather data
      const realWeather = weatherData.temperature ? {
        temp: weatherData.temperature, // Use real temperature from OpenWeather
        humidity: weatherData.humidity || 60,
        rain: weatherData.rain || 0,
        alerts: Array.isArray(dayData.weather?.alerts) ? dayData.weather.alerts : [],
      } : {
        // Fallback only if OpenWeather data is missing
        temp: { min: 20, max: 30 },
        humidity: 60,
        rain: 0,
        alerts: [],
      };

      next7Days.push({
        date,
        actions,
        weather: realWeather,
      });
    }

    // Note: Strategy is saved to database in refreshCareStrategy service function

    return {
      lastUpdated: new Date(),
      next7Days,
      summary: strategyData.summary || 'Chiến lược chăm sóc được tạo tự động dựa trên thời tiết và thông tin cây trồng.',
    };
  } catch (error) {
    console.error('❌ [generateCareStrategy] Error:', error);
    console.error('❌ [generateCareStrategy] Error stack:', error.stack);
    console.error('❌ [generateCareStrategy] Error message:', error.message);
    // Return fallback strategy
    console.log('🔄 [generateCareStrategy] Using fallback strategy');
    try {
      return createFallbackStrategy(plantBox, weather);
    } catch (fallbackError) {
      console.error('❌ [generateCareStrategy] Fallback strategy also failed:', fallbackError);
      throw httpError(500, `Failed to generate care strategy: ${error.message}`);
    }
  }
};

/**
 * Create fallback strategy if GPT fails
 * @param {object} plantBox - Plant box data
 * @param {object} weather - Weather data
 * @returns {object} Basic care strategy
 */
const createFallbackStrategy = (plantBox, weather) => {
  // Filter active diseases (not resolved) based on severity score
  const activeDiseases = (plantBox.currentDiseases || []).filter(disease => {
    const score = disease.severityScore !== undefined && disease.severityScore !== null
      ? disease.severityScore
      : (disease.severity === 'mild' ? 3 : disease.severity === 'moderate' ? 5 : 7);
    return score > 0 && disease.status !== 'resolved';
  });
  
  const next7Days = weather.forecast.slice(0, 7).map((day, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    date.setHours(0, 0, 0, 0);

    const actions = [];

    // PRIORITY: Treatment actions based on severity score
    if (activeDiseases.length > 0) {
      activeDiseases.forEach((disease, dIdx) => {
        const score = disease.severityScore !== undefined && disease.severityScore !== null
          ? disease.severityScore
          : (disease.severity === 'mild' ? 3 : disease.severity === 'moderate' ? 5 : 7);
        
        // Get selected chemical treatment if available
        const selectedChemical = disease.selectedTreatments?.chemical?.[0];
        const productName = selectedChemical?.name || `Thuốc trị ${disease.name}`;
        const dosage = selectedChemical?.dosage || '';
        
        // Determine treatment days based on score
        let shouldTreat = false;
        let treatmentFrequency = 'daily'; // daily, every-other-day, once-per-3days
        if (score >= 9 && index < 4) {
          shouldTreat = true;
          treatmentFrequency = 'twice-daily'; // 2 lần/ngày
        } else if (score >= 7 && index < 4) {
          shouldTreat = true;
          treatmentFrequency = 'daily'; // 1 lần/ngày
        } else if (score >= 5 && index < 3) {
          shouldTreat = true;
          treatmentFrequency = 'every-other-day'; // Cách ngày
        } else if (score >= 3 && index < 3) {
          shouldTreat = true;
          treatmentFrequency = 'once-per-3days'; // 1 lần trong 2-3 ngày đầu (GIẢM TẦN SUẤT, KHÔNG BỎ)
        }
        // score 0-2: no treatment (resolved)
        
        if (shouldTreat && score >= 3) {
          // For score 3-4: GIẢM TẦN SUẤT (chỉ 1 lần trong 2-3 ngày đầu), KHÔNG BỎ THUỐC
          if (score >= 3 && score < 5) {
            // Chỉ phun thuốc 1 lần trong ngày đầu hoặc ngày 2
            if (index === 0 || (index === 1 && selectedChemical)) {
              if (selectedChemical) {
                actions.push({
                  _id: `action_${index}_${dIdx}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  type: 'protect',
                  time: index === 0 ? '07:00' : '17:00',
                  description: `Phun thuốc ${productName}${dosage ? ` (${dosage})` : ''} - Giảm tần suất do bệnh đã đỡ hơn`,
                  reason: `Điều trị bệnh ${disease.name} (điểm ${score}/10 - đỡ hơn). Giảm tần suất sử dụng thuốc, tăng cường phương pháp sinh học và canh tác.`,
                  products: [productName],
                  completed: false,
                });
              }
            }
            // Luôn thêm sinh học và canh tác cho score 3-4
            if (index < 2) {
              actions.push({
                _id: `action_${index}_${dIdx}_bio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'protect',
                time: '17:00',
                description: `Áp dụng phương pháp sinh học để điều trị bệnh ${disease.name}`,
                reason: `Tăng cường phương pháp sinh học do bệnh ${disease.name} đã đỡ hơn (điểm ${score}/10). Kết hợp với thuốc hóa học để củng cố điều trị.`,
                products: [],
                completed: false,
              });
            }
          } else if (score >= 5 && selectedChemical) {
            // Score >= 5: sử dụng thuốc theo tần suất
            const shouldSpray = treatmentFrequency === 'twice-daily' ? true :
                               treatmentFrequency === 'daily' ? true :
                               treatmentFrequency === 'every-other-day' ? (index % 2 === 0) : false;
            
            if (shouldSpray) {
              actions.push({
                _id: `action_${index}_${dIdx}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'protect',
                time: treatmentFrequency === 'twice-daily' && index === 0 ? '07:00' : 
                      treatmentFrequency === 'twice-daily' ? '17:00' :
                      index === 0 ? '07:00' : '17:00',
                description: `Phun thuốc ${productName}${dosage ? ` (${dosage})` : ''}`,
                reason: `Điều trị bệnh ${disease.name} (điểm ${score}/10). Sử dụng ${productName} theo hướng dẫn.`,
                products: [productName],
                completed: false,
              });
            }
            
            // Add biological/cultural as separate actions
            if (index % 2 === 1 || treatmentFrequency === 'twice-daily') {
              actions.push({
                _id: `action_${index}_${dIdx}_bio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'protect',
                time: '17:00',
                description: `Áp dụng phương pháp sinh học để điều trị bệnh ${disease.name}`,
                reason: `Kết hợp phương pháp sinh học với thuốc hóa học để tăng hiệu quả điều trị bệnh ${disease.name} (điểm ${score}/10).`,
                products: [],
                completed: false,
              });
            }
          }
        } else if (score >= 1 && score <= 2 && index < 2) {
          // Prevention only for resolved/almost resolved
          actions.push({
            _id: `action_${index}_${dIdx}_prevent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'prune',
            time: '08:00',
            description: `Biện pháp canh tác phòng ngừa bệnh ${disease.name}`,
            reason: `Bệnh ${disease.name} đã khỏi (điểm ${score}/10). Tập trung phòng ngừa tái phát bằng biện pháp canh tác.`,
            products: [],
            completed: false,
          });
        }
      });
    }

    // Check action for high humidity when no active diseases (prevention, NOT treatment)
    if (activeDiseases.length === 0 && day.humidity >= 80) {
      actions.push({
        _id: `action_${index}_check_fungus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'check',
        time: '08:00',
        description: 'Kiểm tra có phát hiện bệnh nấm hay không',
        reason: `Độ ẩm cao ${day.humidity}%, cần kiểm tra phát hiện sớm bệnh nấm. KHÔNG phun thuốc nếu chưa phát hiện bệnh.`,
        products: [],
        completed: false,
      });
    }

    // Watering based on temperature, rain, and frequency (only if not treating disease on same day)
    // Chỉ tưới khi: mưa < 5mm VÀ (nhiệt độ cao hoặc độ ẩm thấp) VÀ phân bố đều theo tần suất
    const shouldWater = day.rain < 5 && 
                       (day.temperature.max > 30 || day.humidity < 50) &&
                       (!plantBox.currentDiseases || plantBox.currentDiseases.length === 0 || index >= 3);
    
    // Phân bố đều: tưới cách 2-3 ngày (ví dụ: ngày 0, 2, 4 hoặc ngày 1, 3, 5)
    // Tính toán dựa trên index để phân bố đều trong 7 ngày
    const wateringFrequency = 3; // Tưới 3 lần/tuần (có thể điều chỉnh)
    const shouldWaterToday = shouldWater && (index % Math.ceil(7 / wateringFrequency) === 0 || 
                                            (index > 0 && index % Math.ceil(7 / wateringFrequency) === Math.ceil(7 / wateringFrequency) - 1) ||
                                            (index > 2 && index % Math.ceil(7 / wateringFrequency) === Math.ceil(7 / wateringFrequency) - 2));
    
    // Hoặc đơn giản hơn: tưới ngày 0, 2, 4 hoặc ngày 1, 3, 5
    const simpleWateringSchedule = index % 2 === 0 && index < 6; // Tưới ngày 0, 2, 4 (3 lần/tuần)
    
    if (shouldWater && simpleWateringSchedule) {
      const waterAmount = day.temperature.max > 30 ? 'đủ ẩm' : 'vừa phải';
      actions.push({
        _id: `action_${index}_water_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'water',
        time: '08:00',
        description: `Tưới nước ${waterAmount} vào sáng sớm`,
        reason: `Nhiệt độ ${day.temperature.max}°C, độ ẩm ${day.humidity}%, cần bổ sung nước. Phân bố đều theo tần suất 3 lần/tuần.`,
        products: [],
        completed: false,
      });
    }

    // Check action for heavy rain
    if (day.rain > 20) {
      actions.push({
        _id: `action_${index}_check_drainage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

