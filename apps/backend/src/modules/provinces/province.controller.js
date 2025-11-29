import { getProvinceInfo, getAllProvinces, getProvinceCropRecommendation } from './province.service.js';
import { httpSuccess } from '../../common/utils/http.js';

/**
 * @route GET /api/v1/provinces
 * @desc Get all provinces
 * @access Public
 */
export const getProvinces = async (req, res, next) => {
  try {
    const provinces = await getAllProvinces();
    const { statusCode, body } = httpSuccess(200, 'Success', provinces);
    return res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/v1/provinces/:code/info
 * @desc Get province information (weather, soil, crops, articles)
 * @access Public
 */
export const getProvinceInfoController = async (req, res, next) => {
  try {
    const { code } = req.params;
    const info = await getProvinceInfo(code.toUpperCase());
    const { statusCode, body } = httpSuccess(200, 'Success', info);
    return res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/v1/provinces/:code/recommendation
 * @desc Get AI recommendation for crop planting in current season
 * @access Public
 */
export const getProvinceRecommendationController = async (req, res, next) => {
  try {
    const { code } = req.params;
    const recommendation = await getProvinceCropRecommendation(code.toUpperCase());
    // recommendation is now a structured object, not a string
    const { statusCode, body } = httpSuccess(200, 'Success', recommendation);
    return res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

