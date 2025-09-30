const axios = require('../../common/libs/axios');
const Alert = require('./alert.model');
const { httpError } = require('../../common/utils/http');

/**
 * Get weather data from OpenWeather API
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {object} Weather data
 */
const getWeatherData = async (lat, lon) => {
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/onecall`,
      {
        params: {
          lat,
          lon,
          exclude: 'minutely,hourly',
          units: 'metric',
          appid: process.env.OPENWEATHER_API_KEY,
        },
      }
    );
    
    return response.data;
  } catch (error) {
    throw httpError(500, `Weather data fetch failed: ${error.message}`);
  }
};

/**
 * Send SMS via Viettel SMS API
 * @param {string} phone - Phone number
 * @param {string} message - SMS message
 * @returns {object} SMS send result
 */
const sendSMS = async (phone, message) => {
  try {
    const response = await axios.post(
      process.env.VIETTEL_SMS_API_URL,
      {
        phone,
        message,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.VIETTEL_SMS_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data;
  } catch (error) {
    throw httpError(500, `SMS sending failed: ${error.message}`);
  }
};

/**
 * Check weather conditions and send alerts
 * @param {object} alert - Alert document
 * @returns {boolean} Whether alert was sent
 */
const processWeatherAlert = async (alert) => {
  try {
    const [lon, lat] = alert.location.coordinates;
    const weatherData = await getWeatherData(lat, lon);
    
    // Check for weather alerts
    const alerts = [];
    
    // Current weather conditions
    const current = weatherData.current;
    const forecast = weatherData.daily[0];
    
    // Check for extreme weather conditions
    if (alert.alertTypes.frost && forecast.temp.min < 0) {
      alerts.push('Frost warning: Temperature will drop below 0°C');
    }
    
    if (alert.alertTypes.heavyRain && forecast.rain > 20) {
      alerts.push(`Heavy rain warning: ${forecast.rain}mm expected`);
    }
    
    if (alert.alertTypes.drought && forecast.humidity < 30) {
      alerts.push('Drought warning: Very low humidity expected');
    }
    
    // Send SMS if there are alerts
    if (alerts.length > 0) {
      const message = `GreenGrow Weather Alert:\n${alerts.join('\n')}`;
      await sendSMS(alert.phone, message);
      
      // Update last sent timestamp
      alert.lastSent = new Date();
      await alert.save();
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing alert for ${alert._id}: ${error.message}`);
    return false;
  }
};

/**
 * Process all active alerts
 * @returns {number} Number of alerts sent
 */
const processAllAlerts = async () => {
  try {
    // Get all active alerts
    const alerts = await Alert.find({ active: true });
    let sentCount = 0;
    
    // Process each alert
    for (const alert of alerts) {
      const sent = await processWeatherAlert(alert);
      if (sent) {
        sentCount++;
      }
    }
    
    return sentCount;
  } catch (error) {
    throw httpError(500, `Alert processing failed: ${error.message}`);
  }
};

module.exports = {
  getWeatherData,
  sendSMS,
  processWeatherAlert,
  processAllAlerts,
};
