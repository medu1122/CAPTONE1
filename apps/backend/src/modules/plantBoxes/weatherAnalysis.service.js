/**
 * Weather Analysis Service
 * Backend quyết định "cao/thấp" từ số thô, GPT chỉ diễn giải
 */

/**
 * Analyze weather conditions and return human-readable labels
 * @param {object} weather - Weather data
 * @param {number} weather.temp - Temperature (min/max)
 * @param {number} weather.humidity - Humidity percentage
 * @param {number} weather.rain - Rainfall in mm
 * @returns {object} Analyzed weather conditions
 */
export const analyzeWeather = (weather) => {
  const { temp, humidity, rain } = weather;
  
  // Temperature analysis (for Vietnam climate)
  let tempLevel = 'normal';
  let tempLabel = '';
  if (temp.max >= 35) {
    tempLevel = 'very_high';
    tempLabel = 'Rất cao';
  } else if (temp.max >= 32) {
    tempLevel = 'high';
    tempLabel = 'Cao';
  } else if (temp.max >= 28) {
    tempLevel = 'warm';
    tempLabel = 'Ấm';
  } else if (temp.max >= 22) {
    tempLevel = 'normal';
    tempLabel = 'Bình thường';
  } else if (temp.max >= 15) {
    tempLevel = 'cool';
    tempLabel = 'Mát';
  } else {
    tempLevel = 'cold';
    tempLabel = 'Lạnh';
  }
  
  // Humidity analysis
  let humidityLevel = 'normal';
  let humidityLabel = '';
  if (humidity >= 85) {
    humidityLevel = 'very_high';
    humidityLabel = 'Rất cao (ẩm ướt)';
  } else if (humidity >= 70) {
    humidityLevel = 'high';
    humidityLabel = 'Cao';
  } else if (humidity >= 50) {
    humidityLevel = 'normal';
    humidityLabel = 'Bình thường';
  } else if (humidity >= 40) {
    humidityLevel = 'low';
    humidityLabel = 'Thấp';
  } else {
    humidityLevel = 'very_low';
    humidityLabel = 'Rất thấp (khô)';
  }
  
  // Rain analysis
  let rainLevel = 'none';
  let rainLabel = '';
  if (rain >= 50) {
    rainLevel = 'heavy';
    rainLabel = 'Mưa lớn';
  } else if (rain >= 20) {
    rainLevel = 'moderate';
    rainLabel = 'Mưa vừa';
  } else if (rain >= 5) {
    rainLevel = 'light';
    rainLabel = 'Mưa nhỏ';
  } else if (rain > 0) {
    rainLevel = 'drizzle';
    rainLabel = 'Mưa phùn';
  } else {
    rainLevel = 'none';
    rainLabel = 'Không mưa';
  }
  
  // Watering need analysis
  let wateringNeed = 'normal';
  let wateringReason = '';
  if (rainLevel === 'heavy' || rainLevel === 'moderate') {
    wateringNeed = 'no';
    wateringReason = 'Có mưa, không cần tưới';
  } else if (tempLevel === 'very_high' || tempLevel === 'high') {
    if (humidityLevel === 'very_low' || humidityLevel === 'low') {
      wateringNeed = 'high';
      wateringReason = 'Nhiệt độ cao và độ ẩm thấp, cần tưới nhiều';
    } else {
      wateringNeed = 'moderate';
      wateringReason = 'Nhiệt độ cao, cần tưới vừa phải';
    }
  } else if (humidityLevel === 'very_low' || humidityLevel === 'low') {
    wateringNeed = 'moderate';
    wateringReason = 'Độ ẩm thấp, cần tưới bổ sung';
  } else {
    wateringNeed = 'normal';
    wateringReason = 'Điều kiện bình thường, KHÔNG BẮT BUỘC tưới (chỉ tưới nếu đất khô hoặc đã 2-3 ngày chưa tưới)';
  }
  
  // Alerts
  const alerts = [];
  if (tempLevel === 'very_high') {
    alerts.push('Cảnh báo nhiệt độ rất cao, cần che phủ và tưới nhiều');
  }
  if (tempLevel === 'cold') {
    alerts.push('Cảnh báo nhiệt độ thấp, cần che phủ bảo vệ');
  }
  if (rainLevel === 'heavy') {
    alerts.push('Cảnh báo mưa lớn, cần kiểm tra hệ thống thoát nước');
  }
  if (humidityLevel === 'very_high') {
    alerts.push('Cảnh báo độ ẩm rất cao, dễ phát sinh bệnh nấm');
  }
  
  return {
    temp: {
      min: temp.min,
      max: temp.max,
      level: tempLevel,
      label: tempLabel,
    },
    humidity: {
      value: humidity,
      level: humidityLevel,
      label: humidityLabel,
    },
    rain: {
      value: rain,
      level: rainLevel,
      label: rainLabel,
    },
    wateringNeed: {
      level: wateringNeed,
      reason: wateringReason,
    },
    alerts,
  };
};

/**
 * Analyze 7-day weather forecast
 * @param {array} forecast - Array of weather data for 7 days
 * @returns {array} Array of analyzed weather conditions
 */
export const analyzeForecast = (forecast) => {
  return forecast.map(day => ({
    date: day.date,
    ...analyzeWeather({
      temp: day.temperature || day.temp,
      humidity: day.humidity,
      rain: day.rain,
    }),
  }));
};

export default {
  analyzeWeather,
  analyzeForecast,
};

