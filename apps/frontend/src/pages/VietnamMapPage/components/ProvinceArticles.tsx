import React from 'react';
import type { ProvinceInfo } from '../../../services/provinceService';
import { Newspaper, ExternalLink, Calendar as CalendarIcon } from 'lucide-react';

interface Props {
  info: ProvinceInfo | null;
  loading?: boolean;
}

export const ProvinceArticles: React.FC<Props> = ({ info, loading }) => {
  // Debug logging
  React.useEffect(() => {
    if (info && info.articles) {
      console.log('📰 [ProvinceArticles] Received articles:', {
        total: info.articles.length,
        valid: info.articles.filter(a => a && a.title && a.url).length,
        sample: info.articles.slice(0, 2).map(a => ({
          hasTitle: !!a.title,
          hasUrl: !!a.url,
          title: a.title?.substring(0, 50),
          url: a.url?.substring(0, 50)
        }))
      });
    }
  }, [info]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="flex items-center space-x-2 mb-4 pb-4 border-b border-gray-200">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Newspaper className="text-blue-600" size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">Bài báo liên quan</h3>
            <p className="text-sm text-gray-500">Tin tức về thời tiết, thiên tai và nông nghiệp</p>
          </div>
          <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
        </div>
        
        {/* Articles skeleton */}
        <div className="space-y-3">
          {[1, 2, 3].map((idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden animate-pulse">
              <div className="flex gap-4 p-4">
                <div className="flex-shrink-0 w-32 h-32 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="flex space-x-2">
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                    <div className="h-6 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!info || !info.articles || info.articles.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Title for empty state */}
        <div className="mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Newspaper className="text-blue-600" size={24} />
            <div>
              <h3 className="text-xl font-bold text-gray-900">Bài báo liên quan</h3>
              <p className="text-sm text-gray-500 mt-1">Tin tức về thời tiết, thiên tai và nông nghiệp</p>
            </div>
          </div>
        </div>
        
        <div className="text-center text-gray-500 py-8">
          <Newspaper className="mx-auto mb-3 text-gray-400" size={40} />
          <p className="text-lg font-medium mb-2">Chọn một tỉnh để xem bài báo</p>
          <p className="text-sm">Các bài báo liên quan sẽ được hiển thị tự động</p>
        </div>
      </div>
    );
  }

  // Filter valid articles - more lenient validation
  const validArticles = info.articles.filter(article => {
    if (!article) return false;
    
    const title = (article.title || '').trim();
    const url = (article.url || '').trim();
    
    // Check for invalid titles (more lenient)
    const invalidTitles = ['không có tiêu đề', 'no title', 'untitled', ''];
    const hasValidTitle = title.length >= 3 && !invalidTitles.includes(title.toLowerCase());
    
    // Check for invalid URLs (more lenient)
    const invalidUrls = ['#', ''];
    const hasValidUrl = url.length >= 5 && !invalidUrls.includes(url.toLowerCase());
    
    return hasValidTitle && hasValidUrl;
  });
  
  // Debug: log if we filtered out articles
  if (info.articles.length > 0 && validArticles.length === 0) {
    console.warn('⚠️ [ProvinceArticles] All articles were filtered out:', {
      total: info.articles.length,
      sample: info.articles.slice(0, 2).map(a => ({
        title: a.title?.substring(0, 50),
        titleLength: a.title?.length || 0,
        url: a.url?.substring(0, 50),
        urlLength: a.url?.length || 0
      }))
    });
  }
  
  if (validArticles.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center text-gray-500 py-8">
          <Newspaper className="mx-auto mb-3 text-gray-400" size={40} />
          <p className="text-gray-600">Chưa có bài báo liên quan</p>
          <p className="text-sm text-gray-500 mt-2">
            Các bài báo hiện tại không có đủ thông tin để hiển thị
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header - Compact when has data */}
      <div className="flex items-center space-x-2 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Newspaper className="text-blue-600" size={20} />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900">Bài báo liên quan</h3>
        </div>
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
          {validArticles.length} bài
        </span>
      </div>

      {/* Articles List */}
      <div className="space-y-3">
        {validArticles.map((article, idx) => {
            // Debug: log if article is missing data
            if (!article.title || !article.url) {
              console.warn('Invalid article:', article);
              return null;
            }
            
            return (
              <div
                key={idx}
                className="group border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 hover:shadow-md transition-all"
              >
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="flex gap-4">
                    {/* Article Image - Larger and better styled */}
                    {article.imageUrl && (
                      <div className="flex-shrink-0 w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 overflow-hidden rounded-lg shadow-md group-hover:shadow-lg transition-shadow">
                        <img
                          src={article.imageUrl}
                          alt={article.title || 'Article image'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            // Hide image if failed to load
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Article Content */}
                    <div className="flex-1 min-w-0 p-4">
                      <div className="flex items-start justify-between gap-2 h-full">
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2 text-base md:text-lg">
                              {article.title || 'Không có tiêu đề'}
                            </h4>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 flex-wrap gap-2 mt-auto">
                            {article.source && (
                              <span className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded-full">
                                <span>📰</span>
                                <span className="font-medium">{article.source}</span>
                              </span>
                            )}
                            {article.date && (
                              <span className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded-full">
                                <CalendarIcon size={12} />
                                <span>{new Date(article.date).toLocaleDateString('vi-VN')}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <ExternalLink 
                          className="text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0 mt-1" 
                          size={18} 
                        />
                      </div>
                    </div>
                  </div>
                </a>
              </div>
            );
          })
          .filter(Boolean) // Remove null entries
        }
      </div>
    </div>
  );
};

