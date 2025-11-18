// Danh sách tỉnh thành Việt Nam với tọa độ trung tâm
export interface VietnamProvince {
  code: string
  name: string
  coordinates: {
    lat: number
    lng: number
  }
}

export const vietnamProvinces: VietnamProvince[] = [
  { code: 'HN', name: 'Hà Nội', coordinates: { lat: 21.0285, lng: 105.8542 } },
  { code: 'HCM', name: 'Hồ Chí Minh', coordinates: { lat: 10.8231, lng: 106.6297 } },
  { code: 'HP', name: 'Hải Phòng', coordinates: { lat: 20.8449, lng: 106.6881 } },
  { code: 'DN', name: 'Đà Nẵng', coordinates: { lat: 16.0544, lng: 108.2022 } },
  { code: 'CT', name: 'Cần Thơ', coordinates: { lat: 10.0452, lng: 105.7469 } },
  { code: 'AG', name: 'An Giang', coordinates: { lat: 10.5216, lng: 105.1259 } },
  { code: 'BR-VT', name: 'Bà Rịa - Vũng Tàu', coordinates: { lat: 10.3460, lng: 107.0843 } },
  { code: 'BL', name: 'Bạc Liêu', coordinates: { lat: 9.2942, lng: 105.7278 } },
  { code: 'BK', name: 'Bắc Kạn', coordinates: { lat: 22.1470, lng: 105.8342 } },
  { code: 'BG', name: 'Bắc Giang', coordinates: { lat: 21.2810, lng: 106.1970 } },
  { code: 'BN', name: 'Bắc Ninh', coordinates: { lat: 21.1861, lng: 106.0763 } },
  { code: 'BT', name: 'Bến Tre', coordinates: { lat: 10.2434, lng: 106.3759 } },
  { code: 'BD', name: 'Bình Định', coordinates: { lat: 13.7750, lng: 109.2233 } },
  { code: 'BP', name: 'Bình Phước', coordinates: { lat: 11.6471, lng: 106.6056 } },
  { code: 'BU', name: 'Bình Thuận', coordinates: { lat: 10.9287, lng: 108.1021 } },
  { code: 'CM', name: 'Cà Mau', coordinates: { lat: 9.1776, lng: 105.1527 } },
  { code: 'CB', name: 'Cao Bằng', coordinates: { lat: 22.6657, lng: 106.2577 } },
  { code: 'DL', name: 'Đắk Lắk', coordinates: { lat: 12.6662, lng: 108.0500 } },
  { code: 'DG', name: 'Đắk Nông', coordinates: { lat: 12.0046, lng: 107.6877 } },
  { code: 'DB', name: 'Điện Biên', coordinates: { lat: 21.3924, lng: 103.0230 } },
  { code: 'DNA', name: 'Đồng Nai', coordinates: { lat: 10.9574, lng: 106.8429 } },
  { code: 'DT', name: 'Đồng Tháp', coordinates: { lat: 10.4930, lng: 105.6882 } },
  { code: 'GL', name: 'Gia Lai', coordinates: { lat: 13.9700, lng: 108.0147 } },
  { code: 'HG', name: 'Hà Giang', coordinates: { lat: 22.8026, lng: 104.9784 } },
  { code: 'HNA', name: 'Hà Nam', coordinates: { lat: 20.5433, lng: 105.9220 } },
  { code: 'HT', name: 'Hà Tĩnh', coordinates: { lat: 18.3330, lng: 105.9000 } },
  { code: 'HD', name: 'Hải Dương', coordinates: { lat: 20.9373, lng: 106.3146 } },
  { code: 'HB', name: 'Hòa Bình', coordinates: { lat: 20.8136, lng: 105.3383 } },
  { code: 'HY', name: 'Hưng Yên', coordinates: { lat: 20.6464, lng: 106.0513 } },
  { code: 'KH', name: 'Khánh Hòa', coordinates: { lat: 12.2388, lng: 109.1967 } },
  { code: 'KG', name: 'Kiên Giang', coordinates: { lat: 9.9580, lng: 105.1322 } },
  { code: 'LC', name: 'Lào Cai', coordinates: { lat: 22.4862, lng: 103.9750 } },
  { code: 'LD', name: 'Lâm Đồng', coordinates: { lat: 11.9404, lng: 108.4583 } },
  { code: 'LS', name: 'Lạng Sơn', coordinates: { lat: 21.8537, lng: 106.7613 } },
  { code: 'LB', name: 'Lai Châu', coordinates: { lat: 22.3864, lng: 103.4703 } },
  { code: 'LA', name: 'Long An', coordinates: { lat: 10.6086, lng: 106.6714 } },
  { code: 'ND', name: 'Nam Định', coordinates: { lat: 20.4200, lng: 106.1683 } },
  { code: 'NA', name: 'Nghệ An', coordinates: { lat: 18.6796, lng: 105.6813 } },
  { code: 'NB', name: 'Ninh Bình', coordinates: { lat: 20.2537, lng: 105.9750 } },
  { code: 'NT', name: 'Ninh Thuận', coordinates: { lat: 11.5646, lng: 108.9881 } },
  { code: 'PT', name: 'Phú Thọ', coordinates: { lat: 21.3081, lng: 105.3131 } },
  { code: 'PY', name: 'Phú Yên', coordinates: { lat: 13.0880, lng: 109.0927 } },
  { code: 'QB', name: 'Quảng Bình', coordinates: { lat: 17.4683, lng: 106.6227 } },
  { code: 'QNA', name: 'Quảng Nam', coordinates: { lat: 15.8801, lng: 108.3380 } },
  { code: 'QG', name: 'Quảng Ngãi', coordinates: { lat: 15.1167, lng: 108.8000 } },
  { code: 'QN', name: 'Quảng Ninh', coordinates: { lat: 21.0064, lng: 107.2925 } },
  { code: 'QT', name: 'Quảng Trị', coordinates: { lat: 16.7500, lng: 107.2000 } },
  { code: 'ST', name: 'Sóc Trăng', coordinates: { lat: 9.6025, lng: 105.9739 } },
  { code: 'SL', name: 'Sơn La', coordinates: { lat: 21.3257, lng: 103.9167 } },
  { code: 'TN', name: 'Tây Ninh', coordinates: { lat: 11.3131, lng: 106.0963 } },
  { code: 'TB', name: 'Thái Bình', coordinates: { lat: 20.4465, lng: 106.3367 } },
  { code: 'TY', name: 'Thái Nguyên', coordinates: { lat: 21.5942, lng: 105.8481 } },
  { code: 'TH', name: 'Thanh Hóa', coordinates: { lat: 19.8067, lng: 105.7843 } },
  { code: 'HU', name: 'Thừa Thiên Huế', coordinates: { lat: 16.4637, lng: 107.5908 } },
  { code: 'TG', name: 'Tiền Giang', coordinates: { lat: 10.3600, lng: 106.3600 } },
  { code: 'TV', name: 'Trà Vinh', coordinates: { lat: 9.9347, lng: 106.3453 } },
  { code: 'TQ', name: 'Tuyên Quang', coordinates: { lat: 21.8183, lng: 105.2117 } },
  { code: 'VL', name: 'Vĩnh Long', coordinates: { lat: 10.2537, lng: 105.9750 } },
  { code: 'VP', name: 'Vĩnh Phúc', coordinates: { lat: 21.3081, lng: 105.5972 } },
  { code: 'YB', name: 'Yên Bái', coordinates: { lat: 21.7051, lng: 104.8694 } },
]

// Helper function to get province by name
export const getProvinceByName = (name: string): VietnamProvince | undefined => {
  return vietnamProvinces.find(
    (p) => p.name.toLowerCase().includes(name.toLowerCase()) ||
           name.toLowerCase().includes(p.name.toLowerCase())
  )
}

// Helper function to get province by coordinates (find nearest)
export const getProvinceByCoordinates = (
  lat: number,
  lng: number
): VietnamProvince | undefined => {
  let nearest: VietnamProvince | undefined
  let minDistance = Infinity

  vietnamProvinces.forEach((province) => {
    const distance = Math.sqrt(
      Math.pow(province.coordinates.lat - lat, 2) +
      Math.pow(province.coordinates.lng - lng, 2)
    )
    if (distance < minDistance) {
      minDistance = distance
      nearest = province
    }
  })

  return nearest
}

