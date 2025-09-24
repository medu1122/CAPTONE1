import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function HeroSection() {
  const [query, setQuery] = useState("");
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
            GreenGrow
          </h1>
          
          <p className="text-lg md:text-xl text-green-50 mb-8 max-w-2xl mx-auto drop-shadow-md">
            Smart Plant Support System
          </p>
          
          <div
  className="
    w-full mx-auto
    max-w-[640px] sm:max-w-xl md:max-w-2xl lg:max-w-3xl
    bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl
    p-6 md:p-10 border border-white/20
  "
>
            {/* Ask AI Search Box */}
            <div className="max-w-2xl mx-auto">
              <div className="relative flex items-center mb-4">
                <Input
                  type="text"
                  placeholder="Ask AI about your plant..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 h-12 px-4 text-gray-700 bg-gray-100 border-0 rounded-l-lg focus:ring-2 focus:ring-green-500"
                />
                <Button className="h-12 px-6 bg-green-500 hover:bg-green-600 text-white rounded-r-lg border-0 flex items-center gap-2">
                  📷
                  <span className="hidden sm:inline">Search/Ask</span>
                </Button>
              </div>
              
              {/* Quick Suggestions */}
              <div className="text-left">
                <p className="text-sm text-gray-600 mb-2">Quick suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  <button className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors">
                    "Bệnh trên lá xoài"
                  </button>
                  <button className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors">
                    "Cách tưới lan"
                  </button>
                  <button className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors">
                    "Phòng ngừa sâu cuốn lá lúa"
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}