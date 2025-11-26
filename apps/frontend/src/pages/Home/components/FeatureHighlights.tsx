export function FeatureHighlights() {
    const features = [
      {
        emoji: "🌱",
        title: "AI Plant Analysis",
        description: "Advanced AI identifies plant issues and provides instant diagnosis"
      },
      {
        emoji: "💊",
        title: "Treatment Suggestions",
        description: "Get personalized treatment recommendations for your plants"
      },
      {
        emoji: "☀️",
        title: "Weather Alerts (SMS)",
        description: "Receive timely weather alerts to protect your crops"
      },
      {
        emoji: "📚",
        title: "Knowledge Hub",
        description: "Access comprehensive plant care guides and expert advice"
      },
      {
        emoji: "👩‍🌾",
        title: "Farmer Community",
        description: "Connect with fellow farmers and share experiences"
      }
    ];
  
    return (
      <section id="features" className="relative py-20 bg-gradient-to-b from-white via-green-50/30 to-green-50">
        {/* Subtle top gradient overlay */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white/80 to-transparent" />
        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl mb-4 text-green-800">
                Everything You Need for Plant Care
              </h2>
              <p className="text-lg text-muted-foreground">
                Comprehensive tools and resources for modern agriculture
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow bg-green-50/50"
                >
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">{feature.emoji}</span>
                  </div>
                  <h3 className="text-xl mb-3 text-green-800">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }