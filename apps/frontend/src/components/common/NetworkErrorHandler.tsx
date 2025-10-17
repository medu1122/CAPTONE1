import React, { useState, useEffect } from 'react';
import { AlertTriangleIcon, WifiIcon, WifiOffIcon, RotateCcwIcon, MapPinIcon } from 'lucide-react';

export interface NetworkError {
  type: 'network' | 'permission' | 'timeout' | 'server' | 'unknown';
  message: string;
  canRetry: boolean;
  retryCount: number;
  maxRetries: number;
}

interface NetworkErrorHandlerProps {
  error: NetworkError | null;
  onRetry: () => void;
  onDismiss: () => void;
  className?: string;
}

export const NetworkErrorHandler: React.FC<NetworkErrorHandlerProps> = ({
  error,
  onRetry,
  onDismiss,
  className = ''
}) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (isRetrying) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const getErrorIcon = () => {
    switch (error?.type) {
      case 'network':
        return <WifiOffIcon size={20} className="text-red-500" />;
      case 'permission':
        return <MapPinIcon size={20} className="text-amber-500" />;
      case 'timeout':
        return <AlertTriangleIcon size={20} className="text-orange-500" />;
      case 'server':
        return <WifiIcon size={20} className="text-red-500" />;
      default:
        return <AlertTriangleIcon size={20} className="text-red-500" />;
    }
  };

  const getErrorTitle = () => {
    switch (error?.type) {
      case 'network':
        return 'Lỗi kết nối mạng';
      case 'permission':
        return 'Quyền truy cập bị từ chối';
      case 'timeout':
        return 'Hết thời gian chờ';
      case 'server':
        return 'Lỗi máy chủ';
      default:
        return 'Đã xảy ra lỗi';
    }
  };

  const getErrorDescription = () => {
    switch (error?.type) {
      case 'network':
        return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet của bạn.';
      case 'permission':
        return 'Ứng dụng cần quyền truy cập vị trí để cung cấp thông tin thời tiết chính xác.';
      case 'timeout':
        return 'Yêu cầu mất quá nhiều thời gian để xử lý. Vui lòng thử lại.';
      case 'server':
        return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.';
      default:
        return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';
    }
  };

  const getRetryButtonText = () => {
    if (isRetrying) return 'Đang thử lại...';
    if (error?.retryCount && error.retryCount > 0) {
      return `Thử lại (${error.retryCount}/${error.maxRetries})`;
    }
    return 'Thử lại';
  };

  if (!error) return null;

  return (
    <div className={`bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start shadow-sm ${className}`}>
      <div className="flex-shrink-0 mr-3">
        {getErrorIcon()}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">{getErrorTitle()}</h3>
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-600 ml-2"
            aria-label="Đóng thông báo lỗi"
          >
            ×
          </button>
        </div>
        
        <p className="text-sm mt-1 text-red-700">
          {getErrorDescription()}
        </p>
        
        {error.canRetry && (
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleRetry}
              disabled={isRetrying || (error.retryCount >= error.maxRetries)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRetrying ? (
                <RotateCcwIcon size={14} className="animate-spin -ml-0.5 mr-2" />
              ) : (
                <RotateCcwIcon size={14} className="-ml-0.5 mr-2" />
              )}
              {getRetryButtonText()}
            </button>
            
            {error.retryCount >= error.maxRetries && (
              <span className="text-xs text-red-600">
                Đã thử lại tối đa {error.maxRetries} lần
              </span>
            )}
          </div>
        )}
        
        {error.type === 'permission' && (
          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
            <strong>Gợi ý:</strong> Vui lòng cấp quyền truy cập vị trí trong cài đặt trình duyệt hoặc nhập tên thành phố thủ công.
          </div>
        )}
      </div>
    </div>
  );
};

// Hook for managing network errors
export const useNetworkError = () => {
  const [error, setError] = useState<NetworkError | null>(null);

  const setNetworkError = (type: NetworkError['type'], message: string, retryCount: number = 0) => {
    setError({
      type,
      message,
      canRetry: retryCount < 3,
      retryCount,
      maxRetries: 3
    });
  };

  const clearError = () => {
    setError(null);
  };

  const incrementRetryCount = () => {
    if (error) {
      setError({
        ...error,
        retryCount: error.retryCount + 1,
        canRetry: error.retryCount + 1 < error.maxRetries
      });
    }
  };

  return {
    error,
    setNetworkError,
    clearError,
    incrementRetryCount
  };
};
