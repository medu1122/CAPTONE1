/**
 * Generate crop candidates based on region, month, and soil type
 * This prevents GPT from hallucinating crops
 */

// Region mapping for provinces
const getProvinceRegion = (provinceName) => {
  const name = provinceName.toLowerCase();
  
  // Miền Bắc
  if (name.includes('hà nội') || name.includes('hải phòng') || name.includes('quảng ninh') ||
      name.includes('bắc giang') || name.includes('bắc ninh') || name.includes('hải dương') ||
      name.includes('hưng yên') || name.includes('thái bình') || name.includes('hà nam') ||
      name.includes('nam định') || name.includes('ninh bình') || name.includes('lào cai') ||
      name.includes('yên bái') || name.includes('tuyên quang') || name.includes('hà giang') ||
      name.includes('cao bằng') || name.includes('bắc kạn') || name.includes('lạng sơn') ||
      name.includes('thái nguyên') || name.includes('phú thọ') || name.includes('vĩnh phúc') ||
      name.includes('sơn la') || name.includes('điện biên') || name.includes('lai châu') ||
      name.includes('hoà bình')) {
    return 'north';
  }
  
  // Miền Trung
  if (name.includes('thanh hóa') || name.includes('nghệ an') || name.includes('hà tĩnh') ||
      name.includes('quảng bình') || name.includes('quảng trị') || name.includes('thừa thiên huế') ||
      name.includes('đà nẵng') || name.includes('quảng nam') || name.includes('quảng ngãi') ||
      name.includes('bình định') || name.includes('phú yên') || name.includes('khánh hòa') ||
      name.includes('ninh thuận') || name.includes('bình thuận')) {
    return 'central';
  }
  
  // Miền Nam
  if (name.includes('hồ chí minh') || name.includes('bình dương') || name.includes('đồng nai') ||
      name.includes('tây ninh') || name.includes('bình phước') || name.includes('bà rịa') ||
      name.includes('long an') || name.includes('tiền giang') || name.includes('bến tre') ||
      name.includes('trà vinh') || name.includes('vĩnh long') || name.includes('đồng tháp') ||
      name.includes('an giang') || name.includes('kiên giang') || name.includes('cần thơ') ||
      name.includes('hậu giang') || name.includes('sóc trăng') || name.includes('bạc liêu') ||
      name.includes('cà mau') || name.includes('cần thơ')) {
    return 'south';
  }
  
  // Tây Nguyên
  if (name.includes('kon tum') || name.includes('gia lai') || name.includes('đắk lắk') ||
      name.includes('đắk nông') || name.includes('lâm đồng')) {
    return 'highlands';
  }
  
  return 'unknown';
};

