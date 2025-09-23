import React from "react";
import { Button } from "./ui/button";

const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">🌱</span>
          </div>
          <span className="text-xl font-semibold text-white drop-shadow-lg">
            GreenGrow
          </span>
        </div>

        {/* Nav */}
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-white/90 hover:text-white transition-colors drop-shadow-md">
            Features
          </a>
          <a href="#community" className="text-white/90 hover:text-white transition-colors drop-shadow-md">
            Community
          </a>
          <a href="#knowledge" className="text-white/90 hover:text-white transition-colors drop-shadow-md">
            Knowledge Hub
          </a>
          <a href="#marketplace" className="text-white/90 hover:text-white transition-colors drop-shadow-md">
            Marketplace
          </a>
          <a href="#about" className="text-white/90 hover:text-white transition-colors drop-shadow-md">
            About Us
          </a>
        </nav>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="hidden sm:inline-flex border-white/30 text-white hover:bg-white/10 hover:text-white"
          >
            Sign In
          </Button>
          <Button className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm">
            Register
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
