import { generateAIResponse } from '../aiAssistant/ai.service.js';
import { httpError } from '../../common/utils/http.js';

/**
 * Generate care strategy for plant box based on weather and plant info
 * @param {object} params - Parameters
 * @param {object} params.plantBox - Plant box data
 * @param {object} params.weather - Weather data (7 days forecast)
 * @returns {Promise<object>} Care strategy for next 7 days
 */
export const generateCareStrategy = async ({ plantBox, weather }) => {
  try {
    // Build prompt for GPT to generate care strategy
    const strategyPrompt = `
Bạn là chuyên gia nông nghiệp. Hãy tạo chiến lược chăm sóc CỤ THỂ cho cây trồng dựa trên thông tin sau:

🌱 THÔNG TIN CÂY:
- Tên: ${plantBox.plantName}${plantBox.scientificName ? ` (${plantBox.scientificName})` : ''}
- Trạng thái: ${plantBox.plantType === 'existing' ? 'Đang trồng' : 'Dự định trồng'}
${plantBox.plantedDate ? `- Ngày trồng: ${new Date(plantBox.plantedDate).toLocaleDateString('vi-VN')}` : ''}
${plantBox.plannedDate ? `- Ngày dự định trồng: ${new Date(plantBox.plannedDate).toLocaleDateString('vi-VN')}` : ''}
- Vị trí: ${plantBox.location.name}
${plantBox.location.soilType ? `- Loại đất: ${plantBox.location.soilType}` : ''}
${plantBox.location.sunlight ? `- Ánh sáng: ${plantBox.location.sunlight}` : ''}
${plantBox.growthStage ? `- Giai đoạn: ${plantBox.growthStage}` : ''}
${plantBox.currentHealth ? `- Sức khỏe: ${plantBox.currentHealth}` : ''}
${plantBox.careLevel ? `- Mức độ chăm sóc: ${plantBox.careLevel}` : ''}
${plantBox.wateringMethod ? `- Phương pháp tưới: ${plantBox.wateringMethod}` : ''}

🌤️ THỜI TIẾT 7 NGÀY TỚI:
${weather.forecast.map((day, i) => `
Ngày ${i + 1} (${new Date(day.date).toLocaleDateString('vi-VN')}):
- Nhiệt độ: ${day.temperature.min}°C - ${day.temperature.max}°C
- Độ ẩm: ${day.humidity}%
- Mưa: ${day.rain}mm
- Mô tả: ${day.description}
`).join('\n')}

YÊU CẦU:
1. Tạo chiến lược chăm sóc CỤ THỂ cho 7 ngày tới
2. Mỗi ngày phải có:
   - Thời gian cụ thể (ví dụ: "08:00", "18:00")
   - Hành động cụ thể (ví dụ: "Tưới 500ml nước", "Bón 10g phân NPK 20-20-20")
   - Lý do (dựa trên thời tiết)
   - Sản phẩm cần dùng (nếu có)
3. Phân tích thời tiết và đưa ra cảnh báo nếu cần
4. Trả lời bằng JSON format sau:

{
  "next7Days": [
    {
      "date": "2024-01-15",
      "actions": [
        {
          "type": "water",
          "time": "08:00",
          "description": "Tưới 500ml nước vào sáng sớm",
          "reason": "Nhiệt độ cao 32°C, độ ẩm thấp 45%, cây cần nhiều nước",
          "products": []
        },
        {
          "type": "check",
          "time": "18:00",
          "description": "Kiểm tra lá và đất",
          "reason": "Cảnh báo mưa lớn ngày mai, cần kiểm tra hệ thống thoát nước",
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

QUAN TRỌNG:
- Phải CỤ THỂ về lượng nước, phân bón, thời gian
- Phải giải thích LÝ DO dựa trên thời tiết
- Phải có cảnh báo nếu thời tiết bất lợi
- CHỈ TRẢ VỀ JSON THUẦN TÚY, KHÔNG CÓ MARKDOWN, KHÔNG CÓ TEXT THÊM
- JSON phải hợp lệ, không có trailing commas, không có comments
- Đảm bảo tất cả strings đều được escape đúng cách
- Mỗi ngày phải có ít nhất 1 action

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

    // Watering based on temperature and rain
    if (day.rain < 5) {
      // No rain or light rain, need watering
      const waterAmount = day.temperature.max > 30 ? '500ml' : '300ml';
      actions.push({
        type: 'water',
        time: '08:00',
        description: `Tưới ${waterAmount} nước vào sáng sớm`,
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

    // Fertilize on day 3 and 6
    if (index === 2 || index === 5) {
      actions.push({
        type: 'fertilize',
        time: '10:00',
        description: 'Bón phân NPK 20-20-20, 10g',
        reason: 'Định kỳ bón phân để cây phát triển tốt',
        products: ['Phân bón NPK 20-20-20'],
      });
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

