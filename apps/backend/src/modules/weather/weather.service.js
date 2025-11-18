import axios from 'axios';
import WeatherData from './weather.model.js';
import { httpError } from '../../common/utils/http.js';

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Get weather data from OpenWeather API
 * @param {object} params - Parameters
 * @param {string} params.cityName - City name (optional)
 * @param {number} params.lat - Latitude (optional)
 * @param {number} params.lon - Longitude (optional)
 * @returns {Promise<object>} Weather data
 */
export const getWeatherData = async ({ cityName, lat, lon }) => {
  try {
    if (!OPENWEATHER_API_KEY) {
      throw httpError(500, 'OpenWeather API key not configured');
    }

    // Check cache first
    const cacheKey = cityName ? { 'location.name': cityName } : { 
      'location.coordinates.lat': lat, 
      'location.coordinates.lon': lon 
    };
    
    const cachedData = await WeatherData.findOne(cacheKey);
    if (cachedData && (Date.now() - cachedData.cachedAt.getTime()) < 3600000) { // 1 hour
      return cachedData;
    }

    // Build API URL
    let apiUrl = `${OPENWEATHER_BASE_URL}/weather`;
    const params = {
      appid: OPENWEATHER_API_KEY,
      units: 'metric',
      lang: 'vi',
    };

    if (cityName) {
      params.q = cityName;
    } else if (lat && lon) {
      params.lat = lat;
      params.lon = lon;
    } else {
      throw httpError(400, 'Either cityName or lat/lon coordinates are required');
    }

    // Get current weather
    const currentResponse = await axios.get(apiUrl, { params });
    const currentData = currentResponse.data;

    // Get forecast (5 days, 3-hour intervals)
    const forecastParams = { ...params };
    delete forecastParams.q; // Remove city name for forecast
    if (cityName) {
      forecastParams.q = cityName;
    }

    const forecastResponse = await axios.get(`${OPENWEATHER_BASE_URL}/forecast`, {
      params: forecastParams
    });
    const forecastData = forecastResponse.data;

    // Group forecast by day (OpenWeather returns 3-hour intervals)
    const dailyForecast = {};
    forecastData.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!dailyForecast[dateKey]) {
        dailyForecast[dateKey] = {
          date: new Date(dateKey),
          temperatures: [],
          humidities: [],
          rains: [],
          descriptions: [],
          icons: [],
        };
      }
      
      dailyForecast[dateKey].temperatures.push(item.main.temp);
      dailyForecast[dateKey].humidities.push(item.main.humidity);
      dailyForecast[dateKey].rains.push(item.rain ? (item.rain['3h'] || 0) : 0);
      dailyForecast[dateKey].descriptions.push(item.weather[0].description);
      dailyForecast[dateKey].icons.push(item.weather[0].icon);
    });

    // Convert to array and calculate daily values
    let forecastArray = Object.values(dailyForecast).map(day => ({
      date: day.date,
      temperature: {
        min: Math.round(Math.min(...day.temperatures)),
        max: Math.round(Math.max(...day.temperatures)),
      },
      humidity: Math.round(day.humidities.reduce((a, b) => a + b, 0) / day.humidities.length),
      description: day.descriptions[Math.floor(day.descriptions.length / 2)], // Use middle description
      icon: day.icons[Math.floor(day.icons.length / 2)], // Use middle icon
      rain: Math.round(day.rains.reduce((a, b) => a + b, 0) * 10) / 10, // Sum rain for the day
    }));

    // Sort by date
    forecastArray.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Ensure we have 7 days (extend if needed)
    while (forecastArray.length < 7) {
      const lastDay = forecastArray[forecastArray.length - 1];
      const nextDate = new Date(lastDay.date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      forecastArray.push({
        date: nextDate,
        temperature: {
          min: lastDay.temperature.min,
          max: lastDay.temperature.max,
        },
        humidity: lastDay.humidity,
        description: lastDay.description,
        icon: lastDay.icon,
        rain: 0, // Default to 0 for extended days
      });
    }

    // Take only first 7 days
    forecastArray = forecastArray.slice(0, 7);

    // Process and format data
    const weatherData = {
      location: {
        name: currentData.name,
        country: currentData.sys.country,
        coordinates: {
          lat: currentData.coord.lat,
          lon: currentData.coord.lon,
        },
      },
      current: {
        temperature: Math.round(currentData.main.temp),
        humidity: currentData.main.humidity,
        pressure: currentData.main.pressure,
        description: currentData.weather[0].description,
        icon: currentData.weather[0].icon,
        windSpeed: currentData.wind.speed,
        windDirection: currentData.wind.deg,
      },
      forecast: forecastArray,
      cachedAt: new Date(),
    };

    // Save to cache
    await WeatherData.findOneAndUpdate(
      cacheKey,
      weatherData,
      { upsert: true, new: true }
    );

    return weatherData;
  } catch (error) {
    console.error('❌ Weather API Error:', error.response?.data || error.message);
    if (error.response?.status === 404) {
      throw httpError(404, 'Location not found');
    }
    if (error.response?.status === 401) {
      throw httpError(500, 'Invalid OpenWeather API key');
    }
    if (error.statusCode) throw error;
    throw httpError(500, `Weather data fetch failed: ${error.message}`);
  }
};

/**
 * Get weather alerts for agricultural conditions
 * @param {object} params - Parameters
 * @param {number} params.lat - Latitude
 * @param {number} params.lon - Longitude
 * @returns {Promise<object>} Weather alerts
 */
export const getWeatherAlerts = async ({ lat, lon }) => {
  try {
    const weatherData = await getWeatherData({ lat, lon });
    const alerts = [];

    const current = weatherData.current;
    const forecast = weatherData.forecast[0];

    // Check for agricultural alerts
    if (forecast.temperature.min < 5) {
      alerts.push({
        type: 'frost_warning',
        severity: 'high',
        message: 'Cảnh báo sương giá: Nhiệt độ có thể xuống dưới 5°C',
        recommendation: 'Che phủ cây trồng hoặc di chuyển vào nhà',
      });
    }

    if (forecast.rain > 20) {
      alerts.push({
        type: 'heavy_rain',
        severity: 'medium',
        message: `Cảnh báo mưa lớn: Dự báo ${forecast.rain}mm`,
        recommendation: 'Kiểm tra hệ thống thoát nước, tránh úng nước',
      });
    }

    if (current.humidity < 30) {
      alerts.push({
        type: 'drought_warning',
        severity: 'medium',
        message: 'Cảnh báo hạn hán: Độ ẩm rất thấp',
        recommendation: 'Tăng cường tưới nước và che phủ đất',
      });
    }

    if (current.windSpeed > 15) {
      alerts.push({
        type: 'strong_wind',
        severity: 'low',
        message: `Cảnh báo gió mạnh: Tốc độ gió ${current.windSpeed} m/s`,
        recommendation: 'Cố định cây trồng, tránh gãy đổ',
      });
    }

    return {
      location: weatherData.location,
      alerts,
      timestamp: new Date(),
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Weather alerts fetch failed: ${error.message}`);
  }
};

export default {
  getWeatherData,
  getWeatherAlerts,
};
