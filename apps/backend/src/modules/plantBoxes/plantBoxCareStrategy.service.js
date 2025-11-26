import { generateAIResponse } from '../aiAssistant/ai.service.js';
import { httpError } from '../../common/utils/http.js';
import { getTreatmentRecommendations } from '../treatments/treatment.service.js';
import { getFruitingSeasonInfo } from './plantFruitingSeason.service.js';

/**
 * Generate care strategy for plant box based on weather and plant info
 * @param {object} params - Parameters
 * @param {object} params.plantBox - Plant box data
 * @param {object} params.weather - Weather data (7 days forecast)
 * @returns {Promise<object>} Care strategy for next 7 days
 */
export const generateCareStrategy = async ({ plantBox, weather }) => {
  try {
    // Get fruiting season information
    const fruitingInfo = getFruitingSeasonInfo({
      plantName: plantBox.plantName,
      plantedDate: plantBox.plantedDate,
      locationName: plantBox.location.name,
      locationCoords: plantBox.location.coordinates,
    });
    
    // Get treatment recommendations if plant has diseases
    let treatmentInfo = '';
    if (plantBox.currentDiseases && plantBox.currentDiseases.length > 0) {
      try {
        const treatments = await Promise.all(
          plantBox.currentDiseases.map(disease => 
            getTreatmentRecommendations(disease.name, plantBox.plantName)
          )
        );
        
        // Format treatment info for prompt - MORE SPECIFIC AND ACTIONABLE
        treatmentInfo = treatments
          .filter(t => t && t.length > 0)
          .map((t, idx) => {
            const disease = plantBox.currentDiseases[idx];
            // Get latest feedback if available
            const latestFeedback = disease.feedback && disease.feedback.length > 0 
              ? disease.feedback[disease.feedback.length - 1] 
              : null;
            
            let info = `\n═══════════════════════════════════════════════════════════\n`;
            info += `📋 THÔNG TIN ĐIỀU TRỊ CHO BỆNH: "${disease.name}"\n`;
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
                info += `\n⚠️⚠️⚠️ HÀNH ĐỘNG CẦN THIẾT (Bệnh tệ hơn):\n`;
                info += `   - TĂNG cường độ điều trị (tăng tần suất phun thuốc)\n`;
                info += `   - Có thể cần kết hợp nhiều phương pháp (thuốc + sinh học)\n`;
                info += `   - Kiểm tra thường xuyên hơn (mỗi ngày)\n`;
                info += `   - Có thể cần đổi thuốc nếu thuốc hiện tại không hiệu quả\n`;
                info += `   - Ưu tiên điều trị trong 3-4 ngày đầu\n`;
              } else if (latestFeedback.status === 'same') {
                info += `\n⚠️ HÀNH ĐỘNG CẦN THIẾT (Bệnh không đổi):\n`;
                info += `   - Tiếp tục điều trị nhưng CẦN XEM XÉT đổi phương pháp\n`;
                info += `   - Có thể thử phương pháp sinh học hoặc biện pháp canh tác\n`;
                info += `   - Kiểm tra xem có cần tăng liều lượng không\n`;
                info += `   - Duy trì điều trị đều đặn\n`;
              } else if (latestFeedback.status === 'better') {
                info += `\n✅ HÀNH ĐỘNG CẦN THIẾT (Bệnh đỡ hơn):\n`;
                info += `   - Tiếp tục điều trị nhưng có thể GIẢM tần suất\n`;
                info += `   - Tập trung vào biện pháp phòng ngừa tái phát\n`;
                info += `   - Có thể chuyển sang phương pháp nhẹ hơn (sinh học thay vì hóa học)\n`;
                info += `   - Vẫn cần theo dõi và điều trị duy trì\n`;
              } else if (latestFeedback.status === 'resolved') {
                info += `\n✅ HÀNH ĐỘNG CẦN THIẾT (Bệnh đã khỏi):\n`;
                info += `   - DỪNG điều trị tích cực\n`;
                info += `   - Chuyển sang biện pháp PHÒNG NGỪA tái phát\n`;
                info += `   - Tập trung vào chăm sóc thường xuyên (tưới nước, bón phân)\n`;
                info += `   - Vẫn cần kiểm tra định kỳ để phát hiện sớm nếu tái phát\n`;
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
                info += `\n🌿 PHƯƠNG PHÁP SINH HỌC (CÓ THỂ KẾT HỢP VỚI THUỐC):\n`;
                treatment.items.slice(0, 2).forEach((method, mIdx) => {
                  info += `\n[PHƯƠNG PHÁP ${mIdx + 1}] ${method.name}\n`;
                  info += `  → Vật liệu cần: ${method.materials}\n`;
                  info += `  → Các bước: ${method.steps}\n`;
                  info += `  → Thời gian: ${method.timeframe}\n`;
                  if (method.effectiveness) {
                    info += `  → Hiệu quả: ${method.effectiveness}\n`;
                  }
                  info += `  → SỬ DỤNG: Có thể thêm hành động áp dụng "${method.name}" với các bước: ${method.steps}\n`;
                });
              }
              
              if (treatment.type === 'cultural' && treatment.items && treatment.items.length > 0) {
                hasTreatment = true;
                info += `\n🌾 BIỆN PHÁP CANH TÁC (BỔ SUNG CHO ĐIỀU TRỊ):\n`;
                treatment.items.slice(0, 3).forEach((practice, cIdx) => {
                  info += `\n[BIỆN PHÁP ${cIdx + 1}] ${practice.action} (Ưu tiên: ${practice.priority})\n`;
                  info += `  → Mô tả: ${practice.description}\n`;
                  info += `  → SỬ DỤNG: Có thể thêm hành động thực hiện "${practice.action}"\n`;
                });
              }
            });
            
            if (!hasTreatment) {
              info += `\n⚠️ Không tìm thấy thông tin điều trị cụ thể trong cơ sở dữ liệu cho bệnh này.\n`;
              info += `   Vui lòng đưa ra hành động điều trị chung dựa trên kinh nghiệm.\n`;
            }
            
            info += `\n═══════════════════════════════════════════════════════════\n`;
            info += `⚠️ LƯU Ý: PHẢI sử dụng thông tin trên để tạo hành động điều trị CỤ THỂ trong chiến lược.\n`;
            info += `   KHÔNG được chỉ nói chung chung như "phun thuốc trị bệnh".\n`;
            info += `   PHẢI ghi rõ tên thuốc/phương pháp và liều lượng từ thông tin trên.\n`;
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
${plantBox.currentDiseases && plantBox.currentDiseases.length > 0 ? `
🦠 BỆNH / VẤN ĐỀ SỨC KHỎE:
${plantBox.currentDiseases.map((disease, i) => `
Bệnh ${i + 1}:
- Tên/Triệu chứng: ${disease.name}
${disease.symptoms ? `- Mô tả: ${disease.symptoms}` : ''}
- Mức độ: ${disease.severity === 'mild' ? 'Nhẹ' : disease.severity === 'moderate' ? 'Trung bình' : 'Nghiêm trọng'}
- Trạng thái: ${disease.status === 'active' ? 'Đang hoạt động' : disease.status === 'treating' ? 'Đang điều trị' : 'Đã khỏi'}
`).join('\n')}
⚠️ QUAN TRỌNG: Chiến lược chăm sóc PHẢI ưu tiên điều trị bệnh này. Bao gồm các hành động cụ thể để xử lý bệnh.
${treatmentInfo ? `\n${treatmentInfo}\n` : ''}
` : ''}
${plantBox.healthNotes ? `- Ghi chú sức khỏe: ${plantBox.healthNotes}` : ''}
${fruitingInfo.message ? `\n🌱 THÔNG TIN MÙA RA TRÁI:\n${fruitingInfo.message}\n` : ''}

🌤️ THỜI TIẾT 7 NGÀY TỚI:
${weather.forecast.map((day, i) => `
Ngày ${i + 1} (${new Date(day.date).toLocaleDateString('vi-VN')}):
- Nhiệt độ: ${day.temperature.min}°C - ${day.temperature.max}°C
- Độ ẩm: ${day.humidity}%
- Mưa: ${day.rain}mm
- Mô tả: ${day.description}
`).join('\n')}

YÊU CẦU:
${plantBox.currentDiseases && plantBox.currentDiseases.length > 0 ? `
🚨🚨🚨 YÊU CẦU ĐẦU TIÊN VÀ QUAN TRỌNG NHẤT:
Cây đang có bệnh: ${plantBox.currentDiseases.map(d => d.name).join(', ')} - Mức độ: ${plantBox.currentDiseases.map(d => d.severity === 'mild' ? 'Nhẹ' : d.severity === 'moderate' ? 'Trung bình' : 'Nghiêm trọng').join(', ')}

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
- Nếu có phương pháp sinh học, thêm hành động áp dụng phương pháp đó
- Nếu có biện pháp canh tác, thêm hành động thực hiện biện pháp đó
- KHÔNG được bỏ qua hoặc chỉ nói chung chung về điều trị bệnh
` : ''}
3. Mỗi ngày chỉ cần có các hành động THỰC SỰ CẦN THIẾT:
   - ${plantBox.currentDiseases && plantBox.currentDiseases.length > 0 ? `
   ⚠️ ĐIỀU CHỈNH SỐ LƯỢNG HÀNH ĐỘNG ĐIỀU TRỊ DỰA TRÊN PHẢN HỒI:
     * Nếu phản hồi "TỆ HƠN": PHẢI có 3-4 hành động điều trị trong tuần đầu (ngày 1-4), tăng tần suất
     * Nếu phản hồi "KHÔNG ĐỔI": PHẢI có 2-3 hành động điều trị (ngày 1-3), xem xét đổi phương pháp
     * Nếu phản hồi "ĐỠ HƠN": Có 1-2 hành động điều trị (ngày 1-2), giảm tần suất, chuyển sang phòng ngừa
     * Nếu phản hồi "ĐÃ KHỎI": KHÔNG cần hành động điều trị tích cực, chỉ cần 1-2 hành động phòng ngừa
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

      // Validate that treatment actions exist if plant has diseases
      if (plantBox.currentDiseases && plantBox.currentDiseases.length > 0) {
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
          console.warn('⚠️ [CareStrategy] No treatment actions found in strategy, but plant has diseases. Adding treatment actions...');
          
          // Auto-add treatment actions to first 2-3 days
          const treatmentInfo = plantBox.currentDiseases.map(d => d.name).join(', ');
          for (let i = 0; i < Math.min(3, strategyData.next7Days.length); i++) {
            const day = strategyData.next7Days[i];
            if (!day.actions) day.actions = [];
            
            // Check if already has treatment action
            const hasTreatment = day.actions.some(a => a.type === 'protect');
            if (!hasTreatment) {
              day.actions.unshift({
                type: 'protect',
                time: '07:00',
                description: `Phun thuốc trị bệnh ${treatmentInfo}`,
                reason: `Điều trị bệnh ${treatmentInfo}. Cần sử dụng thuốc đặc trị theo hướng dẫn từ cơ sở dữ liệu (xem phần 📋 ĐIỀU TRỊ CHO... ở trên).`,
                products: treatmentInfo.split(', ').map(d => `Thuốc trị ${d}`)
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

      next7Days.push({
        date,
        actions: Array.isArray(dayData.actions) ? dayData.actions : [],
        weather: {
          temp: dayData.weather?.temp || weatherData.temperature || { min: 20, max: 30 },
          humidity: dayData.weather?.humidity ?? weatherData.humidity ?? 60,
          rain: dayData.weather?.rain ?? weatherData.rain ?? 0,
          alerts: Array.isArray(dayData.weather?.alerts) ? dayData.weather.alerts : [],
        },
      });
    }

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
  const next7Days = weather.forecast.slice(0, 7).map((day, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    date.setHours(0, 0, 0, 0);

    const actions = [];

    // PRIORITY: Treatment actions if plant has diseases
    if (plantBox.currentDiseases && plantBox.currentDiseases.length > 0 && index < 3) {
      // Add treatment action for first 3 days
      const diseaseNames = plantBox.currentDiseases.map(d => d.name).join(', ');
      const severity = plantBox.currentDiseases[0].severity || 'moderate';
      const severityText = severity === 'mild' ? 'nhẹ' : severity === 'moderate' ? 'trung bình' : 'nghiêm trọng';
      
      actions.push({
        type: 'protect',
        time: index === 0 ? '07:00' : '17:00', // Alternate morning/evening
        description: `Phun thuốc trị bệnh ${diseaseNames}`,
        reason: `Điều trị bệnh ${diseaseNames} mức độ ${severityText}. Cần sử dụng thuốc đặc trị theo hướng dẫn từ cơ sở dữ liệu.`,
        products: plantBox.currentDiseases.map(d => `Thuốc trị ${d.name}`),
      });
    }

    // Watering based on temperature and rain (only if not treating disease on same day)
    if (day.rain < 5 && (!plantBox.currentDiseases || plantBox.currentDiseases.length === 0 || index >= 3)) {
      // No rain or light rain, need watering
      const waterAmount = day.temperature.max > 30 ? 'đủ ẩm' : 'vừa phải';
      actions.push({
        type: 'water',
        time: '08:00',
        description: `Tưới nước ${waterAmount} vào sáng sớm`,
        reason: `Nhiệt độ cao ${day.temperature.max}°C, độ ẩm ${day.humidity}%, cần bổ sung nước`,
        products: [],
      });
    }

    // Check action
    if (day.rain > 20) {
      actions.push({
        type: 'check',
        time: '18:00',
        description: 'Kiểm tra hệ thống thoát nước',
        reason: `Mưa lớn dự báo ${day.rain}mm, cần kiểm tra tránh úng nước`,
        products: [],
      });
    }

    // DON'T add generic fertilize actions if plant has diseases (focus on treatment)
    if (!plantBox.currentDiseases || plantBox.currentDiseases.length === 0) {
      // Only fertilize if no diseases, and only on day 3 and 6
      if (index === 2 || index === 5) {
        actions.push({
          type: 'fertilize',
          time: '10:00',
          description: 'Bón phân NPK 20-20-20, 10g',
          reason: 'Định kỳ bón phân để cây phát triển tốt',
          products: ['Phân bón NPK 20-20-20'],
        });
      }
    }

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

