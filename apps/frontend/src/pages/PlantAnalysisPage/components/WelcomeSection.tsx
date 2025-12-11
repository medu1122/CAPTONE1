import React from 'react'
import { UploadIcon, SearchIcon, LightbulbIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-react'

export const WelcomeSection: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Main Welcome Card */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl shadow-sm p-8 border border-green-200">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <span className="text-4xl">🌿</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Chào mừng đến với Hệ thống Phân tích Cây & Bệnh
          </h2>
          <p className="text-gray-700 text-lg">
            Sử dụng AI để nhận diện cây trồng và phát hiện bệnh một cách nhanh chóng và chính xác
          </p>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LightbulbIcon size={20} className="text-yellow-500" />
            Cách sử dụng
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center text-center p-4 bg-green-50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <UploadIcon size={24} className="text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Bước 1: Upload ảnh</h4>
              <p className="text-sm text-gray-600">
                Chọn 1 ảnh cây trồng của bạn (PNG, JPG, WEBP, tối đa 10MB)
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-blue-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <SearchIcon size={24} className="text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Bước 2: Phân tích</h4>
              <p className="text-sm text-gray-600">
                Hệ thống sẽ tự động nhận diện cây và kiểm tra bệnh (mất khoảng 10-30 giây)
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-purple-50 rounded-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <CheckCircleIcon size={24} className="text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Bước 3: Xem kết quả</h4>
              <p className="text-sm text-gray-600">
                Nhận thông tin về cây, bệnh (nếu có) và các phương pháp điều trị phù hợp
              </p>
            </div>
          </div>
        </div>

        {/* Example Result Preview */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>📊</span>
            Ví dụ kết quả phân tích
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <CheckCircleIcon size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">🌱 Cây trồng: Cà chua</div>
                <div className="text-sm text-gray-600 italic">Solanum lycopersicum</div>
                <div className="text-xs text-gray-500 mt-1">Độ tin cậy: 85%</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <AlertCircleIcon size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">🦠 Bệnh phát hiện: Bệnh đốm lá sớm</div>
                <div className="text-sm text-gray-600">Mức độ: Trung bình (75% tin cậy)</div>
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="font-semibold text-gray-900 mb-2">💊 Gợi ý điều trị:</div>
              <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc">
                <li>Thuốc hóa học: Mancozeb, Chlorothalonil</li>
                <li>Phương pháp sinh học: Sử dụng nấm đối kháng</li>
                <li>Biện pháp canh tác: Cải thiện thông gió, tưới nước hợp lý</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Tips & Best Practices */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>💡</span>
          Mẹo để có kết quả tốt nhất
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-green-600 font-bold">✓</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Chụp ảnh rõ ràng</h4>
              <p className="text-sm text-gray-600">
                Đảm bảo ảnh có độ sáng tốt, cây chiếm phần lớn khung hình
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-green-600 font-bold">✓</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Chụp phần bị bệnh</h4>
              <p className="text-sm text-gray-600">
                Nếu cây có dấu hiệu bệnh, hãy chụp phần lá/cành/thân bị ảnh hưởng
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-green-600 font-bold">✓</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Chỉ upload 1 ảnh</h4>
              <p className="text-sm text-gray-600">
                Hệ thống chỉ phân tích 1 ảnh mỗi lần để đảm bảo độ chính xác
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-green-600 font-bold">✓</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Chờ phân tích hoàn tất</h4>
              <p className="text-sm text-gray-600">
                Quá trình phân tích mất khoảng 10-30 giây, vui lòng kiên nhẫn
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircleIcon size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-amber-900 mb-2">⚠️ Lưu ý quan trọng</h4>
            <ul className="text-sm text-amber-800 space-y-1 ml-4 list-disc">
              <li>Chỉ upload ảnh cây trồng. Hình ảnh không liên quan sẽ bị từ chối</li>
              <li>Kết quả phân tích chỉ mang tính tham khảo. Vui lòng tham khảo ý kiến chuyên gia nếu cần</li>
              <li>Đảm bảo ảnh có kích thước hợp lý (tối đa 10MB) để quá trình upload nhanh hơn</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

