import React from 'react';
import type { ProvinceInfo } from '../../../services/provinceService';
import { MapPin, Thermometer, Droplets } from 'lucide-react';
import { WeatherForecast } from './WeatherForecast';

interface Props {
  info: ProvinceInfo | null;
  loading?: boolean;
}

export const ProvinceBasicInfo: React.FC<Props> = ({ info, loading }) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {/* Title for empty state */}
        <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <MapPin className="text-blue-600" size={24} />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Thông tin cơ bản</h3>
          </div>
          <p className="text-sm text-gray-500 mt-2">Thông tin về đất đai, thời tiết và điều kiện canh tác</p>
        </div>
        
        <div className="text-center text-gray-500 py-8">
          <MapPin className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-lg font-medium mb-2">Chọn một tỉnh trên bản đồ</p>
          <p className="text-sm">Thông tin sẽ được hiển thị tự động khi bạn chọn địa điểm</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
      {/* Header - Compact when has data */}
      <div>
        <div className="flex items-center space-x-2 mb-1">
          <MapPin className="text-blue-600" size={20} />
          <h3 className="text-sm font-medium text-gray-500">Thông tin cơ bản</h3>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{info.provinceName}</h2>
      </div>

      {/* Temperature */}
      {info.temperature !== null && (
        <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
          <Thermometer className="text-blue-600" size={24} />
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Nhiệt độ hiện tại</p>
            <p className="text-2xl font-bold text-blue-600">{info.temperature}°C</p>
            {info.weatherDescription && (
              <p className="text-xs text-gray-500 mt-1">{info.weatherDescription}</p>
            )}
          </div>
        </div>
      )}

      {/* Weather Forecast */}
      {info.weatherForecast && info.weatherForecast.length > 0 && (
        <WeatherForecast forecast={info.weatherForecast} />
      )}

      {/* Soil Types */}
      {info.soilDetails && info.soilDetails.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Droplets className="text-green-600" size={20} />
            <h3 className="font-semibold text-gray-900 dark:text-white">Loại đất chính</h3>
          </div>
          <div className="space-y-2">
            {info.soilDetails.map((soil, idx) => (
              <div
                key={idx}
                className="p-3 bg-green-50 rounded-lg border border-green-200"
              >
                <p className="font-medium text-green-900">{soil.type}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Fallback: Show simple soilTypes if soilDetails not available */}
      {(!info.soilDetails || info.soilDetails.length === 0) && info.soilTypes.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Droplets className="text-green-600" size={20} />
            <h3 className="font-semibold text-gray-900 dark:text-white">Loại đất chính</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {info.soilTypes.map((soil, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium"
              >
                {soil}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Source */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500">
          Nguồn: {info.source}
        </p>
      </div>
    </div>
  );
};

