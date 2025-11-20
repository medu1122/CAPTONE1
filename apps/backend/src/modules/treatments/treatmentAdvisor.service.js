import { generateAIResponse } from '../aiAssistant/ai.service.js';

/**
 * Generate AI-powered treatment advice based on available treatments
 * @param {object} params - Parameters
 * @param {string} params.diseaseName - Vietnamese disease name
 * @param {number} params.diseaseConfidence - Disease confidence (0-1)
 * @param {string} params.plantName - Vietnamese plant name
 * @param {object} params.treatments - Available treatments { chemical, biological, cultural }
 * @returns {Promise<string>} AI-generated treatment advice in markdown
 */
export const generateTreatmentAdvice = async ({
  diseaseName,
  diseaseConfidence,
  plantName,
  treatments
}) => {
  try {
    console.log(`🤖 [AI Advisor] Generating advice for: ${diseaseName} on ${plantName}`);
    
    // Build treatment data string
    const chemicalList = treatments.chemical?.length > 0
      ? treatments.chemical.map((p, i) => {
          if (typeof p === 'string') return `${i+1}. ${p}`;
          return `${i+1}. ${p.name}${p.activeIngredient ? ` (Hoạt chất: ${p.activeIngredient})` : ''}`;
        }).join('\n')
      : 'Không có dữ liệu';
    
    const biologicalList = treatments.biological?.length > 0
      ? treatments.biological.map((b, i) => `${i+1}. ${typeof b === 'string' ? b : b.name}`).join('\n')
      : 'Không có dữ liệu';
    
    const culturalList = treatments.cultural?.length > 0
      ? treatments.cultural.map((c, i) => `${i+1}. ${typeof c === 'string' ? c : c.description}`).join('\n')
      : 'Không có dữ liệu';

    const confidencePercent = Math.round(diseaseConfidence * 100);
    const severity = diseaseConfidence > 0.6 ? 'NẶNG' : diseaseConfidence > 0.4 ? 'TRUNG BÌNH' : 'NHẸ';

    const prompt = `Bạn là chuyên gia bảo vệ thực vật Việt Nam. Nhiệm vụ: Đưa ra LỜI KHUYÊN CỤ THỂ, THIẾT THỰC cho nông dân.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 THÔNG TIN BỆNH CÂY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌱 Cây trồng: ${plantName}
🦠 Bệnh: ${diseaseName}
📊 Mức độ tin cậy: ${confidencePercent}% (Đánh giá: ${severity})

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 THUỐC HÓA HỌC CÓ SẴN (${treatments.chemical?.length || 0} sản phẩm)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${chemicalList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌿 PHƯƠNG PHÁP SINH HỌC (${treatments.biological?.length || 0} phương pháp)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${biologicalList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌾 BIỆN PHÁP CANH TÁC (${treatments.cultural?.length || 0} kỹ thuật)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${culturalList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 YÊU CẦU PHÂN TÍCH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ĐÁNH GIÁ MỨC ĐỘ:
   - Dựa vào confidence ${confidencePercent}%, đánh giá mức độ nghiêm trọng
   - Nếu ${severity}, khuyên nên xử lý như thế nào?

2. PHƯƠNG ÁN ĐIỀU TRỊ CỤ THỂ:
   
   ${diseaseConfidence > 0.6 ? `
   ⚠️ BỆNH NẶNG (>${60}%) → Ưu tiên Hóa Học + Sinh Học + Canh Tác
   
   A) GIAI ĐOẠN 1 (3-7 ngày đầu): Thuốc Hóa Học
      - Chọn 1 SẢN PHẨM TỐT NHẤT từ danh sách trên
      - Giải thích TẠI SAO chọn sản phẩm đó
      - Hướng dẫn liều lượng CỤ THỂ (ml/ha, ml/bình xịt)
      - Cách pha (bao nhiêu ml thuốc + bao nhiêu lít nước)
      - Tần suất xịt (mỗi mấy ngày, tổng mấy lần)
      - Thời điểm tốt nhất (sáng/chiều, trước/sau mưa)
   
   B) GIAI ĐOẠN 2 (sau 7-14 ngày): Phương Pháp Sinh Học
      - Chọn phương pháp phù hợp
      - Cách sử dụng cụ thể
   
   C) DUY TRÌ LÂU DÀI: Biện Pháp Canh Tác
      - Liệt kê 2-3 biện pháp QUAN TRỌNG NHẤT
      - Giải thích cách thực hiện
   ` : diseaseConfidence > 0.4 ? `
   ℹ️ BỆNH TRUNG BÌNH (40-60%) → Ưu tiên Sinh Học + Canh Tác, Hóa Học nếu cần
   
   A) ƯU TIÊN: Phương Pháp Sinh Học
      - Chọn phương pháp tốt nhất
      - Hướng dẫn cụ thể
   
   B) DỰ PHÒNG: Biện Pháp Canh Tác
      - 2-3 biện pháp quan trọng
   
   C) DỰ PHÒNG: Thuốc Hóa Học (nếu sinh học không hiệu quả sau 7-10 ngày)
   ` : `
   ✅ BỆNH NHẸ (<40%) → Ưu tiên Canh Tác + Sinh Học
   
   A) ƯU TIÊN: Biện Pháp Canh Tác
      - 3 biện pháp quan trọng nhất
   
   B) HỖ TRỢ: Phương Pháp Sinh Học
      - Để tăng cường sức đề kháng
   `}

3. LƯU Ý AN TOÀN:
   - Thiết bị bảo hộ (nếu dùng hóa học)
   - Thời gian cách ly trước thu hoạch
   - Điều kiện thời tiết phù hợp

4. TỔNG KẾT & LỘ TRÌNH:
   - Tóm tắt lộ trình điều trị theo timeline
   - Dấu hiệu để biết có hiệu quả không

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ QUY TẮC QUAN TRỌNG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ CHỈ khuyên dùng sản phẩm/kỹ thuật CÓ TRONG DANH SÁCH
✅ Đưa ra số liệu CỤ THỂ (ml, kg, ngày, lần)
✅ Giải thích TẠI SAO chọn phương pháp đó
✅ Viết ngắn gọn, dễ hiểu, thực tế
✅ Nếu KHÔNG CÓ DATA → Nói rõ "Chưa có thông tin cụ thể"

❌ KHÔNG bịa thêm thuốc/kỹ thuật không có trong danh sách
❌ KHÔNG viết chung chung kiểu "nên xịt thuốc thích hợp"
❌ KHÔNG dài dòng, đi thẳng vào vấn đề

FORMAT OUTPUT: Viết bằng Markdown, có emoji, rõ ràng, dễ đọc.`;

    const response = await generateAIResponse({
      messages: [{ role: 'user', content: prompt }],
      weather: null,
      analysis: null,
      products: null
    });

    const advice = response.data.message.trim();
    console.log(`✅ [AI Advisor] Generated ${advice.length} chars of advice`);
    
    return advice;
  } catch (error) {
    console.error('❌ [AI Advisor] Failed to generate advice:', error);
    // Fallback to basic summary
    return `### 📋 Phương án điều trị cho bệnh ${diseaseName}

**Mức độ:** ${Math.round(diseaseConfidence * 100)}%

Hệ thống tìm thấy:
- 📦 ${treatments.chemical?.length || 0} thuốc hóa học
- 🌿 ${treatments.biological?.length || 0} phương pháp sinh học
- 🌾 ${treatments.cultural?.length || 0} biện pháp canh tác

_Vui lòng xem chi tiết ở các mục bên dưới._`;
  }
};

