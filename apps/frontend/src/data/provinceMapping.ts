// Mapping giữa SVG ID (từ vn.svg) và Province Code
// Dựa trên file SVG từ simplemaps.com

export const provinceIdMapping: Record<string, string> = {
  // Format: "SVG_ID": "PROVINCE_CODE"
  "VNHN": "HN",      // Hà Nội
  "VNSG": "HCM",     // Hồ Chí Minh
  "VNHP": "HP",      // Hải Phòng
  "VNDN": "DN",      // Đà Nẵng
  "VNCT": "CT",      // Cần Thơ
  "VN01": "LB",      // Lai Châu
  "VN02": "LC",      // Lào Cai
  "VN03": "HG",      // Hà Giang
  "VN04": "CB",      // Cao Bằng
  "VN05": "SL",      // Sơn La
  "VN06": "YB",      // Yên Bái
  "VN07": "TQ",      // Tuyên Quang
  "VN09": "LS",      // Lạng Sơn
  "VN13": "QN",      // Quảng Ninh
  "VN14": "HB",      // Hòa Bình
  "VN18": "NB",      // Ninh Bình
  "VN20": "TB",      // Thái Bình
  "VN21": "TH",      // Thanh Hóa
  "VN22": "NA",      // Nghệ An
  "VN23": "HT",      // Hà Tĩnh
  "VN24": "QB",      // Quảng Bình
  "VN25": "QT",      // Quảng Trị
  "VN26": "HU",      // Thừa Thiên Huế
  "VN27": "QNA",     // Quảng Nam
  "VN29": "QG",      // Quảng Ngãi
  "VN30": "GL",      // Gia Lai
  "VN31": "BD",      // Bình Định
  "VN32": "PY",      // Phú Yên
  "VN33": "DL",      // Đắk Lắk
  "VN34": "KH",      // Khánh Hòa
  "VN35": "LD",      // Lâm Đồng
  "VN36": "NT",      // Ninh Thuận
  "VN37": "TN",      // Tây Ninh
  "VN40": "BU",      // Bình Thuận
  "VN41": "LA",      // Long An
  "VN43": "BR-VT",   // Bà Rịa - Vũng Tàu
  "VN44": "AG",      // An Giang
  "VN45": "DT",      // Đồng Tháp
  "VN46": "TG",      // Tiền Giang
  "VN47": "KG",      // Kiên Giang
  "VN49": "VL",      // Vĩnh Long
  "VN50": "BT",      // Bến Tre
  "VN51": "TV",      // Trà Vinh
  "VN52": "ST",      // Sóc Trăng
  "VN54": "BG",      // Bắc Giang
  "VN55": "BL",      // Bạc Liêu
  "VN56": "BN",      // Bắc Ninh
  "VN58": "BP",      // Bình Phước
  "VN59": "CM",      // Cà Mau
  "VN61": "HD",      // Hải Dương
  "VN63": "HNA",     // Hà Nam
  "VN67": "ND",      // Nam Định
  "VN68": "PT",      // Phú Thọ
  "VN69": "TY",      // Thái Nguyên
  "VN70": "VP",      // Vĩnh Phúc
  "VN71": "DB",      // Điện Biên
  "VN72": "DG",      // Đắk Nông
  "VN28": "KT",      // Kon Tum
  "VN57": "BDU",     // Bình Dương
  "VN73": "HAU",     // Hậu Giang
  // Các ID sau là vùng, không phải tỉnh riêng lẻ - bỏ qua
  // "VN39": "Đông Nam Bộ" - Vùng
  // "VN53": "Đông Bắc" - Vùng
  // "VN66": "Đồng Bằng Sông Hồng" - Vùng
}

// Reverse mapping: Province Code -> SVG ID
export const getSvgIdByProvinceCode = (code: string): string | undefined => {
  return Object.entries(provinceIdMapping).find(
    ([_, provinceCode]) => provinceCode === code
  )?.[0];
}

// Get province code by SVG ID
export const getProvinceCodeBySvgId = (svgId: string): string | undefined => {
  return provinceIdMapping[svgId];
}

