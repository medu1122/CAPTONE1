import React from 'react';
import type { ProvinceInfo } from '../../../services/provinceService';
import { MapPin, Thermometer, Droplets, Sprout, Wheat, Newspaper, ExternalLink } from 'lucide-react';

interface Props {
  info: ProvinceInfo | null;
  loading?: boolean;
}

export const ProvinceInfoPanel: React.FC<Props> = ({ info, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
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
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center text-gray-500 py-12">
          <MapPin className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-lg">Chọn một tỉnh trên bản đồ để xem thông tin</p>
        </div>
      </div>
    );
  }

  const currentMonth = new Date().getMonth() + 1;
  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{info.provinceName}</h2>
      </div>

      {/* Temperature */}
      {info.temperature !== null && (
        <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
          <Thermometer className="text-blue-600" size={24} />
          <div>
            <p className="text-sm text-gray-600">Nhiệt độ hiện tại</p>
            <p className="text-2xl font-bold text-blue-600">{info.temperature}°C</p>
            {info.weatherDescription && (
              <p className="text-xs text-gray-500 mt-1">{info.weatherDescription}</p>
            )}
          </div>
        </div>
      )}

      {/* Soil Types */}
      {info.soilDetails && info.soilDetails.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Droplets className="text-green-600" size={20} />
            <h3 className="font-semibold text-gray-900">Loại đất chính</h3>
          </div>
          <div className="space-y-3">
            {info.soilDetails.map((soil, idx) => (
              <div
                key={idx}
                className="p-3 bg-green-50 rounded-lg border border-green-200"
              >
                <p className="font-medium text-green-900 mb-1">{soil.type}</p>
                {(soil.domsoil || soil.faosoil) && (
                  <div className="flex flex-wrap gap-2 text-xs text-green-700">
                    {soil.domsoil && (
                      <span className="px-2 py-0.5 bg-green-200 rounded">
                        DOM: {soil.domsoil}
                      </span>
                    )}
                    {soil.faosoil && (
                      <span className="px-2 py-0.5 bg-green-200 rounded">
                        FAO: {soil.faosoil}
                      </span>
                    )}
                  </div>
                )}
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
            <h3 className="font-semibold text-gray-900">Loại đất chính</h3>
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

      {/* Crop Calendar */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">
          {monthNames[currentMonth - 1]} ({info.currentMonth.month})
        </h3>

        {info.currentMonth.planting.length > 0 && (
          <div className="mb-4 p-3 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Sprout className="text-green-600" size={18} />
              <span className="font-medium text-green-800">Có thể trồng:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {info.currentMonth.planting.map((crop, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-green-200 text-green-900 rounded text-sm"
                >
                  {crop}
                </span>
              ))}
            </div>
          </div>
        )}

        {info.currentMonth.harvesting.length > 0 && (
          <div className="p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Wheat className="text-orange-600" size={18} />
              <span className="font-medium text-orange-800">Có thể thu hoạch:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {info.currentMonth.harvesting.map((crop, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-orange-200 text-orange-900 rounded text-sm"
                >
                  {crop}
                </span>
              ))}
            </div>
          </div>
        )}

        {info.currentMonth.planting.length === 0 && info.currentMonth.harvesting.length === 0 && (
          <p className="text-gray-500 text-sm">Chưa có thông tin cây trồng cho tháng này</p>
        )}
      </div>

      {/* Articles */}
      {info.articles.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Newspaper className="text-blue-600" size={20} />
            <h3 className="font-semibold text-gray-900">Bài báo liên quan</h3>
          </div>
          <ul className="space-y-2">
            {info.articles.map((article, idx) => (
              <li key={idx} className="border-l-4 border-blue-500 pl-3 py-1">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1"
                >
                  <span>{article.title}</span>
                  <ExternalLink size={14} />
                </a>
                {article.source && (
                  <p className="text-xs text-gray-500 mt-1">{article.source}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Source */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Nguồn: {info.source}
        </p>
      </div>
    </div>
  );
};

