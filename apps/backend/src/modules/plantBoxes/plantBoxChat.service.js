import { generateAIResponse } from '../aiAssistant/ai.service.js';
import { httpError } from '../../common/utils/http.js';

/**
 * Generate chat response for plant box mini chat
 * Context: Plant info + Weather + Care strategy
 * @param {object} params - Parameters
 * @param {string} params.userMessage - User's question
 * @param {object} params.plantBox - Plant box data
 * @param {object} params.weather - Weather data (7 days)
 * @param {object} params.careStrategy - Care strategy
 * @returns {Promise<object>} AI response
 */
export const generatePlantBoxChatResponse = async ({
  userMessage,
  plantBox,
  weather,
  careStrategy,
}) => {
  try {
    // Build comprehensive system prompt with all context
    const systemPrompt = `
Bạn là trợ lý chăm sóc cây trồng chuyên nghiệp cho cây "${plantBox.name}".

📋 THÔNG TIN CÂY:
- Tên: ${plantBox.plantName}${plantBox.scientificName ? ` (${plantBox.scientificName})` : ''}
- Trạng thái: ${plantBox.plantType === 'existing' ? 'Đang trồng' : 'Dự định trồng'}
${plantBox.plantedDate ? `- Ngày trồng: ${new Date(plantBox.plantedDate).toLocaleDateString('vi-VN')}` : ''}
${plantBox.plannedDate ? `- Ngày dự định trồng: ${new Date(plantBox.plannedDate).toLocaleDateString('vi-VN')}` : ''}
${plantBox.expectedHarvestDate ? `- Ngày dự kiến thu hoạch: ${new Date(plantBox.expectedHarvestDate).toLocaleDateString('vi-VN')}` : ''}
- Vị trí: ${plantBox.location.name}
${plantBox.location.area ? `- Diện tích: ${plantBox.location.area}m²` : ''}
${plantBox.location.soilType ? `- Loại đất: ${plantBox.location.soilType}` : ''}
${plantBox.location.sunlight ? `- Ánh sáng: ${plantBox.location.sunlight}` : ''}
${plantBox.quantity ? `- Số lượng: ${plantBox.quantity} cây` : ''}
${plantBox.growthStage ? `- Giai đoạn: ${plantBox.growthStage}` : ''}
${plantBox.currentHealth ? `- Sức khỏe: ${plantBox.currentHealth}` : ''}
${plantBox.careLevel ? `- Mức độ chăm sóc: ${plantBox.careLevel}` : ''}
${plantBox.wateringMethod ? `- Phương pháp tưới: ${plantBox.wateringMethod}` : ''}
${plantBox.fertilizerType ? `- Loại phân bón: ${plantBox.fertilizerType}` : ''}

🌤️ THỜI TIẾT 7 NGÀY TỚI:
${weather.forecast.map((day, i) => `
  Ngày ${i + 1} (${new Date(day.date).toLocaleDateString('vi-VN')}):
  - Nhiệt độ: ${day.temperature.min}°C - ${day.temperature.max}°C
  - Độ ẩm: ${day.humidity}%
  - Mưa: ${day.rain}mm
  - Mô tả: ${day.description}
`).join('\n')}

📅 CHIẾN LƯỢC CHĂM SÓC (7 ngày tới):
${careStrategy?.next7Days?.map((day, i) => `
  Ngày ${i + 1} (${new Date(day.date).toLocaleDateString('vi-VN')}):
  ${day.actions?.map(action => `  - ${action.time}: ${action.description} (${action.reason})`).join('\n') || '  - Không có hành động'}
  - Thời tiết: ${day.weather?.temp?.min}°C - ${day.weather?.temp?.max}°C, độ ẩm ${day.weather?.humidity}%, mưa ${day.weather?.rain}mm
  ${day.weather?.alerts?.length > 0 ? `  - Cảnh báo: ${day.weather.alerts.join(', ')}` : ''}
`).join('\n') || 'Chưa có chiến lược'}

💡 TÓM TẮT: ${careStrategy?.summary || 'Chưa có tóm tắt'}

YÊU CẦU TRẢ LỜI:
- Trả lời NGẮN GỌN, CỤ THỂ (tối đa 150 từ)
- Dựa vào thông tin trên để trả lời chính xác
- Nếu hỏi về lý do, giải thích dựa trên thời tiết/chiến lược
- Nếu hỏi về hành động, tham khảo chiến lược chăm sóc
- Luôn trả lời bằng tiếng Việt, thân thiện
- Không cần nhắc lại câu hỏi của user
`;

    // Only send current message (no history)
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ];

    const response = await generateAIResponse({
      messages,
      weather: weather,
    });

    return {
      success: true,
      data: {
        message: response.data.message,
      },
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to generate chat response: ${error.message}`);
  }
};

export default {
  generatePlantBoxChatResponse,
};

