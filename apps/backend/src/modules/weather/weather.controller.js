import { getWeatherData, getWeatherAlerts } from './weather.service.js';
import { httpError } from '../../common/utils/http.js';

/**
 * Get current weather and forecast
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const getWeather = async (req, res) => {
  try {
    const { cityName, lat, lon } = req.query;

    if (!cityName && (!lat || !lon)) {
      throw httpError(400, 'Either cityName or lat/lon coordinates are required');
    }

    const weatherData = await getWeatherData({ cityName, lat, lon });

    res.json({
      success: true,
      data: weatherData,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get weather alerts for agricultural conditions
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const getAlerts = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      throw httpError(400, 'Latitude and longitude are required');
    }

    const alerts = await getWeatherAlerts({ lat, lon });

    res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export default {
  getWeather,
  getAlerts,
};
