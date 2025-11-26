/**
 * Common plant diseases in Vietnam
 * Used for autocomplete suggestions
 */
export const commonDiseases = [
  'Đốm lá',
  'Thối rễ',
  'Phấn trắng',
  'Mốc sương',
  'Rỉ sắt',
  'Vàng lá',
  'Thối thân',
  'Sâu bệnh',
  'Nấm đất',
  'Bạch tạng',
  'Đốm vàng',
  'Thối quả',
  'Nấm hồng',
  'Đốm nâu',
  'Thối nhũn',
  'Bệnh héo xanh',
  'Bệnh khảm',
  'Bệnh xoăn lá',
  'Thối cổ rễ',
  'Bệnh cháy lá',
]

/**
 * Get common diseases that match the query
 * @param query - Search query
 * @returns Filtered common diseases
 */
export const getMatchingCommonDiseases = (query: string): string[] => {
  if (!query || query.trim().length === 0) {
    return commonDiseases
  }

  const normalizedQuery = query.toLowerCase().trim()
  
  return commonDiseases.filter(disease => {
    const normalizedDisease = disease.toLowerCase()
    // Remove diacritics for matching
    const removeDiacritics = (str: string) => {
      return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
    }
    
    const queryNoDiacritics = removeDiacritics(normalizedQuery)
    const diseaseNoDiacritics = removeDiacritics(normalizedDisease)
    
    return (
      normalizedDisease.includes(normalizedQuery) ||
      diseaseNoDiacritics.includes(queryNoDiacritics) ||
      normalizedQuery.includes(normalizedDisease) ||
      queryNoDiacritics.includes(diseaseNoDiacritics)
    )
  })
}

