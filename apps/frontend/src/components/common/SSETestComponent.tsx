import React, { useState, useEffect } from 'react';
import { streamingChatService } from '../../services/streamingChatService';
import { CheckCircleIcon, XCircleIcon, Loader2Icon } from 'lucide-react';

export const SSETestComponent: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [streamingResponse, setStreamingResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const testConnection = async () => {
    setConnectionStatus('testing');
    try {
      const isAvailable = await streamingChatService.testConnection();
      setConnectionStatus(isAvailable ? 'connected' : 'error');
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('error');
    }
  };

  const testStreaming = async () => {
    if (!testMessage.trim()) return;
    
    setIsStreaming(true);
    setStreamingResponse('');
    
    try {
      await streamingChatService.startStreamingChat(
        { message: testMessage },
        // onChunk
        (chunk) => {
          if (chunk.content) {
            setStreamingResponse(prev => prev + chunk.content);
          }
        },
        // onComplete
        (finalResponse) => {
          console.log('Streaming completed:', finalResponse);
          setIsStreaming(false);
        },
        // onError
        (error) => {
          console.error('Streaming error:', error);
          setIsStreaming(false);
        }
      );
    } catch (error) {
      console.error('Failed to start streaming:', error);
      setIsStreaming(false);
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'testing':
        return <Loader2Icon size={16} className="animate-spin text-blue-500" />;
      case 'connected':
        return <CheckCircleIcon size={16} className="text-green-500" />;
      case 'error':
        return <XCircleIcon size={16} className="text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'testing':
        return 'Đang kiểm tra kết nối...';
      case 'connected':
        return 'Kết nối SSE thành công';
      case 'error':
        return 'Lỗi kết nối SSE';
      default:
        return 'Chưa kiểm tra';
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-medium mb-4">SSE Connection Test</h3>
      
      {/* Connection Status */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          {getStatusIcon()}
          <span className="font-medium">Trạng thái kết nối:</span>
          <span className={`px-2 py-1 rounded text-sm ${
            connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
            connectionStatus === 'error' ? 'bg-red-100 text-red-800' :
            connectionStatus === 'testing' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {getStatusText()}
          </span>
        </div>
        
        <button
          onClick={testConnection}
          disabled={connectionStatus === 'testing'}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {connectionStatus === 'testing' ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}
        </button>
      </div>

      {/* Streaming Test */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Test streaming message:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Nhập tin nhắn test..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={testStreaming}
            disabled={!testMessage.trim() || isStreaming}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {isStreaming ? 'Đang stream...' : 'Test Stream'}
          </button>
        </div>
      </div>

      {/* Streaming Response */}
      {streamingResponse && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Streaming Response:
          </label>
          <div className="p-3 bg-gray-50 rounded-md border">
            <pre className="whitespace-pre-wrap text-sm">
              {streamingResponse}
              {isStreaming && (
                <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1" />
              )}
            </pre>
          </div>
        </div>
      )}

      {/* Debug Info */}
      <div className="text-xs text-gray-500">
        <p>SSE Endpoint: /api/v1/chat-analyze/stream</p>
        <p>Method: POST</p>
        <p>Headers: Accept: text/event-stream</p>
      </div>
    </div>
  );
};
