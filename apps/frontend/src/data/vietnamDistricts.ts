// Danh sách quận/huyện theo tỉnh thành
export interface District {
  code: string
  name: string
}

// Mapping từ province code sang danh sách districts
export const vietnamDistricts: Record<string, District[]> = {
  // Hà Nội
  HN: [
    { code: 'BA_DINH', name: 'Ba Đình' },
    { code: 'HOAN_KIEM', name: 'Hoàn Kiếm' },
    { code: 'TAY_HO', name: 'Tây Hồ' },
    { code: 'LONG_BIEN', name: 'Long Biên' },
    { code: 'CAU_GIAY', name: 'Cầu Giấy' },
    { code: 'DONG_DA', name: 'Đống Đa' },
    { code: 'HAI_BA_TRUNG', name: 'Hai Bà Trưng' },
    { code: 'HOANG_MAI', name: 'Hoàng Mai' },
    { code: 'THANH_XUAN', name: 'Thanh Xuân' },
    { code: 'NAM_TU_LIEM', name: 'Nam Từ Liêm' },
    { code: 'BAC_TU_LIEM', name: 'Bắc Từ Liêm' },
    { code: 'HA_DONG', name: 'Hà Đông' },
    { code: 'SON_TAY', name: 'Sơn Tây' },
    { code: 'BA_VI', name: 'Ba Vì' },
    { code: 'CHUONG_MY', name: 'Chương Mỹ' },
    { code: 'DAN_PHUONG', name: 'Đan Phượng' },
    { code: 'DONG_ANH', name: 'Đông Anh' },
    { code: 'GIA_LAM', name: 'Gia Lâm' },
    { code: 'HOAI_DUC', name: 'Hoài Đức' },
    { code: 'ME_LINH', name: 'Mê Linh' },
    { code: 'MY_DUC', name: 'Mỹ Đức' },
    { code: 'PHUONG_MY', name: 'Phúc Thọ' },
    { code: 'PHU_XUYEN', name: 'Phú Xuyên' },
    { code: 'QUOC_OAI', name: 'Quốc Oai' },
    { code: 'SOC_SON', name: 'Sóc Sơn' },
    { code: 'THACH_THAT', name: 'Thạch Thất' },
    { code: 'THANH_OAI', name: 'Thanh Oai' },
    { code: 'THANH_TRI', name: 'Thanh Trì' },
    { code: 'THUONG_TIN', name: 'Thường Tín' },
    { code: 'UNG_HOA', name: 'Ứng Hòa' },
  ],

  // Hồ Chí Minh
  HCM: [
    { code: 'QUAN_1', name: 'Quận 1' },
    { code: 'QUAN_2', name: 'Quận 2' },
    { code: 'QUAN_3', name: 'Quận 3' },
    { code: 'QUAN_4', name: 'Quận 4' },
    { code: 'QUAN_5', name: 'Quận 5' },
    { code: 'QUAN_6', name: 'Quận 6' },
    { code: 'QUAN_7', name: 'Quận 7' },
    { code: 'QUAN_8', name: 'Quận 8' },
    { code: 'QUAN_9', name: 'Quận 9' },
    { code: 'QUAN_10', name: 'Quận 10' },
    { code: 'QUAN_11', name: 'Quận 11' },
    { code: 'QUAN_12', name: 'Quận 12' },
    { code: 'THU_DUC', name: 'Thủ Đức' },
    { code: 'BINH_THANH', name: 'Bình Thạnh' },
    { code: 'TAN_BINH', name: 'Tân Bình' },
    { code: 'TAN_PHU', name: 'Tân Phú' },
    { code: 'PHU_NHUAN', name: 'Phú Nhuận' },
    { code: 'GO_VAP', name: 'Gò Vấp' },
    { code: 'BINH_TAN', name: 'Bình Tân' },
    { code: 'CU_CHI', name: 'Củ Chi' },
    { code: 'HOC_MON', name: 'Hóc Môn' },
    { code: 'BINH_CHANH', name: 'Bình Chánh' },
    { code: 'NHA_BE', name: 'Nhà Bè' },
    { code: 'CAN_GIO', name: 'Cần Giờ' },
  ],

  // Đà Nẵng
  DN: [
    { code: 'HAI_CHAU', name: 'Hải Châu' },
    { code: 'THANH_KHE', name: 'Thanh Khê' },
    { code: 'SON_TRA', name: 'Sơn Trà' },
    { code: 'NGU_HANH_SON', name: 'Ngũ Hành Sơn' },
    { code: 'LIEN_CHIEU', name: 'Liên Chiểu' },
    { code: 'CAM_LE', name: 'Cẩm Lệ' },
    { code: 'HOA_VANG', name: 'Hòa Vang' },
    { code: 'HOANG_SA', name: 'Hoàng Sa' },
  ],

  // Hải Phòng
  HP: [
    { code: 'HONG_BANG', name: 'Hồng Bàng' },
    { code: 'NGO_QUYEN', name: 'Ngô Quyền' },
    { code: 'LE_CHAN', name: 'Lê Chân' },
    { code: 'HAI_AN', name: 'Hải An' },
    { code: 'KIEN_AN', name: 'Kiến An' },
    { code: 'DO_SON', name: 'Đồ Sơn' },
    { code: 'DUONG_KINH', name: 'Dương Kinh' },
    { code: 'THUY_NGUYEN', name: 'Thủy Nguyên' },
    { code: 'AN_DUONG', name: 'An Dương' },
    { code: 'AN_LAO', name: 'An Lão' },
    { code: 'KIEN_THUY', name: 'Kiến Thuỵ' },
    { code: 'TIEN_LANG', name: 'Tiên Lãng' },
    { code: 'VINH_BAO', name: 'Vĩnh Bảo' },
    { code: 'CAT_HAI', name: 'Cát Hải' },
    { code: 'BACH_LONG_VI', name: 'Bạch Long Vĩ' },
  ],

  // Cần Thơ
  CT: [
    { code: 'NINH_KIEU', name: 'Ninh Kiều' },
    { code: 'O_MON', name: 'Ô Môn' },
    { code: 'BINH_THUY', name: 'Bình Thuỷ' },
    { code: 'CAI_RANG', name: 'Cái Răng' },
    { code: 'THOT_NOT', name: 'Thốt Nốt' },
    { code: 'VINH_THANH', name: 'Vĩnh Thạnh' },
    { code: 'CO_DO', name: 'Cờ Đỏ' },
    { code: 'PHONG_DIEN', name: 'Phong Điền' },
    { code: 'THOI_LAI', name: 'Thới Lai' },
  ],

  // Các tỉnh khác - thêm một số tỉnh phổ biến
  AG: [
    { code: 'LONG_XUYEN', name: 'TP. Long Xuyên' },
    { code: 'CHAU_DOC', name: 'TP. Châu Đốc' },
    { code: 'AN_PHU', name: 'An Phú' },
    { code: 'TAN_CHAU', name: 'Tân Châu' },
    { code: 'PHU_TAN', name: 'Phú Tân' },
    { code: 'CHAU_PHUBINH', name: 'Châu Phú' },
    { code: 'THO_THAP', name: 'Thoại Sơn' },
    { code: 'TINH_BIEN', name: 'Tịnh Biên' },
    { code: 'TRI_TON', name: 'Tri Tôn' },
    { code: 'CHAU_THANH', name: 'Châu Thành' },
    { code: 'CHO_MOI', name: 'Chợ Mới' },
  ],

  BN: [
    { code: 'BAC_NINH', name: 'TP. Bắc Ninh' },
    { code: 'TU_SON', name: 'TX. Từ Sơn' },
    { code: 'YEN_PHONG', name: 'Yên Phong' },
    { code: 'QUE_VO', name: 'Quế Võ' },
    { code: 'TIEN_DU', name: 'Tiên Du' },
    { code: 'GIA_BINH', name: 'Gia Bình' },
    { code: 'LUONG_TAI', name: 'Lương Tài' },
    { code: 'THUAN_THANH', name: 'Thuận Thành' },
  ],

  DNA: [
    { code: 'BIEN_HOA', name: 'TP. Biên Hòa' },
    { code: 'LONG_KHANH', name: 'TP. Long Khánh' },
    { code: 'TAN_PHU', name: 'Tân Phú' },
    { code: 'VINH_CUU', name: 'Vĩnh Cửu' },
    { code: 'DINH_QUAN', name: 'Định Quán' },
    { code: 'TRANG_BOM', name: 'Trảng Bom' },
    { code: 'THONG_NHAT', name: 'Thống Nhất' },
    { code: 'CAM_MY', name: 'Cẩm Mỹ' },
    { code: 'LONG_THANH', name: 'Long Thành' },
    { code: 'XUAN_LOC', name: 'Xuân Lộc' },
    { code: 'NHON_TRACH', name: 'Nhơn Trạch' },
  ],

  // Thêm các tỉnh khác nếu cần...
  // Để trống hoặc thêm dần
}

// Lấy danh sách quận/huyện theo mã tỉnh
export const getDistrictsByProvince = (provinceCode: string): District[] => {
  return vietnamDistricts[provinceCode] || []
}

// Kiểm tra xem tỉnh có data quận/huyện không
export const hasDistrictsData = (provinceCode: string): boolean => {
  return !!vietnamDistricts[provinceCode] && vietnamDistricts[provinceCode].length > 0
}

