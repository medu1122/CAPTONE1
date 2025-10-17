import express from 'express';
import { getWeather, getAlerts } from './weather.controller.js';
import { validateWeatherQuery, validateWeatherAlertsQuery } from './weather.validation.js';

const router = express.Router();

/**
 * @route GET /api/v1/weather
 * @desc Get current weather and forecast
 * @access Public
 */
router.get('/', validateWeatherQuery, getWeather);

/**
 * @route GET /api/v1/weather/alerts
 * @desc Get weather alerts for agricultural conditions
 * @access Public
 */
router.get('/alerts', validateWeatherAlertsQuery, getAlerts);

export default router;
