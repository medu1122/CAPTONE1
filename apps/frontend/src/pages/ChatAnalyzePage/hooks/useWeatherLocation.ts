import { useState, useEffect } from 'react'
import { weatherService } from '../../../services/weatherService'
import { geolocationService } from '../../../services/geolocationService'

// Predefined locations with coordinates for reliable weather data
const AVAILABLE_LOCATIONS = [
  { name: 'Hà Nội, Việt Nam', lat: 21.0285, lon: 105.8542 },
  { name: 'Hồ Chí Minh, Việt Nam', lat: 10.8231, lon: 106.6297 },
  { name: 'Đà Nẵng, Việt Nam', lat: 16.0544, lon: 108.2022 },
  { name: 'Cần Thơ, Việt Nam', lat: 10.0452, lon: 105.7469 },
  { name: 'Nha Trang, Việt Nam', lat: 12.2388, lon: 109.1967 },
  { name: 'Huế, Việt Nam', lat: 16.4637, lon: 107.5909 },
  { name: 'Hải Phòng, Việt Nam', lat: 20.8449, lon: 106.6881 },
  { name: 'Đà Lạt, Việt Nam', lat: 11.9404, lon: 108.4583 },
]
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
// Real API function to fetch weather data from backend using coordinates
const fetchWeatherAndLocation = async (
  location: string = 'Hà Nội',
): Promise<WeatherData> => {
  try {
    let lat: number | undefined
    let lon: number | undefined
    let cityName: string | undefined
    let originalCityName: string | undefined

    // Check if location contains coordinates (lat,lon format)
    const coordMatch = location.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/)
    if (coordMatch) {
      // Use provided coordinates
      lat = parseFloat(coordMatch[1])
      lon = parseFloat(coordMatch[2])
      console.log(`Using provided coordinates: lat=${lat}, lon=${lon}`)
      
      // Find original city name from predefined locations
      const predefinedLocation = AVAILABLE_LOCATIONS.find(loc => 
        lat !== undefined && lon !== undefined &&
        Math.abs(loc.lat - lat) < 0.01 && Math.abs(loc.lon - lon) < 0.01
      )
      if (predefinedLocation) {
        originalCityName = predefinedLocation.name
        console.log(`Found original city name: ${originalCityName}`)
      }
    } else {
      // Try to get user's current location first
      try {
        const userLocation = await geolocationService.getCurrentPosition()
        lat = userLocation.lat
        lon = userLocation.lon
        console.log(`Using user's current location: lat=${lat}, lon=${lon}`)
      } catch (geoError) {
        console.log('Geolocation failed, trying location search:', geoError)
        // Fallback: try to search for location coordinates
        try {
          const searchResults = await geolocationService.searchLocation(location)
          if (searchResults.length > 0) {
            const searchResult = searchResults[0]
            lat = searchResult.lat
            lon = searchResult.lon
            console.log(`Using location search result: lat=${lat}, lon=${lon}`)
          } else {
            throw new Error('No locations found for search query')
          }
        } catch (searchError) {
          // Final fallback: use city name
          cityName = location.split(',')[0].trim()
          console.log(`Fallback to city name: ${cityName}`)
        }
      }
    }

    // Call real weather service with coordinates priority
    const response = await weatherService.getCurrentWeather({
      cityName,
      lat,
      lon
    })

    if (!response.success || !response.data) {
      throw new Error('Invalid weather response from backend')
    }

    const { data } = response

    // Transform backend response to frontend format
    const forecastDays: ForecastDay[] = data.forecast.map((day: any) => ({
      date: day.date,
      minTemp: day.temperature.min,
      maxTemp: day.temperature.max,
      chanceOfRain: day.rain || 0,
      condition: {
        text: day.description,
        code: getConditionCode(day.description)
      }
    }))

    return {
      location: {
        city: originalCityName || data.location.name,
        region: originalCityName || data.location.name,
        country: data.location.country,
      },
      current: {
        temp_c: data.current.temperature,
        temp_f: Math.round((data.current.temperature * 9/5) + 32),
        condition: {
          text: data.current.description,
          code: getConditionCode(data.current.description),
        },
        wind_kph: data.current.windSpeed,
        humidity: data.current.humidity,
        feelslike_c: data.current.temperature, // Backend doesn't provide feels like
      },
      forecast: {
        minTemp: Math.min(...data.forecast.map((d: any) => d.temperature.min)),
        maxTemp: Math.max(...data.forecast.map((d: any) => d.temperature.max)),
        chanceOfRain: Math.round(data.forecast.reduce((sum: number, d: any) => sum + (d.rain || 0), 0) / data.forecast.length),
        days: forecastDays,
      },
    }
  } catch (error) {
    console.error('Weather API error:', error)
    throw new Error(`Failed to fetch weather data: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
// Helper function to get condition code from description
const getConditionCode = (description: string): number => {
  const desc = description.toLowerCase()
  if (desc.includes('clear') || desc.includes('sunny') || desc.includes('nắng')) return 1000
  if (desc.includes('cloud') || desc.includes('mây')) return 1030
  if (desc.includes('rain') || desc.includes('mưa')) return 1180
  if (desc.includes('snow') || desc.includes('tuyết')) return 1210
  if (desc.includes('storm') || desc.includes('thunder') || desc.includes('giông')) return 1300
  return 1030 // Default to cloudy
}

export const useWeatherLocation = () => {
  const [data, setData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<string>('Hà Nội, Việt Nam')
  const fetchWeather = async (loc: string) => {
    try {
      setLoading(true)
      setError(null)
      const weatherData = await fetchWeatherAndLocation(loc)
      setData(weatherData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể lấy dữ liệu thời tiết'
      
      // Check for specific errors
      if (errorMessage.includes('500')) {
        setError('Lỗi cấu hình backend: Thiếu API key OpenWeather')
      } else if (errorMessage.includes('404')) {
        setError('Không tìm thấy endpoint thời tiết trên backend')
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setError('Không thể kết nối với backend server')
      } else if (errorMessage.includes('permission') || errorMessage.includes('geolocation')) {
        setError('Cần quyền truy cập vị trí để lấy dữ liệu thời tiết chính xác')
      } else if (errorMessage.includes('coordinates')) {
        setError('Không thể xác định vị trí. Vui lòng cho phép truy cập vị trí hoặc chọn thành phố khác')
      } else {
        setError(errorMessage)
      }
      
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
