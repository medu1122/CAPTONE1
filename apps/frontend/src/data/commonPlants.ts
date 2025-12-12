/**
 * Common plants in Vietnam
 * Used for autocomplete suggestions and name correction
 */
export const commonPlants = [
  // Vegetables
  'Cà chua',
  'Dưa chuột',
  'Ớt',
  'Cà tím',
  'Đậu bắp',
  'Rau muống',
  'Rau cải',
  'Rau xà lách',
  'Rau mồng tơi',
  'Rau dền',
  'Rau ngót',
  'Rau đay',
  'Cải bắp',
  'Cải thảo',
  'Cải xanh',
  'Cải thìa',
  'Hành tây',
  'Hành lá',
  'Tỏi',
  'Gừng',
  'Nghệ',
  'Khoai tây',
  'Khoai lang',
  'Cà rốt',
  'Củ cải',
  'Củ dền',
  'Bí đỏ',
  'Bí xanh',
  'Bầu',
  'Mướp',
  'Đậu đũa',
  'Đậu cô ve',
  'Đậu xanh',
  'Đậu đen',
  'Đậu nành',
  'Ngô',
  'Lạc',
  'Vừng',
  
  // Fruits
  'Chuối',
  'Cam',
  'Quýt',
  'Bưởi',
  'Xoài',
  'Nhãn',
  'Vải',
  'Chôm chôm',
  'Sầu riêng',
  'Măng cụt',
  'Ổi',
  'Thanh long',
  'Dưa hấu',
  'Dưa lưới',
  'Dưa gang',
  'Dứa',
  'Chanh',
  'Chanh dây',
  'Mít',
  'Mãng cầu',
  'Na',
  'Hồng xiêm',
  'Mận',
  'Đào',
  'Lê',
  'Táo',
  'Nho',
  'Dâu tây',
  
  // Herbs & Spices
  'Rau thơm',
  'Húng quế',
  'Rau mùi',
  'Ngò gai',
  'Rau răm',
  'Lá lốt',
  'Tía tô',
  'Kinh giới',
  'Hành hoa',
  'Hẹ',
  'Sả',
  'Lá chanh',
  'Lá ổi',
  
  // Flowers & Ornamentals
  'Hoa hồng',
  'Hoa cúc',
  'Hoa ly',
  'Hoa lan',
  'Hoa đào',
  'Hoa mai',
  'Hoa sen',
  'Hoa súng',
  'Hoa dâm bụt',
  'Hoa giấy',
  'Hoa mười giờ',
  'Hoa dừa cạn',
  'Hoa cẩm chướng',
  'Hoa đồng tiền',
  'Hoa cẩm tú cầu',
  'Hoa phong lữ',
  'Hoa dạ yến thảo',
  
  // Trees
  'Cây mít',
  'Cây xoài',
  'Cây nhãn',
  'Cây vải',
  'Cây ổi',
  'Cây chanh',
  'Cây cam',
  'Cây bưởi',
  'Cây quýt',
  'Cây sầu riêng',
  'Cây măng cụt',
  'Cây chôm chôm',
  'Cây thanh long',
  'Cây dừa',
  'Cây cà phê',
  'Cây tiêu',
  'Cây cao su',
  'Cây điều',
  'Cây ca cao',
  'Cây chè',
]

/**
 * Get common plants that match the query
 * @param query - Search query
 * @returns Filtered common plants
 */
export const getMatchingCommonPlants = (query: string): string[] => {
  if (!query || query.trim().length === 0) {
    return commonPlants.slice(0, 20) // Return first 20 if empty
  }
  
  const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  
  return commonPlants.filter(plant => {
    const normalizedPlant = plant.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return normalizedPlant.includes(normalizedQuery)
  }).slice(0, 20)
}

/**
 * Find the closest matching plant name (for auto-correction)
 * @param input - User input
 * @returns Corrected plant name or original if no match found
 */
export const correctPlantName = (input: string): string => {
  if (!input || input.trim().length === 0) {
    return input
  }
  
  const normalizedInput = input.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  
  // Exact match (case-insensitive, diacritic-insensitive)
  const exactMatch = commonPlants.find(plant => {
    const normalizedPlant = plant.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return normalizedPlant === normalizedInput
  })
  
  if (exactMatch) {
    return exactMatch
  }
  
  // Fuzzy match - find the closest match
  let bestMatch: string | null = null
  let bestScore = 0
  
  for (const plant of commonPlants) {
    const normalizedPlant = plant.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    
    // Calculate similarity score
    let score = 0
    
    // Check if input is contained in plant name or vice versa
    if (normalizedPlant.includes(normalizedInput) || normalizedInput.includes(normalizedPlant)) {
      score += 10
    }
    
    // Check character overlap
    const inputChars = new Set(normalizedInput)
    const plantChars = new Set(normalizedPlant)
    const overlap = [...inputChars].filter(char => plantChars.has(char)).length
    score += overlap * 2
    
    // Prefer shorter matches (less difference in length)
    const lengthDiff = Math.abs(normalizedInput.length - normalizedPlant.length)
    score -= lengthDiff * 0.5
    
    if (score > bestScore && score >= 5) { // Minimum threshold
      bestScore = score
      bestMatch = plant
    }
  }
  
  return bestMatch || input // Return corrected name or original if no good match
}

