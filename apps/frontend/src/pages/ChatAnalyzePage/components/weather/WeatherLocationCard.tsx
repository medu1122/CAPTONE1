import React, { useState } from 'react'
import {
  MapPinIcon,
  CloudIcon,
  SunIcon,
  CloudRainIcon,
  CloudSnowIcon,
  CloudLightningIcon,
  WindIcon,
  ThermometerIcon,
  ChevronDownIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react'
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
interface WeatherLocationCardProps {
  data: WeatherData | null
  loading: boolean
  error: string | null
  onChangeLocation?: (location: string) => void
}
const AVAILABLE_LOCATIONS = [
  'Hà Nội, Việt Nam',
  'Hồ Chí Minh, Việt Nam',
  'Đà Nẵng, Việt Nam',
  'Cần Thơ, Việt Nam',
  'Nha Trang, Việt Nam',
  'Huế, Việt Nam',
  'Hải Phòng, Việt Nam',
  'Đà Lạt, Việt Nam',
]
export const WeatherLocationCard: React.FC<WeatherLocationCardProps> = ({
  data,
  loading,
  error,
  onChangeLocation = () => {},
}) => {
  const [showLocationSelector, setShowLocationSelector] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-3 mb-3 flex items-center justify-center">
        <div className="animate-pulse flex space-x-4 w-full">
          <div className="rounded-full bg-gray-200 h-10 w-10"></div>
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }
  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-3 mb-3">
        <div className="text-center text-red-500">
          <p>{error}</p>
          <p className="text-xs text-gray-500">
            Không thể tải dữ liệu thời tiết và vị trí
          </p>
        </div>
      </div>
    )
  }
  if (!data) return null
  const getWeatherIcon = (code: number, size: number = 32) => {
    // Simple mapping of weather condition codes to icons
    if (code < 1030) return <SunIcon size={size} className="text-amber-500" />
    if (code < 1100) return <CloudIcon size={size} className="text-gray-500" />
    if (code < 1200)
      return <CloudRainIcon size={size} className="text-blue-500" />
    if (code < 1300)
      return <CloudSnowIcon size={size} className="text-blue-300" />
    return <CloudLightningIcon size={size} className="text-purple-500" />
  }
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: 'numeric',
      month: 'numeric',
    })
  }
  const filteredLocations = AVAILABLE_LOCATIONS.filter((location) =>
    location.toLowerCase().includes(searchTerm.toLowerCase()),
  )
  const handleLocationSelect = (location: string) => {
    onChangeLocation(location)
    setShowLocationSelector(false)
    setSearchTerm('')
  }
  return (
    <div className="bg-white rounded-2xl shadow-sm mb-3">
      <div className="p-3">
        <div className="flex items-center">
          {/* Location selector */}
          <div className="relative mr-3">
            <button
              onClick={() => setShowLocationSelector(true)}
              className="flex items-center text-left hover:bg-gray-50 p-1 rounded-lg transition-colors"
            >
              <MapPinIcon
                size={18}
                className="text-green-600 mr-1.5 flex-shrink-0"
              />
              <div>
                <h2 className="font-medium text-sm text-gray-900">
                  {data.location.city}
                </h2>
                <p className="text-xs text-gray-500">{data.location.region}</p>
              </div>
              <ChevronDownIcon size={14} className="ml-1 text-gray-400" />
            </button>
            {/* Location selector dropdown */}
            {showLocationSelector && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg z-10 border border-gray-200">
                <div className="p-2 border-b">
                  <div className="relative">
                    <SearchIcon
                      size={16}
                      className="absolute left-2 top-2.5 text-gray-400"
                    />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Tìm kiếm địa điểm..."
                      className="w-full pl-8 pr-8 py-1.5 border rounded-md text-sm"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        <XIcon size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {filteredLocations.map((location, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      onClick={() => handleLocationSelect(location)}
                    >
                      {location}
                    </button>
                  ))}
                  {filteredLocations.length === 0 && (
                    <div className="px-4 py-2 text-sm text-gray-500 text-center">
                      Không tìm thấy địa điểm
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Current weather - compact */}
          <div className="flex items-center">
            {getWeatherIcon(data.current.condition.code, 24)}
            <div className="mx-2">
              <div className="font-medium">{data.current.temp_c}°C</div>
              <div className="text-xs text-gray-500">
                {data.current.condition.text}
              </div>
            </div>
            <div className="flex space-x-3 text-xs text-gray-600 ml-1">
              <div className="flex items-center">
                <ThermometerIcon size={12} className="mr-1" />
                <span>
                  {data.forecast.minTemp}°/{data.forecast.maxTemp}°
                </span>
              </div>
              <div className="flex items-center">
                <CloudRainIcon size={12} className="mr-1" />
                <span>{data.forecast.chanceOfRain}%</span>
              </div>
            </div>
          </div>
          {/* Forecast section - horizontal scroll */}
          <div className="ml-auto flex-1 overflow-x-auto">
            <div className="flex space-x-3 justify-end">
              {data.forecast.days.map((day, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center min-w-10"
                >
                  <div className="text-xs font-medium text-gray-500 whitespace-nowrap">
                    {formatDate(day.date)}
                  </div>
                  <div className="my-0.5">
                    {getWeatherIcon(day.condition.code, 14)}
                  </div>
                  <div className="text-xs">
                    <span className="font-medium">{day.maxTemp}°</span>
                    <span className="text-gray-500 text-xs ml-0.5">
                      {day.minTemp}°
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}