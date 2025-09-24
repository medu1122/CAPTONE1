// Removed lucide-react import to fix build error

export function HowItWorks() {
  const steps = [
    {
      emoji: "📸",
      title: "Upload Image / Ask Question",
      description: "Take a photo of your plant or type your question about plant care, diseases, or products."
    },
    {
      emoji: "🤖",
      title: "AI Analysis & Results",
      description: "Our AI analyzes your input and provides detailed results with step-by-step guidance."
    },
    {
      emoji: "📖",
      title: "Knowledge Hub & Marketplace",
      description: "Explore our Knowledge Hub for more information or visit the Marketplace for solutions."
    }
  ];

  return (
    <section className="relative py-20 bg-gradient-to-br from-green-50 via-green-100 to-green-50">
      {/* Top gradient transition */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-green-50 to-transparent" />
      {/* Bottom gradient transition */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white/60 to-transparent" />
      <div className="relative z-10 w-full px-4">
        <div className="w-full">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4 text-green-800">
              How It Works
            </h2>
            <p className="text-lg text-green-700">
              Get plant care assistance in just 3 simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
                  {/* Step Number */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center">
                    {index + 1}
                  </div>
                  
                  {/* Icon */}
                  <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">{step.emoji}</span>
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl mb-4 text-green-800">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                
                {/* Arrow */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <div className="w-8 h-8 text-green-600 flex items-center justify-center text-2xl">
                      →
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}