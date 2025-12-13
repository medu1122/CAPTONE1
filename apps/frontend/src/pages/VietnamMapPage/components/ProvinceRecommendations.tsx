import React from 'react';
import { Bot, Calendar, Loader2, Sprout, Cloud, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useProvinceRecommendation } from '../hooks/useProvinceRecommendation';

interface Props {
  provinceCode: string | null;
}

export const ProvinceRecommendations: React.FC<Props> = ({ provinceCode }) => {
  const { recommendation, loading, error, loadingStates } = useProvinceRecommendation(provinceCode);

  const currentMonth = new Date().getMonth() + 1;
  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-lg p-6 border border-green-200">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-green-600 rounded-lg">
          <Bot className="text-white" size={24} />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900">Tư vấn mùa vụ</h3>
          {provinceCode ? (
            <p className="text-sm text-gray-600 flex items-center space-x-1">
              <Calendar size={14} />
              <span>{monthNames[currentMonth - 1]} ({currentMonth})</span>
            </p>
          ) : (
            <p className="text-sm text-gray-500">Khuyến nghị cây trồng và chăm sóc theo mùa</p>
          )}
        </div>
      </div>

      {/* Content */}
      {!provinceCode ? (
        <div className="text-center text-gray-500 py-8">
          <Bot className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-lg font-medium mb-2">Chọn một tỉnh để xem tư vấn</p>
          <p className="text-sm">Thông tin sẽ được tải tự động khi bạn chọn địa điểm</p>
        </div>
      ) : loading && !recommendation ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-green-600" size={32} />
          <span className="ml-3 text-gray-600">Đang tư vấn...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      ) : recommendation ? (
        <div className="space-y-4">
          {/* Season Info */}
          {recommendation.season && (
            <div className={`bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 shadow-md border-l-4 border-blue-500 hover:shadow-lg transition-all duration-300 ${loadingStates.season ? 'opacity-50' : 'opacity-100'}`}>
              {loadingStates.season ? (
                <div className="flex items-center space-x-3">
                  <Loader2 className="animate-spin text-blue-600" size={20} />
                  <span className="text-gray-600">Đang tải...</span>
                </div>
              ) : (
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-500 rounded-lg flex-shrink-0">
                    <Calendar className="text-white" size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-2 text-lg">Mùa vụ hiện tại</h4>
                    <p className="text-gray-800 text-base leading-relaxed font-medium">
                      {recommendation.season}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Crops */}
          {recommendation.crops && recommendation.crops.length > 0 && (
            <div className={`bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg p-5 shadow-md border-l-4 border-green-500 hover:shadow-lg transition-all duration-300 ${loadingStates.crops ? 'opacity-50' : 'opacity-100'}`}>
              {loadingStates.crops ? (
                <div className="flex items-center space-x-3">
                  <Loader2 className="animate-spin text-green-600" size={20} />
                  <span className="text-gray-600">Đang tải...</span>
                </div>
              ) : (
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-green-500 rounded-lg flex-shrink-0">
                    <Sprout className="text-white" size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="font-bold text-gray-900 text-lg">Cây trồng phù hợp</h4>
                      <div 
                        className="relative group cursor-help"
                        title="Các loại cây trồng phù hợp với thời điểm hiện tại dựa trên điều kiện thời tiết, đất đai và mùa vụ"
                      >
                        <span className="text-gray-400 hover:text-gray-600 text-sm">ℹ️</span>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          Các loại cây trồng phù hợp với thời điểm hiện tại dựa trên điều kiện thời tiết, đất đai và mùa vụ
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {recommendation.crops.map((crop, idx) => (
                        <span
                          key={idx}
                          className="px-4 py-2 bg-white text-green-700 rounded-lg text-sm font-semibold shadow-sm border border-green-200 hover:bg-green-50 hover:shadow-md transition-all"
                        >
                          🌾 {crop}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Harvesting */}
          {recommendation.harvesting && recommendation.harvesting.length > 0 && (
            <div className={`bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-5 shadow-md border-l-4 border-purple-500 hover:shadow-lg transition-all duration-300 ${loadingStates.harvesting ? 'opacity-50' : 'opacity-100'}`}>
              {loadingStates.harvesting ? (
                <div className="flex items-center space-x-3">
                  <Loader2 className="animate-spin text-purple-600" size={20} />
                  <span className="text-gray-600">Đang tải...</span>
                </div>
              ) : (
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-purple-500 rounded-lg flex-shrink-0">
                    <CheckCircle2 className="text-white" size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-3 text-lg">Có thể thu hoạch</h4>
                    <div className="flex flex-wrap gap-2.5">
                      {recommendation.harvesting.map((crop, idx) => (
                        <span
                          key={idx}
                          className="px-4 py-2 bg-white text-purple-700 rounded-lg text-sm font-semibold shadow-sm border border-purple-200 hover:bg-purple-50 hover:shadow-md transition-all"
                        >
                          ✅ {crop}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Weather */}
          {recommendation.weather && (
            <div className={`bg-gradient-to-br from-yellow-50 to-amber-100 rounded-lg p-5 shadow-md border-l-4 border-yellow-500 hover:shadow-lg transition-all duration-300 ${loadingStates.weather ? 'opacity-50' : 'opacity-100'}`}>
              {loadingStates.weather ? (
                <div className="flex items-center space-x-3">
                  <Loader2 className="animate-spin text-yellow-600" size={20} />
                  <span className="text-gray-600">Đang tải...</span>
                </div>
              ) : (
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-yellow-500 rounded-lg flex-shrink-0">
                    <Cloud className="text-white" size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-3 text-lg">Đánh giá thời tiết</h4>
                    <p className="text-gray-800 text-base leading-relaxed font-medium bg-white rounded-lg p-3 shadow-sm">
                      {recommendation.weather}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {recommendation.notes && recommendation.notes.length > 0 && (
            <div className={`bg-gradient-to-br from-orange-50 to-amber-100 rounded-lg p-5 shadow-md border-l-4 border-orange-500 hover:shadow-lg transition-all duration-300 ${loadingStates.notes ? 'opacity-50' : 'opacity-100'}`}>
              {loadingStates.notes ? (
                <div className="flex items-center space-x-3">
                  <Loader2 className="animate-spin text-orange-600" size={20} />
                  <span className="text-gray-600">Đang tải...</span>
                </div>
              ) : (
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-orange-500 rounded-lg flex-shrink-0">
                    <AlertCircle className="text-white" size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-3 text-lg">Lưu ý & Khuyến nghị</h4>
                    <ul className="space-y-3">
                      {recommendation.notes.map((note, idx) => {
                        // Handle both string and Note object formats
                        const noteObj = typeof note === 'string' 
                          ? { text: note, links: [], hasLinks: false }
                          : note;
                        
                        // Extract links from text if not already parsed
                        const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
                        const plainUrlRegex = /(https?:\/\/[^\s\)]+)/g;
                        let displayText = noteObj.text || (typeof note === 'string' ? note : '');
                        const extractedLinks: Array<{text: string, url: string}> = [];
                        
                        // If links already parsed from backend, use them
                        if (noteObj.links && noteObj.links.length > 0) {
                          extractedLinks.push(...noteObj.links);
                          // Remove markdown links from text if still present
                          displayText = displayText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '').trim();
                          displayText = displayText.replace(/(https?:\/\/[^\s\)]+)/g, '').trim();
                        } else {
                          // Extract markdown links from text
                          let match;
                          const sourceText = typeof note === 'string' ? note : (noteObj.raw || displayText);
                          
                          // Try markdown format first
                          while ((match = markdownLinkRegex.exec(sourceText)) !== null) {
                            const linkText = match[1].trim();
                            const linkUrl = match[2].trim();
                            if (linkUrl.startsWith('http://') || linkUrl.startsWith('https://')) {
                              extractedLinks.push({ text: linkText || 'Xem chi tiết', url: linkUrl });
                              displayText = displayText.replace(match[0], '').trim();
                            }
                          }
                          
                          // If no markdown links, try plain URLs
                          if (extractedLinks.length === 0) {
                            while ((match = plainUrlRegex.exec(sourceText)) !== null) {
                              const url = match[1].trim();
                              if (url.startsWith('http://') || url.startsWith('https://')) {
                                extractedLinks.push({ text: 'Xem chi tiết', url: url });
                                displayText = displayText.replace(url, '').trim();
                              }
                            }
                          }
                        }
                        
                        // Clean up display text
                        displayText = displayText
                          .replace(/^["']|["']$/g, '')
                          .replace(/\s+/g, ' ')
                          .trim();
                        
                        return (
                          <li key={idx} className="flex items-start space-x-3 bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                            <CheckCircle2 className="text-orange-600 mt-0.5 flex-shrink-0" size={18} />
                            <div className="flex-1">
                              <p className="text-gray-800 text-base leading-relaxed font-medium">
                                {displayText}
                                {extractedLinks.length > 0 && (
                                  <span className="ml-1">
                                    {extractedLinks.map((link, linkIdx) => (
                                      <a
                                        key={linkIdx}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline font-semibold ml-1 transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {link.text}
                                        <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                      </a>
                                    ))}
                                  </span>
                                )}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fallback: Show if no data at all */}
          {!recommendation.season && !recommendation.crops.length && !recommendation.weather && !recommendation.notes.length && (
            <div className="text-center py-8">
              <Bot className="mx-auto mb-3 text-gray-400" size={40} />
              <p className="text-gray-600">Chưa có dữ liệu tư vấn</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <Bot className="mx-auto mb-3 text-gray-400" size={40} />
          <p className="text-gray-600">Chưa có tư vấn</p>
        </div>
      )}
    </div>
  );
};
