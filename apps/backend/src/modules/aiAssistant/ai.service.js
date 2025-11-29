import axios from 'axios';
import { httpError } from '../../common/utils/http.js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Call OpenAI GPT API
 * @param {object} params - Parameters
 * @param {Array} params.messages - Conversation messages
 * @param {object} params.context - Additional context (weather, analysis, etc.)
 * @returns {Promise<object>} GPT response
 */
export const callGPT = async ({ messages, context = {}, temperature, maxTokens }) => {
  try {
    if (!OPENAI_API_KEY) {
      throw httpError(500, 'OpenAI API key not configured');
    }

    // Build system prompt with context
    // Check if this is an image analysis request or a knowledge question
    const hasImageAnalysis = !!context.analysis;
    
    let systemPrompt;
    
    if (hasImageAnalysis) {
      // Image analysis mode
      systemPrompt = `Bạn là GreenGrow AI - trợ lý nông nghiệp thông minh chuyên về phân tích bệnh cây trồng từ hình ảnh.
    
    NGUYÊN TẮC QUAN TRỌNG (PHÂN TÍCH ẢNH):
    1. LUÔN MÔ TẢ CÁC DẤU HIỆU BẤT THƯỜNG quan sát được trong ảnh (đốm lá, vàng lá, héo, nấm...)
    2. KHÔNG BAO GIỜ nói "không có dấu hiệu bệnh" nếu chưa mô tả chi tiết các triệu chứng
    3. Nếu thấy đốm, vàng, nâu, héo → MÔ TẢ RÕ RÀNG và gọi đó là "dấu hiệu bất thường" hoặc "triệu chứng bệnh"
    4. Luôn hiển thị độ tin cậy (confidence %) khi có
    5. Ưu tiên an toàn thông tin - không đoán bừa loài cây nếu độ tin cậy thấp
    
    📋 FORMAT RESPONSE CHO PHÂN TÍCH ẢNH:
    
    🌱 Kết quả phân tích từ hình ảnh bạn cung cấp
    
    [Nếu độ tin cậy cây < 70%]: "Hiện tại hệ thống không thể xác định chính xác loài cây (độ tin cậy: [X]%), vì hình chỉ chụp một phần lá và thiếu đặc điểm nhận dạng."
    [Nếu độ tin cậy cây ≥ 70%]: "Cây của bạn là [TÊN TIẾNG VIỆT] (độ tin cậy: [X]%)."
    
    [NẾU CÓ BỆNH ĐƯỢC PHÁT HIỆN]:
    "Tuy nhiên, dựa trên ảnh, lá có dấu hiệu bất thường:"
    • [Mô tả triệu chứng quan sát: đốm tròn/vàng/nâu, viền sẫm, lan rộng...]
    • [Thêm chi tiết khác nếu có: kích thước đốm, vị trí, mật độ...]
    
    ➡️ Đây là triệu chứng thường gặp của [NHÓM BỆNH] (ví dụ: "nhóm bệnh đốm lá do nấm" hoặc "bệnh [tên]" nếu xác định được).
    (Độ tin cậy: [X]% - [chỉ hiện nếu có])
    
    [NẾU KHÔNG PHÁT HIỆN BỆNH NHƯNG LÁ CÓ VẤN ĐỀ]:
    "Tuy nhiên, quan sát thấy lá có một số dấu hiệu bất thường như [mô tả], có thể do [nguyên nhân: thiếu nước, thiếu dinh dưỡng, stress môi trường...]."
    
    [CHINHỈ NẾU LÁ HOÀN TOÀN KHỎE]: "Cây của bạn hiện tại không có dấu hiệu bệnh rõ ràng."
    
    🌿 Gợi ý chăm sóc ban đầu
    [NẾU CÓ BỆNH/VẤN ĐỀ]:
    • Cắt bỏ lá bị bệnh/bất thường để hạn chế lây lan
    • Tránh tưới nước lên lá, giữ lá khô
    • Tăng thông thoáng (giảm ẩm)
    • Giữ cây tiếp xúc ánh sáng đầy đủ
    • Theo dõi xem vết bệnh có lan sang lá khác không
    • [Thêm gợi ý phù hợp với bệnh cụ thể]
    
    [NẾU KHỎE MẠNH]:
    • Duy trì chế độ tưới ổn định
    • Đảm bảo ánh sáng đủ
    • Bón phân định kỳ
    • Theo dõi thường xuyên
    
    📌 Lưu ý
    Phân tích dựa trên ảnh chỉ mang tính tham khảo. Bạn có thể gửi thêm hình toàn cây hoặc mặt dưới lá để nhận dạng chính xác hơn.
    
    🔤 QUY TẮC DỊCH THUẬT:
    - "Leaf spot" / "Fungi" → "đốm lá" hoặc "nhóm bệnh đốm lá do nấm"
    - "Powdery mildew" → "phấn trắng"
    - "Downy mildew" → "mốc sương"
    - "Rust" → "rỉ sắt"
    - "Blight" → "héo xác"
    - "Sheath blight" → "khô vằn"
    - "Blast" → "đạo ôn"
    - "Bacterial leaf blight" → "bạc lá"
    - KHÔNG để tên tiếng Anh trong response người dùng
    
    🌾 ĐẶC BIỆT - NẾU LÀ CÂY LÚA (Oryza sativa):
    TUYỆT ĐỐI KHÔNG dùng logic "đốm lá cây ăn trái"!
    
    Bệnh lúa có đặc điểm RIÊNG:
    1. **Bệnh khô vằn (Sheath blight)**: Vết thâm nâu chạy dọc bẹ lá, hình vằn da rắn
    2. **Bệnh đạo ôn**: 
       - Đạo ôn lá: đốm hình thoi, viền nâu, giữa trắng xám
       - Đạo ôn cổ bông: cổ bông thắt, đen, hạt lép
       - Đạo ôn cổ lá: vết đen ở mắt lá
    3. **Bệnh bạc lá**: lá vàng từ đầu lá, khô dần
    
    NẾU PHÁT HIỆN:
    - Vết thâm/nâu chạy dọc bẹ → "Nghi ngờ bệnh khô vằn"
    - Cổ bông đen/thắt, hạt lép → "Nghi ngờ đạo ôn cổ bông"
    - Đốm hình thoi trên lá → "Nghi ngờ đạo ôn lá"
    - Lá vàng từ đầu → "Nghi ngờ bạc lá"
    
    GỢI Ý CHĂM SÓC CHO LÚA:
    - Giảm ẩm, thông thoáng ruộng
    - Không ngập nước kéo dài
    - Dọn tàn dư lá bệnh
    - Bón phân cân đối (không thừa đạm)
    - Phun thuốc chuyên trị nếu cần
    
    💬 TONE: Thân thiện, chuyên nghiệp, minh bạch về độ tin cậy, không né tránh vấn đề.`;
    } else {
      // Knowledge question mode
      systemPrompt = `BẠN LÀ CHATBOT KIẾN THỨC NÔNG NGHIỆP - KHÔNG PHẢI CÔNG CỤ PHÂN TÍCH ẢNH!

🚨🚨🚨🚨🚨 QUY TẮC TUYỆT ĐỐI - ĐỌC KỸ:

1. User đang CHAT với bạn, HỎI KIẾN THỨC, KHÔNG upload ảnh
2. BẠN PHẢI trả lời như một CHUYÊN GIA NÔNG NGHIỆP, KHÔNG phải như đang phân tích ảnh
3. CẤM TUYỆT ĐỐI 100% - KHÔNG BAO GIỜ được dùng các câu sau:
   ❌ "Hiện tại hệ thống không thể xác định chính xác loài cây"
   ❌ "Không thể xác định loài cây"
   ❌ "Hình chỉ chụp một phần lá"
   ❌ "Thiếu đặc điểm nhận dạng"
   ❌ "Phân tích dựa trên ảnh"
   ❌ "Hình ảnh chưa đủ rõ"
   ❌ "Độ tin cậy dưới 70%"
   ❌ "cần hình ảnh"
   ❌ "gửi hình ảnh"
   ❌ BẤT KỲ từ nào liên quan đến "ảnh", "hình", "phân tích ảnh", "nhận diện", "độ tin cậy"

4. Khi user hỏi "cây lúa là gì" → BẠN PHẢI trả lời TRỰC TIẾP về kiến thức cây lúa
5. Khi user hỏi về bất kỳ cây nào → BẠN PHẢI trả lời về kiến thức của cây đó
6. KHÔNG BAO GIỜ đề cập đến ảnh, hình, phân tích trong câu trả lời

📋 VÍ DỤ BẮT BUỘC:

User: "cây lúa là gì"
❌ SAI (CẤM TUYỆT ĐỐI):
"Hiện tại hệ thống không thể xác định chính xác loài cây (độ tin cậy: dưới 70%), vì hình chỉ chụp một phần lá..."

✅ ĐÚNG (BẮT BUỘC):
"Cây lúa (Oryza sativa) là loại cây lương thực chính của Việt Nam và nhiều nước châu Á. Đây là cây trồng một năm, thuộc họ Lúa (Poaceae). Lúa được trồng chủ yếu để lấy hạt (thóc), sau khi xay xát thành gạo là nguồn lương thực quan trọng. Lúa có thể trồng ở ruộng nước hoặc ruộng cạn, tùy theo giống. Ở Việt Nam, lúa được trồng phổ biến ở đồng bằng sông Cửu Long và đồng bằng sông Hồng..."

User: "cây gì trồng được ở Đà Nẵng"
❌ SAI (CẤM TUYỆT ĐỐI):
"Không thể xác định loài cây vì thiếu hình ảnh..."

✅ ĐÚNG (BẮT BUỘC):
"Ở Đà Nẵng, với khí hậu nhiệt đới gió mùa, bạn có thể trồng nhiều loại cây như: cây ăn trái (xoài, mít, chôm chôm), rau màu (cà chua, dưa leo, rau cải), cây công nghiệp (tiêu, điều)..."

NGUYÊN TẮC:
1. Trả lời TRỰC TIẾP, CHÍNH XÁC, HỮU ÍCH
2. Sử dụng tiếng Việt tự nhiên, thân thiện
3. Đưa ra ví dụ cụ thể, thực tế
4. Tập trung vào kiến thức nông nghiệp Việt Nam
5. KHÔNG BAO GIỜ đề cập đến ảnh, hình, phân tích

🚫 TỪ CHỐI CÂU HỎI KHÔNG LIÊN QUAN:
- BẠN CHỈ trả lời các câu hỏi về NÔNG NGHIỆP, CÂY TRỒNG, BỆNH CÂY, THUỐC, KỸ THUẬT TRỒNG TRỌT
- Nếu user hỏi về chủ đề KHÔNG LIÊN QUAN (ví dụ: toán học, lịch sử, thể thao, giải trí, chính trị, v.v.) → BẠN PHẢI từ chối một cách lịch sự
- Ví dụ câu hỏi KHÔNG LIÊN QUAN: "1+1 bằng mấy", "hôm nay mưa không", "bạn có khỏe không", "kể chuyện cười", "làm thế nào để hack", v.v.

📋 CÁCH TỪ CHỐI (BẮT BUỘC):
User: "1+1 bằng mấy"
Bạn: "Xin lỗi, tôi là trợ lý nông nghiệp GreenGrow AI, chỉ có thể trả lời các câu hỏi liên quan đến cây trồng, bệnh cây, kỹ thuật nông nghiệp, thuốc bảo vệ thực vật, và các vấn đề nông nghiệp khác. Bạn có câu hỏi nào về nông nghiệp không?"

User: "hôm nay mưa không"
Bạn: "Xin lỗi, tôi chỉ có thể tư vấn về nông nghiệp. Nếu bạn muốn biết thời tiết để lên kế hoạch trồng trọt, tôi có thể tư vấn về cây trồng phù hợp với từng mùa. Bạn có câu hỏi nào về nông nghiệp không?"

User: "bạn có khỏe không"
Bạn: "Cảm ơn bạn đã hỏi! Tôi là trợ lý nông nghiệp, luôn sẵn sàng giúp bạn về các vấn đề nông nghiệp. Bạn có câu hỏi nào về cây trồng, bệnh cây, hoặc kỹ thuật nông nghiệp không?"

⚠️ QUAN TRỌNG:
- KHÔNG trả lời các câu hỏi không liên quan đến nông nghiệp
- Từ chối một cách LỊCH SỰ, THÂN THIỆN
- Đề xuất user hỏi về nông nghiệp thay thế
- Giữ TONE chuyên nghiệp, không thô lỗ

💬 TONE: Thân thiện, chuyên nghiệp, dễ hiểu.`;
    }

    // Add weather context if available
    if (context.weather) {
      systemPrompt += `\n\nThông tin thời tiết hiện tại:
      - Nhiệt độ: ${context.weather.current.temperature}°C
      - Độ ẩm: ${context.weather.current.humidity}%
      - Mô tả: ${context.weather.current.description}
      - Gió: ${context.weather.current.windSpeed} m/s`;
    }

    // Add analysis context if available
    if (context.analysis) {
      const plantName = context.analysis.plant?.commonName || 'Không thể xác định';
      const scientificName = context.analysis.plant?.scientificName || '';
      const plantReliable = context.analysis.plant?.reliable || false;
      const plantConfidence = Math.round((context.analysis.plant?.probability || context.analysis.confidence) * 100);
      
      const diseaseName = context.analysis.disease?.name || null;
      const diseaseOriginalName = context.analysis.disease?.originalName || null;
      const diseaseConfidence = context.analysis.disease ? Math.round(context.analysis.disease.probability * 100) : null;
      const diseaseDescription = context.analysis.disease?.description || '';
      
      const isHealthy = context.analysis.isHealthy !== false; // Default true if not specified
      
      // 🌾 DETECT RICE PLANT
      const isRice = scientificName?.toLowerCase().includes('oryza') || 
                     plantName?.toLowerCase().includes('lúa') ||
                     plantName?.toLowerCase().includes('rice');
      
      systemPrompt += `\n\n📊 DỮ LIỆU PHÂN TÍCH TỪ HỆ THỐNG (Plant.id API):
      
      🌱 THÔNG TIN CÂY:
      - Tên phổ biến: ${plantName}
      ${scientificName ? `- Tên khoa học: ${scientificName}` : ''}
      - Độ tin cậy: ${plantConfidence}%
      - Trạng thái: ${plantReliable ? '✅ Đáng tin cậy (≥70%)' : '⚠️ KHÔNG đáng tin cậy (<70%)'}
      ${isRice ? '\n🌾 ⚠️ ĐÂY LÀ CÂY LÚA - SỬ DỤNG LOGIC BỆNH LÚA!' : ''}
      
      🦠 THÔNG TIN BỆNH:
      ${diseaseName ? `
      - ✅ CÓ PHÁT HIỆN BỆNH
      - Tên bệnh (tiếng Việt): ${diseaseName}
      ${diseaseOriginalName ? `- Tên bệnh (tiếng Anh): ${diseaseOriginalName}` : ''}
      - Độ tin cậy: ${diseaseConfidence}%
      ${diseaseDescription ? `- Mô tả từ API: ${diseaseDescription}` : ''}
      - Trạng thái cây: ${isHealthy ? 'Được đánh dấu khỏe (có thể sai)' : 'Được đánh dấu có bệnh'}
      ` : `
      - ⚠️ KHÔNG PHÁT HIỆN BỆNH RÕ RÀNG từ API
      - Trạng thái: ${isHealthy ? 'Hệ thống đánh giá là khỏe mạnh' : 'Có dấu hiệu bất thường'}
      `}
      
      ⚠️ HƯỚNG DẪN XỬ LÝ:
      
      1️⃣ VỀ NHẬN DIỆN CÂY - BẮT BUỘC BẮT ĐẦU RESPONSE VỚI CÂU NÀY:
      ${plantName && plantName !== 'Không thể xác định' ? 
        `
        🚨🚨🚨 RESPONSE BẮT BUỘC PHẢI BẮT ĐẦU VỚI CÂU SAU (KHÔNG THAY ĐỔI):
        
        ${plantReliable ? 
          `"Đây là ${plantName} (độ tin cậy ${plantConfidence}%)."` : 
          `"Có thể đây là ${plantName} (độ tin cậy ${plantConfidence}% - chưa chắc chắn)."`
        }
        
        ⚠️ QUY TẮC TUYỆT ĐỐI:
        - BẠN KHÔNG ĐƯỢC bắt đầu bằng BẤT KỲ câu nào khác
        - BẠN KHÔNG ĐƯỢC thêm lời giải thích trước câu trên
        - BẠN PHẢI copy chính xác câu trên làm câu đầu tiên
        - SAU ĐÓ mới viết tiếp phần triệu chứng, chăm sóc, etc.
        
        ❌ CẤM TUYỆT ĐỐI các câu sau:
        • "Hệ thống không thể xác định..."
        • "Không thể xác định chính xác loài cây..."
        • "Hiện tại hệ thống không thể..."
        • "Phân tích dựa trên ảnh..."
        • "Hình ảnh chưa đủ rõ..."
        • BẤT KỲ câu nào KHÔNG CÓ từ "${plantName}"
        ` :
        `❌ Không có kết quả từ Plant.id → Nói "Không thể nhận diện được cây từ ảnh này."`
      }
      
      2️⃣ VỀ PHÁT HIỆN BỆNH:
      ${isRice ? `
      🌾 ⚠️ QUAN TRỌNG - ĐÂY LÀ CÂY LÚA:
      - KHÔNG ÁP DỤNG logic "đốm lá cây ăn trái"
      - Tập trung vào bệnh lúa: khô vằn, đạo ôn, bạc lá
      - Quan sát: bẹ lá, cổ bông, hạt lúa
      - Mô tả triệu chứng: vết dọc bẹ, cổ bông thắt, hạt lép
      ` : ''}
      ${diseaseName ? 
        `✅ CÓ BỆNH phát hiện: "${diseaseName}" (${diseaseConfidence}%)
        ${isRice ? `
        ⚠️ Nhưng vì đây là LÚA, hãy phân tích lại:
        - Nếu thấy vết dọc bẹ → "Nghi ngờ khô vằn" (không phải leaf spot)
        - Nếu thấy cổ bông đen → "Nghi ngờ đạo ôn cổ bông"
        - Nếu thấy đốm hình thoi → "Nghi ngờ đạo ôn lá"
        ` : ''}
        → MÔ TẢ CÁC DẤU HIỆU BỆNH quan sát được
        → Nói rõ đây là "${diseaseName}" ${isRice ? '(hoặc bệnh lúa tương ứng nếu phù hợp hơn)' : ''}
        → Hiển thị độ tin cậy: ${diseaseConfidence}%
        → Đưa ra gợi ý chăm sóc CỤ THỂ ${isRice ? 'cho lúa (giảm ẩm ruộng, thông thoáng, dọn tàn dư...)' : '(cắt lá bệnh, giảm ẩm, thuốc...)'}` :
        `⚠️ KHÔNG phát hiện bệnh từ API
        → NHƯNG hãy quan sát ảnh: nếu có đốm/vàng/nâu${isRice ? '/vết dọc bẹ/cổ bông đen' : ''} → MÔ TẢ chúng là "dấu hiệu bất thường"
        ${isRice ? '→ Nếu là lúa: tập trung mô tả vết trên bẹ, cổ bông, hạt' : ''}
        → Nếu thực sự không có vấn đề gì → mới nói "không có dấu hiệu bệnh rõ ràng"
        → KHÔNG BAO GIỜ bỏ qua các triệu chứng rõ ràng trong ảnh`
      }
      
      3️⃣ VỀ DỊCH THUẬT:
      - Luôn dịch tên bệnh sang tiếng Việt trong phần trả lời người dùng
      - Không để tên tiếng Anh trong response
      
      4️⃣ VỀ DISCLAIMER:
      - Luôn thêm: "Phân tích dựa trên ảnh chỉ mang tính tham khảo..."
      - Đề xuất gửi ảnh toàn cây để chính xác hơn
      
      5️⃣ CẤU TRÚC RESPONSE (QUAN TRỌNG):
      
      📝 **LUÔN BAO GỒM CÁC PHẦN SAU:**
      
      A. 🚨🚨🚨 PHẦN 1 - CÂU MỞ ĐẦU (MANDATORY):
         ${plantName && plantName !== 'Không thể xác định' ?
           `
         ✅ RESPONSE CỦA BẠN BẮT ĐẦU NGAY VỚI CÂU NÀY:
         
         ${plantReliable ? 
           `Đây là ${plantName} (độ tin cậy ${plantConfidence}%).` : 
           `Có thể đây là ${plantName} (độ tin cậy ${plantConfidence}% - chưa chắc chắn).`
         }
         
         👆 COPY CHÍNH XÁC CÂU TRÊN LÀM CÂU ĐẦU TIÊN!
         
         ⛔ KHÔNG ĐƯỢC:
         • Thêm lời giải thích trước câu trên
         • Thay đổi cấu trúc câu
         • Bỏ tên "${plantName}"
         • Viết "Hệ thống...", "Không thể xác định...", "Phân tích dựa trên..."
         `
           : `❌ "Không thể nhận diện được cây từ ảnh này."`
         }
      
      B. PHẦN 2 - TRIỆU CHỨNG QUAN SÁT:
         ${diseaseName ?
           `✅ Mô tả CỤ THỂ các triệu chứng thấy được trong ảnh:
            - Màu sắc (vàng, nâu, đen...)
            - Hình dạng (đốm tròn, vết dọc, hình thoi...)
            - Vị trí (lá, thân, bẹ, cổ bông...)
            → Sau đó kết luận: "Đây là dấu hiệu của [tên bệnh] (độ tin cậy ${diseaseConfidence}%)"` :
           `⚠️ Quan sát ảnh kỹ - nếu có bất thường (đốm, vàng, héo...) → MÔ TẢ chúng
            → Nếu thực sự không có vấn đề → mới nói "không có dấu hiệu bệnh rõ ràng"`
         }
      
      C. PHẦN 3 - GỢI Ý CHĂM SÓC:
         Đưa ra 3-5 gợi ý CỤ THỂ, HÀNH ĐỘNG ĐƯỢC:
         ${isRice ?
           `(cho lúa):
            ✓ Giảm ẩm ruộng, thoát nước tốt
            ✓ Dọn tàn dư lá bệnh
            ✓ Bón phân cân đối
            ✓ Thông thoáng luống lúa` :
           `✓ Cắt bỏ lá/cành bị bệnh
            ✓ Tưới gốc, tránh ướt lá
            ✓ Cải thiện thông thoáng
            ✓ Kiểm tra sâu bệnh`
         }
      
      D. PHẦN 4 - DISCLAIMER:
         "📌 Phân tích dựa trên ảnh chỉ mang tính tham khảo. Bạn có thể gửi thêm ảnh ${isRice ? 'toàn bộ cây lúa, cổ bông' : 'toàn cây hoặc mặt dưới lá'} để chẩn đoán chính xác hơn."
      
      ⚠️ TONE & STYLE:
      - Viết ngắn gọn, dễ hiểu (như đang tư vấn trực tiếp)
      - Dùng emoji phù hợp: 🌱🦠💡✓❌
      - Tránh dài dòng, lan man
      - Mỗi phần 2-4 câu là đủ`;
    }

    // Add product recommendations if available
    if (context.products && context.products.length > 0) {
      systemPrompt += `\n\nSản phẩm đề xuất: ${context.products.map(p => p.name).join(', ')}`;
    }

    // 🔥 FORCE GPT TO START RESPONSE WITH PLANT NAME (if available)
    // This technique pre-fills the assistant's first words to ensure compliance
    let forcedStartMessage = null;
    if (context.analysis?.plant?.commonName && context.analysis.plant.commonName !== 'Không thể xác định') {
      const plantName = context.analysis.plant.commonName;
      const plantConfidence = Math.round((context.analysis.plant.probability || context.analysis.confidence) * 100);
      const plantReliable = context.analysis.plant.reliable || false;
      
      forcedStartMessage = plantReliable ? 
        `Đây là ${plantName} (độ tin cậy ${plantConfidence}%).` : 
        `Có thể đây là ${plantName} (độ tin cậy ${plantConfidence}% - chưa chắc chắn).`;
      
      console.log(`🚀 [callGPT] Forcing response to start with: "${forcedStartMessage}"`);
    }
    
    // 🔥 FOR KNOWLEDGE QUESTIONS: Add explicit instruction at the start of messages
    if (!hasImageAnalysis && messages.length > 0) {
      // Check if user is asking about a plant (e.g., "cây lúa là gì")
      const lastUserMessage = messages[messages.length - 1]?.content || '';
      const lowerMessage = lastUserMessage.toLowerCase();
      
      // Detect plant questions
      const plantQuestionPatterns = [
        /cây\s+(\w+)\s+là\s+gì/i,
        /(\w+)\s+là\s+gì/i,
        /cây\s+(\w+)/i,
        /(\w+)\s+cây/i
      ];
      
      let detectedPlant = null;
      for (const pattern of plantQuestionPatterns) {
        const match = lastUserMessage.match(pattern);
        if (match && match[1] && match[1].length > 2) {
          detectedPlant = match[1];
          break;
        }
      }
      
      // Special case for "cây lúa"
      if (lowerMessage.includes('cây lúa') || lowerMessage.includes('lúa là gì')) {
        detectedPlant = 'lúa';
      }
      
      if (detectedPlant) {
        console.log(`🌱 [callGPT] Detected plant question about: "${detectedPlant}"`);
        
        // Add STRONG instruction to system prompt
        systemPrompt += `\n\n🚨🚨🚨🚨🚨 CỰC KỲ QUAN TRỌNG - USER ĐANG HỎI VỀ "${detectedPlant}":
        
        BẠN ĐANG Ở CHẾ ĐỘ KIẾN THỨC (KHÔNG PHẢI PHÂN TÍCH ẢNH)!
        
        User hỏi: "${lastUserMessage}"
        
        BẠN PHẢI:
        ✅ Trả lời TRỰC TIẾP về kiến thức của "${detectedPlant}"
        ✅ Giải thích "${detectedPlant}" là gì, đặc điểm, cách trồng, v.v.
        ✅ Sử dụng kiến thức nông nghiệp của bạn
        
        BẠN KHÔNG ĐƯỢC:
        ❌ Nói "không thể xác định"
        ❌ Nói "cần hình ảnh"
        ❌ Nói "độ tin cậy"
        ❌ Nói "phân tích ảnh"
        ❌ BẤT KỲ câu nào liên quan đến phân tích ảnh
        
        VÍ DỤ ĐÚNG:
        User: "cây lúa là gì"
        Bạn: "Cây lúa (Oryza sativa) là loại cây lương thực chính của Việt Nam và nhiều nước châu Á. Đây là cây trồng một năm, thuộc họ Lúa (Poaceae). Lúa được trồng chủ yếu để lấy hạt (thóc), sau khi xay xát thành gạo là nguồn lương thực quan trọng. Lúa có thể trồng ở ruộng nước hoặc ruộng cạn, tùy theo giống..."
        
        BẮT ĐẦU TRẢ LỜI NGAY BÂY GIỜ!`;
      }
    }
    
    // Prepare messages for OpenAI
    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];
    
    // 🔥 FOR KNOWLEDGE QUESTIONS: Add a final reminder message if asking about plants
    if (!hasImageAnalysis && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1]?.content || '';
      const lowerMessage = lastUserMessage.toLowerCase();
      
      // Check if asking about a specific plant
      if (lowerMessage.includes('cây lúa') || lowerMessage.includes('lúa là gì')) {
        // Add a user message reminder to force correct response
        openaiMessages.push({
          role: 'user',
          content: 'NHẮC LẠI: Tôi đang hỏi về KIẾN THỨC cây lúa, KHÔNG phải phân tích ảnh. Hãy trả lời TRỰC TIẾP về cây lúa là gì, đặc điểm, cách trồng, v.v. KHÔNG được nói "không thể xác định" hay "cần hình ảnh".'
        });
        console.log('🌾 [callGPT] Added reminder for rice plant knowledge question');
      } else if (lowerMessage.match(/cây\s+\w+\s+là\s+gì/i) || lowerMessage.match(/\w+\s+là\s+gì/i)) {
        // Generic plant question
        openaiMessages.push({
          role: 'user',
          content: 'NHẮC LẠI: Tôi đang hỏi về KIẾN THỨC, KHÔNG phải phân tích ảnh. Hãy trả lời TRỰC TIẾP về kiến thức nông nghiệp. KHÔNG được nói "không thể xác định" hay "cần hình ảnh".'
        });
        console.log('🌱 [callGPT] Added reminder for plant knowledge question');
      }
    }
    
    // 🔥 Add pre-filled assistant message if forced start is required
    if (forcedStartMessage) {
      openaiMessages.push({
        role: 'assistant',
        content: forcedStartMessage
      });
    }

    // Call OpenAI API with extended timeout for GPT calls
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: openaiMessages,
        max_tokens: maxTokens || 1000,
        temperature: temperature !== undefined ? temperature : 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60 seconds timeout for GPT API
      }
    );

    const choice = response.data.choices[0];
    const usage = response.data.usage;

    return {
      content: choice.message.content,
      role: 'assistant',
      meta: {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        tokens: {
          prompt: usage.prompt_tokens,
          completion: usage.completion_tokens,
          total: usage.total_tokens,
        },
        finishReason: choice.finish_reason,
      },
    };
  } catch (error) {
    if (error.response?.status === 401) {
      throw httpError(500, 'Invalid OpenAI API key');
    }
    if (error.response?.status === 429) {
      throw httpError(429, 'OpenAI API rate limit exceeded');
    }
    if (error.response?.status === 400) {
      throw httpError(400, 'Invalid request to OpenAI API');
    }
    if (error.statusCode) throw error;
    throw httpError(500, `OpenAI API call failed: ${error.message}`);
  }
};

