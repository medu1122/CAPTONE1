import { useState, useEffect } from 'react'
interface ForecastDay {
  date: string
  minTemp: number
  maxTemp: number
  chanceOfRain: number
  condition: {
    text: string
    code: number
  }
}
interface WeatherData {
  location: {
    city: string
    region: string
    country: string
  }
  current: {
    temp_c: number
    temp_f: number
    condition: {
      text: string
      code: number
    }
    wind_kph: number
    humidity: number
    feelslike_c: number
  }
  forecast: {
    minTemp: number
    maxTemp: number
    chanceOfRain: number
    days: ForecastDay[]
  }
}
// This is a mock function that would be replaced with actual API calls
const fetchWeatherAndLocation = async (
  location: string = 'Hà Nội',
): Promise<WeatherData> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))
  // Generate random forecast days
  const days: ForecastDay[] = []
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const date = new Date()
    date.setDate(today.getDate() + i)
    // Generate some random but reasonable weather data
    const minTemp = Math.floor(Math.random() * 5) + 24 // 24-28
    const maxTemp = minTemp + Math.floor(Math.random() * 5) + 2 // min+2 to min+6
    const chanceOfRain = Math.floor(Math.random() * 70) // 0-70%
    const conditionCode = Math.floor(Math.random() * 1500) // Random condition code
    days.push({
      date: date.toISOString().split('T')[0],
      minTemp,
      maxTemp,
      chanceOfRain,
      condition: {
        text: getConditionText(conditionCode),
        code: conditionCode,
      },
    })
  }
  // Return mock data
  return {
    location: {
      city: location.split(',')[0],
      region: location.split(',')[0],
      country: 'Việt Nam',
    },
    current: {
      temp_c: 28,
      temp_f: 82.4,
      condition: {
        text: 'Nhiều mây',
        code: 1030,
      },
      wind_kph: 10.8,
      humidity: 75,
      feelslike_c: 30,
    },
    forecast: {
      minTemp: 26,
      maxTemp: 32,
      chanceOfRain: 40,
      days: days,
    },
  }
}
// Helper function to get condition text based on code
const getConditionText = (code: number): string => {
  if (code < 1030) return 'Trời nắng'
  if (code < 1100) return 'Nhiều mây'
  if (code < 1200) return 'Có mưa'
  if (code < 1300) return 'Có tuyết'
  return 'Giông bão'
}
export const useWeatherLocation = () => {
  const [data, setData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<string>('Hà Nội, Việt Nam')
  const fetchWeather = async (loc: string) => {
    try {
      setLoading(true)
      const weatherData = await fetchWeatherAndLocation(loc)
      setData(weatherData)
      setError(null)
    } catch (err) {
      setError('Không thể lấy dữ liệu thời tiết và vị trí')
      console.error('Error fetching weather and location:', err)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchWeather(location)
  }, [location])
  return {
    data,
    loading,
    error,
    setLocation,
  }
}
