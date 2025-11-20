import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function HeroSection() {
  const backgroundHero = new URL("../../../assets/images/background_herosection.jpg", import.meta.url).href;

  return (
    <section className="relative pt-0 pb-32 overflow-hidden min-h-screen">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundHero})` }}
      />
      
      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 via-green-800/30 to-green-700/40" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-green-50/80 to-transparent" />
      
      <div className="relative z-10 w-full px-4 pt-32">
        <div className="w-full text-center">
          {/* Capstone Project Introduction */}
          <h1 className="text-4xl md:text-6xl mb-6 text-white drop-shadow-lg">
            🌿 GreenGrow
          </h1>
          
          <p className="text-lg md:text-xl text-green-50 mb-12 max-w-2xl mx-auto drop-shadow-md">
            Hệ Thống Hỗ Trợ Trồng Trọt Thông Minh
          </p>
          
          {/* Main Action Cards */}
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6 mb-12">
            {/* Analyze Card */}
            <Link to="/analyze">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20 hover:scale-105 transition-transform cursor-pointer group">
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                  🔬
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Phân Tích Cây
                </h3>
                <p className="text-gray-600 mb-4">
                  Upload ảnh để nhận diện cây, phát hiện bệnh, và xem gợi ý điều trị chi tiết
                </p>
                <div className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  Bắt đầu phân tích →
                </div>
              </div>
            </Link>

            {/* Knowledge Card */}
            <Link to="/knowledge">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20 hover:scale-105 transition-transform cursor-pointer group">
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                  📚
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Kiến Thức
                </h3>
                <p className="text-gray-600 mb-4">
                  Hỏi đáp với AI về cây trồng, bệnh hại, cách chăm sóc và phương pháp trồng trọt
                </p>
                <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  Hỏi ngay →
                </div>
              </div>
            </Link>
          </div>

          {/* Quick Suggestions */}
          <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur-sm rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-2">💡 Gợi ý nhanh:</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link to="/knowledge">
                <button className="px-4 py-2 text-sm bg-white hover:bg-gray-50 rounded-full text-gray-700 transition-colors shadow-sm border border-gray-200">
                  "Bệnh đạo ôn lúa"
                </button>
              </Link>
              <Link to="/knowledge">
                <button className="px-4 py-2 text-sm bg-white hover:bg-gray-50 rounded-full text-gray-700 transition-colors shadow-sm border border-gray-200">
                  "Cách chữa khô vằn"
                </button>
              </Link>
              <Link to="/analyze">
                <button className="px-4 py-2 text-sm bg-white hover:bg-gray-50 rounded-full text-gray-700 transition-colors shadow-sm border border-gray-200">
                  "Phân tích ảnh cây"
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}