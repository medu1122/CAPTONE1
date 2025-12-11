import { generateAIResponse } from '../aiAssistant/ai.service.js';
import { httpError } from '../../common/utils/http.js';

/**
 * GET /api/v1/analyze/disease-explanation
 * Get GPT explanation for a disease (short, concise)
 */
export const getDiseaseExplanationController = async (req, res, next) => {
  try {
    const { diseaseName, plantName } = req.query;

    if (!diseaseName) {
      return next(httpError(400, 'diseaseName is required'));
    }

    console.log('🤖 [getDiseaseExplanation] Request:', { diseaseName, plantName });

    // Build GPT prompt for SHORT disease explanation
    const prompt = `Bạn là chuyên gia nông nghiệp. Hãy giải thích NGẮN GỌN về bệnh "${diseaseName}"${
      plantName ? ` trên cây ${plantName}` : ''
    }.

YÊU CẦU:
- Giải thích ngắn gọn, dễ hiểu (tối đa 80 từ)
- Nêu triệu chứng chính (1-2 câu)
- Nguyên nhân chính (1 câu)
- Cách phòng ngừa cơ bản (1 câu)

KHÔNG viết dài dòng. Trả lời bằng tiếng Việt, ngắn gọn và thực tế.`;

    const response = await generateAIResponse({
      messages: [{ role: 'user', content: prompt }],
      weather: null,
      analysis: null,
      products: null,
    });

    return res.json({
      success: true,
      data: {
        diseaseName,
        explanation: response.data.message,
      },
    });
  } catch (error) {
    console.error('❌ [getDiseaseExplanation] Error:', error);
    next(error);
  }
};

