import React from 'react';
import type { WeatherForecastDay } from '../../../services/provinceService';
import { Calendar } from 'lucide-react';

interface Props {
  forecast: WeatherForecastDay[] | null;
}

const getWeatherIcon = (icon: string) => {
  // OpenWeather icon codes
  if (icon.includes('01')) return '☀️'; // clear sky
  if (icon.includes('02')) return '⛅'; // few clouds
  if (icon.includes('03') || icon.includes('04')) return '☁️'; // clouds
  if (icon.includes('09') || icon.includes('10')) return '🌧️'; // rain
  if (icon.includes('11')) return '⛈️'; // thunderstorm
  if (icon.includes('13')) return '❄️'; // snow
  if (icon.includes('50')) return '🌫️'; // mist
  return '🌤️';
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Hôm nay';
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Ngày mai';
  }

  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const dayName = dayNames[date.getDay()];
  const day = date.getDate();
  const month = date.getMonth() + 1;
  return `${dayName}, ${day}/${month}`;
};

export const WeatherForecast: React.FC<Props> = ({ forecast }) => {
  if (!forecast || forecast.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <div className="flex items-center space-x-2 mb-4">
        <Calendar className="text-blue-600" size={20} />
        <h3 className="font-semibold text-gray-900 dark:text-white">Dự báo thời tiết</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {forecast.map((day, idx) => (
          <div
            key={idx}
            className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200 text-center"
          >
            {/* Date */}
            <p className="text-sm font-medium text-gray-700 mb-2">
              {formatDate(day.date)}
            </p>

            {/* Weather Icon */}
            <div className="mb-2">
              <span className="text-3xl">{getWeatherIcon(day.icon)}</span>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-600 capitalize">
              {day.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

