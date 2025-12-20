import React, { useEffect, useState } from 'react'

interface Snowflake {
  id: number
  left: number
  animationDuration: number
  animationDelay: number
  opacity: number
  size: number
}

interface SnowEffectProps {
  isDarkMode: boolean
}

export const SnowEffect: React.FC<SnowEffectProps> = ({ isDarkMode }) => {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([])

  useEffect(() => {
    // Tạo 50 bông tuyết với các thuộc tính ngẫu nhiên
    const flakes: Snowflake[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100, // Vị trí ngang ngẫu nhiên (%)
      animationDuration: Math.random() * 3 + 5, // 5-8 giây
      animationDelay: Math.random() * 5, // Delay ngẫu nhiên 0-5 giây
      opacity: Math.random() * 0.4 + 0.3, // Độ trong suốt 0.3-0.7
      size: Math.random() * 20 + 10, // Kích thước 10-45px (tăng gấp 5 lần)
    }))
    setSnowflakes(flakes)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute animate-snow"
          style={{
            left: `${flake.left}%`,
            top: '-10px',
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            borderRadius: '50%',
            backgroundColor: isDarkMode
              ? `rgba(255, 255, 255, ${flake.opacity})`
              : `rgba(245, 248, 250, ${flake.opacity})`,
            boxShadow: isDarkMode
              ? `0 0 ${flake.size * 2}px rgba(255, 255, 255, ${flake.opacity * 0.5})`
              : `0 0 ${flake.size * 2}px rgba(245, 248, 250, ${flake.opacity * 0.5})`,
            animation: `snowfall ${flake.animationDuration}s linear infinite`,
            animationDelay: `${flake.animationDelay}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes snowfall {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
          }
          25% {
            transform: translateY(25vh) translateX(10px) rotate(90deg);
          }
          50% {
            transform: translateY(50vh) translateX(-10px) rotate(180deg);
          }
          75% {
            transform: translateY(75vh) translateX(5px) rotate(270deg);
          }
          100% {
            transform: translateY(100vh) translateX(0) rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}