// Crop candidates by region and month
const cropCandidatesByRegionMonth = {
  north: {
    1: { planting: ['cải bắp', 'cải thìa', 'cải xanh', 'xà lách', 'cà rốt', 'hành tây'], harvesting: ['cải bắp', 'cải thìa', 'su hào'] },
    2: { planting: ['cải bắp', 'cải thìa', 'cải xanh', 'xà lách', 'cà rốt', 'hành tây'], harvesting: ['cải bắp', 'cải thìa', 'su hào'] },
    3: { planting: ['cà chua', 'dưa chuột', 'đậu đũa', 'rau muống', 'rau cải'], harvesting: ['cải bắp', 'cải thìa', 'hành tây'] },
    4: { planting: ['cà chua', 'dưa chuột', 'đậu đũa', 'rau muống', 'rau cải', 'mướp'], harvesting: ['cải bắp', 'cải thìa'] },
    5: { planting: ['cà chua', 'dưa chuột', 'đậu đũa', 'rau muống', 'mướp', 'bí đỏ'], harvesting: ['cà chua', 'dưa chuột'] },
    6: { planting: ['rau muống', 'mướp', 'bí đỏ', 'đậu đũa'], harvesting: ['cà chua', 'dưa chuột', 'đậu đũa'] },
    7: { planting: ['rau muống', 'mướp', 'bí đỏ', 'đậu đũa'], harvesting: ['cà chua', 'dưa chuột', 'mướp'] },
    8: { planting: ['rau muống', 'mướp', 'bí đỏ', 'đậu đũa', 'cải bắp'], harvesting: ['mướp', 'bí đỏ'] },
    9: { planting: ['cải bắp', 'cải thìa', 'cải xanh', 'xà lách', 'cà rốt'], harvesting: ['mướp', 'bí đỏ', 'đậu đũa'] },
    10: { planting: ['cải bắp', 'cải thìa', 'cải xanh', 'xà lách', 'cà rốt', 'hành tây'], harvesting: ['mướp', 'bí đỏ'] },
    11: { planting: ['cải bắp', 'cải thìa', 'cải xanh', 'xà lách', 'cà rốt', 'hành tây'], harvesting: ['cải bắp', 'cải thìa'] },
    12: { planting: ['cải bắp', 'cải thìa', 'cải xanh', 'xà lách', 'cà rốt', 'hành tây'], harvesting: ['cải bắp', 'cải thìa', 'su hào'] },
  },
  central: {
    1: { planting: ['cải bắp', 'cải thìa', 'cải xanh', 'xà lách', 'cà rốt', 'hành tây', 'dưa hấu'], harvesting: ['cải bắp', 'cải thìa', 'dưa hấu'] },
    2: { planting: ['cải bắp', 'cải thìa', 'cải xanh', 'xà lách', 'cà rốt', 'dưa hấu'], harvesting: ['cải bắp', 'cải thìa', 'dưa hấu'] },
    3: { planting: ['cà chua', 'dưa chuột', 'đậu đũa', 'rau muống', 'rau cải', 'dưa hấu'], harvesting: ['cải bắp', 'cải thìa'] },
    4: { planting: ['cà chua', 'dưa chuột', 'đậu đũa', 'rau muống', 'rau cải', 'mướp', 'dưa hấu'], harvesting: ['cải bắp', 'cải thìa', 'dưa hấu'] },
    5: { planting: ['cà chua', 'dưa chuột', 'đậu đũa', 'rau muống', 'mướp', 'bí đỏ'], harvesting: ['cà chua', 'dưa chuột', 'dưa hấu'] },
    6: { planting: ['rau muống', 'mướp', 'bí đỏ', 'đậu đũa'], harvesting: ['cà chua', 'dưa chuột', 'đậu đũa'] },
    7: { planting: ['rau muống', 'mướp', 'bí đỏ', 'đậu đũa'], harvesting: ['cà chua', 'dưa chuột', 'mướp'] },
    8: { planting: ['rau muống', 'mướp', 'bí đỏ', 'đậu đũa', 'cải bắp'], harvesting: ['mướp', 'bí đỏ'] },
    9: { planting: ['cải bắp', 'cải thìa', 'cải xanh', 'xà lách', 'cà rốt'], harvesting: ['mướp', 'bí đỏ', 'đậu đũa'] },
    10: { planting: ['cải bắp', 'cải thìa', 'cải xanh', 'xà lách', 'cà rốt', 'hành tây'], harvesting: ['mướp', 'bí đỏ'] },
    11: { planting: ['cải bắp', 'cải thìa', 'cải xanh', 'xà lách', 'cà rốt', 'hành tây', 'dưa hấu'], harvesting: ['cải bắp', 'cải thìa'] },
    12: { planting: ['cải bắp', 'cải thìa', 'cải xanh', 'xà lách', 'cà rốt', 'hành tây', 'dưa hấu'], harvesting: ['cải bắp', 'cải thìa', 'dưa hấu'] },
  },
  south: {
    1: { planting: ['cải bắp', 'cải thìa', 'cải xanh', 'xà lách', 'cà rốt', 'dưa hấu', 'dưa leo'], harvesting: ['cải bắp', 'cải thìa', 'dưa hấu'] },
    2: { planting: ['cải bắp', 'cải thìa', 'cải xanh', 'xà lách', 'cà rốt', 'dưa hấu', 'dưa leo'], harvesting: ['cải bắp', 'cải thìa', 'dưa hấu'] },
    3: { planting: ['cà chua', 'dưa chuột', 'đậu đũa', 'rau muống', 'rau cải', 'dưa hấu', 'dưa leo'], harvesting: ['cải bắp', 'cải thìa', 'dưa hấu'] },
    4: { planting: ['cà chua', 'dưa chuột', 'đậu đũa', 'rau muống', 'rau cải', 'mướp', 'dưa hấu'], harvesting: ['cải bắp', 'cải thìa', 'dưa hấu'] },
    5: { planting: ['cà chua', 'dưa chuột', 'đậu đũa', 'rau muống', 'mướp', 'bí đỏ'], harvesting: ['cà chua', 'dưa chuột', 'dưa hấu'] },
    6: { planting: ['rau muống', 'mướp', 'bí đỏ', 'đậu đũa'], harvesting: ['cà chua', 'dưa chuột', 'đậu đũa'] },
    7: { planting: ['rau muống', 'mướp', 'bí đỏ', 'đậu đũa'], harvesting: ['cà chua', 'dưa chuột', 'mướp'] },
    8: { planting: ['rau muống', 'mướp', 'bí đỏ', 'đậu đũa', 'cải bắp'], harvesting: ['mướp', 'bí đỏ'] },
    9: { planting: ['cải bắp', 'cải thìa', 'cải xanh', 'xà lách', 'cà rốt'], harvesting: ['mướp', 'bí đỏ', 'đậu đũa'] },
    10: { planting: ['cải bắp', 'cải thìa', 'cải xanh', 'xà lách', 'cà rốt', 'hành tây'], harvesting: ['mướp', 'bí đỏ'] },
    11: { planting: ['cải bắp', 'cải thìa', 'cải xanh', 'xà lách', 'cà rốt', 'hành tây', 'dưa hấu'], harvesting: ['cải bắp', 'cải thìa'] },
    12: { planting: ['cải bắp', 'cải thìa', 'cải xanh', 'xà lách', 'cà rốt', 'hành tây', 'dưa hấu'], harvesting: ['cải bắp', 'cải thìa', 'dưa hấu'] },
  },
  highlands: {
    1: { planting: ['cải bắp', 'cải thìa', 'cải xanh', 'xà lách', 'cà rốt', 'hành tây'], harvesting: ['cải bắp', 'cải thìa'] },
    2: { planting: ['cải bắp', 'cải thìa', 'cải xanh', 'xà lách', 'cà rốt', 'hành tây'], harvesting: ['cải bắp', 'cải thìa'] },
    3: { planting: ['cà chua', 'dưa chuột', 'đậu đũa', 'rau muống', 'rau cải'], harvesting: ['cải bắp', 'cải thìa', 'hành tây'] },
    4: { planting: ['cà chua', 'dưa chuột', 'đậu đũa', 'rau muống', 'rau cải', 'mướp'], harvesting: ['cải bắp', 'cải thìa'] },
    5: { planting: ['cà chua', 'dưa chuột', 'đậu đũa', 'rau muống', 'mướp', 'bí đỏ'], harvesting: ['cà chua', 'dưa chuột'] },
    6: { planting: ['rau muống', 'mướp', 'bí đỏ', 'đậu đũa'], harvesting: ['cà chua', 'dưa chuột', 'đậu đũa'] },
    7: { planting: ['rau muống', 'mướp', 'bí đỏ', 'đậu đũa'], harvesting: ['cà chua', 'dưa chuột', 'mướp'] },
    8: { planting: ['rau muống', 'mướp', 'bí đỏ', 'đậu đũa', 'cải bắp'], harvesting: ['mướp', 'bí đỏ'] },
    9: { planting: ['cải bắp', 'cải thìa', 'cải xanh', 'xà lách', 'cà rốt'], harvesting: ['mướp', 'bí đỏ', 'đậu đũa'] },
    10: { planting: ['cải bắp', 'cải thìa', 'cải xanh', 'xà lách', 'cà rốt', 'hành tây'], harvesting: ['mướp', 'bí đỏ'] },
    11: { planting: ['cải bắp', 'cải thìa', 'cải xanh', 'xà lách', 'cà rốt', 'hành tây'], harvesting: ['cải bắp', 'cải thìa'] },
    12: { planting: ['cải bắp', 'cải thìa', 'cải xanh', 'xà lách', 'cà rốt', 'hành tây'], harvesting: ['cải bắp', 'cải thìa', 'su hào'] },
  },
};

/**
 * Get crop candidates for a province based on region, month, and database data
 * @param {string} provinceName - Province name
 * @param {number} month - Current month (1-12)
 * @param {Array} dbPlantingCrops - Crops from database for planting
 * @param {Array} dbHarvestingCrops - Crops from database for harvesting
 * @returns {object} Candidates with planting and harvesting crops
 */
export const getCropCandidates = (provinceName, month, dbPlantingCrops = [], dbHarvestingCrops = []) => {
  const region = getProvinceRegion(provinceName);
  const regionCrops = cropCandidatesByRegionMonth[region]?.[month] || { planting: [], harvesting: [] };
  
  // Priority: Database data > Region rules
  const plantingCandidates = dbPlantingCrops.length > 0 
    ? dbPlantingCrops 
    : regionCrops.planting;
    
  const harvestingCandidates = dbHarvestingCrops.length > 0 
    ? dbHarvestingCrops 
    : regionCrops.harvesting;
  
  return {
    planting: plantingCandidates.slice(0, 5), // Limit to 5
    harvesting: harvestingCandidates.slice(0, 5),
    region: region,
    hasDatabaseData: dbPlantingCrops.length > 0 || dbHarvestingCrops.length > 0
  };
};

