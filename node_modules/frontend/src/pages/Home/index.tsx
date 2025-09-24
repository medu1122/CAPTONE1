import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import {FeatureHighlights} from "./components/FeatureHighlights";
import { HowItWorks } from "./components/HowItWorks";


export default function App() {
  return (
    <div className="min-h-screen bg-white relative">
      <Header />
      <main>
        <HeroSection />
        <FeatureHighlights />
        <HowItWorks />
      
      </main>
    
    </div>
  );
}