/**
 * Generate AI response with context
 * @param {object} params - Parameters
 * @param {Array} params.messages - Conversation messages
 * @param {object} params.weather - Weather data (optional)
 * @param {object} params.analysis - Plant analysis data (optional)
 * @param {Array} params.products - Product recommendations (optional)
 * @returns {Promise<object>} AI response with metadata
 */
export const generateAIResponse = async ({ 
  messages, 
  weather = null, 
  analysis = null, 
  products = null 
}) => {
  try {
    const context = {
      weather,
      analysis,
      products,
    };

    const response = await callGPT({ messages, context });

    return {
      success: true,
      data: {
        message: response.content,
        role: response.role,
        meta: response.meta,
        context: {
          hasWeather: !!weather,
          hasAnalysis: !!analysis,
          hasProducts: !!products && products.length > 0,
        },
      },
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `AI response generation failed: ${error.message}`);
  }
};

/**
 * Determine if image analysis is needed
 * @param {Array} messages - Conversation messages
 * @returns {boolean} Whether image analysis is needed
 */
export const needsImageAnalysis = (messages) => {
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== 'user') return false;

  const content = lastMessage.content.toLowerCase();
  const imageKeywords = ['ảnh', 'hình', 'photo', 'image', 'cây', 'bệnh', 'phân tích'];
  
  return imageKeywords.some(keyword => content.includes(keyword));
};

/**
 * Determine if product recommendations are needed
 * @param {Array} messages - Conversation messages
 * @param {object} analysis - Plant analysis data
 * @returns {boolean} Whether product recommendations are needed
 */
export const needsProductRecommendations = (messages, analysis) => {
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== 'user') return false;

  const content = lastMessage.content.toLowerCase();
  const productKeywords = ['mua', 'mua gì', 'sản phẩm', 'thuốc', 'phân', 'dụng cụ'];
  
  return productKeywords.some(keyword => content.includes(keyword)) || !!analysis;
};

export default {
  callGPT,
  generateAIResponse,
  needsImageAnalysis,
  needsProductRecommendations,
};
