/**
 * Service to determine fruiting/harvest season for plants
 * Based on plant name, planting date, and location
 */

/**
 * Get fruiting season information for a plant
 * @param {object} params - Parameters
 * @param {string} params.plantName - Plant name
 * @param {Date} params.plantedDate - Planting date
 * @param {string} params.locationName - Location name (province/city)
 * @param {object} params.locationCoords - Location coordinates {lat, lon}
 * @returns {object} Fruiting season information
 */
export const getFruitingSeasonInfo = ({ plantName, plantedDate, locationName, locationCoords }) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();
    
    // Calculate days since planting
    let daysSincePlanting = 0;
    if (plantedDate) {
      const planted = new Date(plantedDate);
      daysSincePlanting = Math.floor((now - planted) / (1000 * 60 * 60 * 24));
    }
    
    // Normalize plant name for matching
    const normalizedName = plantName.toLowerCase().trim();
    
    // Fruiting season database (Vietnam-specific)
    // Format: { plantName: { months: [1,2,3], duration: 90, region: 'north'|'south'|'all' } }
    const fruitingSeasons = {
      // Vegetables
      'cà chua': { months: [1, 2, 3, 4, 9, 10, 11, 12], duration: 60, region: 'all' },
      'ca chua': { months: [1, 2, 3, 4, 9, 10, 11, 12], duration: 60, region: 'all' },
      'dưa chuột': { months: [1, 2, 3, 4, 9, 10, 11, 12], duration: 45, region: 'all' },
      'dua chuot': { months: [1, 2, 3, 4, 9, 10, 11, 12], duration: 45, region: 'all' },
      'ớt': { months: [1, 2, 3, 4, 5, 9, 10, 11, 12], duration: 90, region: 'all' },
      'ot': { months: [1, 2, 3, 4, 5, 9, 10, 11, 12], duration: 90, region: 'all' },
      'cà tím': { months: [1, 2, 3, 4, 9, 10, 11, 12], duration: 60, region: 'all' },
      'ca tim': { months: [1, 2, 3, 4, 9, 10, 11, 12], duration: 60, region: 'all' },
      'đậu bắp': { months: [2, 3, 4, 5, 6, 7, 8, 9], duration: 50, region: 'all' },
      'dau bap': { months: [2, 3, 4, 5, 6, 7, 8, 9], duration: 50, region: 'all' },
      
      // Fruits
      'chuối': { months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], duration: 120, region: 'all' },
      'chuoi': { months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], duration: 120, region: 'all' },
      'cam': { months: [10, 11, 12, 1, 2], duration: 90, region: 'all' },
      'quýt': { months: [10, 11, 12, 1, 2], duration: 90, region: 'all' },
      'quyt': { months: [10, 11, 12, 1, 2], duration: 90, region: 'all' },
      'bưởi': { months: [8, 9, 10, 11, 12], duration: 120, region: 'all' },
      'buoi': { months: [8, 9, 10, 11, 12], duration: 120, region: 'all' },
      'xoài': { months: [3, 4, 5, 6], duration: 60, region: 'south' },
      'xoai': { months: [3, 4, 5, 6], duration: 60, region: 'south' },
      'nhãn': { months: [6, 7, 8], duration: 45, region: 'all' },
      'nhan': { months: [6, 7, 8], duration: 45, region: 'all' },
      'vải': { months: [5, 6, 7], duration: 30, region: 'north' },
      'vai': { months: [5, 6, 7], duration: 30, region: 'north' },
      'thanh long': { months: [4, 5, 6, 7, 8, 9, 10], duration: 90, region: 'south' },
      'dưa hấu': { months: [11, 12, 1, 2, 3, 4], duration: 60, region: 'south' },
      'dua hau': { months: [11, 12, 1, 2, 3, 4], duration: 60, region: 'south' },
      
      // Herbs
      'rau thơm': { months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], duration: 30, region: 'all' },
      'rau thom': { months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], duration: 30, region: 'all' },
      'húng quế': { months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], duration: 30, region: 'all' },
      'hung que': { months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], duration: 30, region: 'all' },
    };
    
    // Find matching plant
    let plantInfo = null;
    for (const [key, value] of Object.entries(fruitingSeasons)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        plantInfo = value;
        break;
      }
    }
    
    if (!plantInfo) {
      return {
        isFruitingSeason: null,
        message: null,
        expectedHarvestDate: null,
      };
    }
    
    // Determine region (simplified: north = lat > 16, south = lat <= 16)
    const isNorth = locationCoords?.lat > 16;
    const isSouth = locationCoords?.lat <= 16;
    const region = isNorth ? 'north' : isSouth ? 'south' : 'all';
    
    // Check if region matches
    if (plantInfo.region !== 'all' && plantInfo.region !== region) {
      return {
        isFruitingSeason: false,
        message: `Cây ${plantName} thường ra trái vào mùa ${getSeasonName(plantInfo.months)} ở khu vực ${plantInfo.region === 'north' ? 'miền Bắc' : 'miền Nam'}.`,
        expectedHarvestDate: null,
      };
    }
    
    // Check if current month is in fruiting season
    const isFruitingSeason = plantInfo.months.includes(currentMonth);
    
    // Calculate expected harvest date
    let expectedHarvestDate = null;
    if (plantedDate && daysSincePlanting > 0) {
      const harvestDate = new Date(plantedDate);
      harvestDate.setDate(harvestDate.getDate() + plantInfo.duration);
      expectedHarvestDate = harvestDate;
    }
    
    // Generate message
    let message = null;
    if (isFruitingSeason) {
      message = `🌱 Hiện tại đang là mùa ra trái của ${plantName}! Cây có thể đang hoặc sắp ra trái.`;
    } else {
      const nextSeason = getNextFruitingMonth(plantInfo.months, currentMonth);
      if (nextSeason) {
        message = `📅 Mùa ra trái của ${plantName} thường vào tháng ${nextSeason.join(', ')}. Hiện tại chưa phải mùa ra trái.`;
      }
    }
    
    if (expectedHarvestDate && daysSincePlanting > 0) {
      const daysUntilHarvest = Math.floor((expectedHarvestDate - now) / (1000 * 60 * 60 * 24));
      if (daysUntilHarvest > 0 && daysUntilHarvest <= 30) {
        message = `${message ? message + ' ' : ''}⏰ Dự kiến thu hoạch trong khoảng ${daysUntilHarvest} ngày nữa.`;
      } else if (daysUntilHarvest <= 0 && daysUntilHarvest >= -30) {
        message = `${message ? message + ' ' : ''}✅ Đã đến thời điểm thu hoạch!`;
      }
    }
    
    return {
      isFruitingSeason,
      message,
      expectedHarvestDate,
      seasonMonths: plantInfo.months,
      duration: plantInfo.duration,
    };
  } catch (error) {
    console.error('❌ [FruitingSeason] Error:', error);
    return {
      isFruitingSeason: null,
      message: null,
      expectedHarvestDate: null,
    };
  }
};

/**
 * Get season name from months
 */
const getSeasonName = (months) => {
  const monthNames = ['', 'tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6', 
                     'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'];
  return months.map(m => monthNames[m]).join(', ');
};

/**
 * Get next fruiting months
 */
const getNextFruitingMonth = (fruitingMonths, currentMonth) => {
  const next = fruitingMonths.filter(m => m > currentMonth);
  if (next.length > 0) {
    return next.slice(0, 3); // Return next 3 months
  }
  // If no months after current, return first months of next year
  return fruitingMonths.slice(0, 3);
};

export default {
  getFruitingSeasonInfo,
};

