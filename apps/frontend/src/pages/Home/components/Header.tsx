import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserMenu } from "@/components/UserMenu";

export function Header() {
  const { isAuthenticated } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/home" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">🌱</span>
          </div>
          <span className="text-xl font-semibold text-white drop-shadow-lg">GreenGrow</span>
        </Link>
        
        {/* Navigation Menu */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link 
            to="/analyze" 
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors drop-shadow-md group"
          >
            <span className="text-xl">🔬</span>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">Phân Tích</span>
              <span className="text-xs text-white/70 group-hover:text-white/90">Nhận diện & bệnh</span>
            </div>
          </Link>
          <Link 
            to="/knowledge" 
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors drop-shadow-md group"
          >
            <span className="text-xl">📚</span>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">Kiến Thức</span>
              <span className="text-xs text-white/70 group-hover:text-white/90">Hỏi đáp AI</span>
            </div>
          </Link>
          <Link 
            to="/community" 
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors drop-shadow-md group"
          >
            <span className="text-xl">👥</span>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">Cộng Đồng</span>
              <span className="text-xs text-white/70 group-hover:text-white/90">Chia sẻ</span>
            </div>
          </Link>
          <Link 
            to="/map" 
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors drop-shadow-md group"
          >
            <span className="text-xl">🗺️</span>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">Bản đồ Nông vụ</span>
              <span className="text-xs text-white/70 group-hover:text-white/90">Đất đai & cây trồng</span>
            </div>
          </Link>
          <Link 
            to="/my-plants" 
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors drop-shadow-md group"
          >
            <span className="text-xl">🌿</span>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">Vườn</span>
              <span className="text-xs text-white/70 group-hover:text-white/90">Quản lý</span>
            </div>
          </Link>
        </nav>
        
        {/* CTA Buttons - Chỉ hiển thị khi chưa đăng nhập */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="[&_button]:text-white [&_button]:hover:bg-white/10 [&_span]:text-white [&_img]:ring-white/30">
              <UserMenu />
            </div>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline" className="hidden sm:inline-flex border-white/30 text-gray-900 hover:bg-white/10 bg-white/90 backdrop-blur-sm">
                  Đăng Nhập
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-green-600 hover:bg-green-700 text-white border border-green-600">
                  Đăng Ký
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}