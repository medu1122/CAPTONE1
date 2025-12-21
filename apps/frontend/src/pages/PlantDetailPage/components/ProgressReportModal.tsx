import React, { useState, useEffect } from 'react';
import { 
  XIcon, 
  TrendingUpIcon, 
  AlertCircleIcon, 
  CheckCircle2Icon,
  Loader2Icon,
  SparklesIcon
} from 'lucide-react';
import { getProgressReport, type ProgressReportResponse } from '../../../services/plantBoxService';

interface ProgressReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  plantBoxId: string;
}

export const ProgressReportModal: React.FC<ProgressReportModalProps> = ({
  isOpen,
  onClose,
  plantBoxId,
}) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ProgressReportResponse['data'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && plantBoxId) {
      fetchProgressReport();
    }
  }, [isOpen, plantBoxId]);

  const fetchProgressReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getProgressReport(plantBoxId);
      setReport(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải báo cáo tiến độ');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center gap-3">
            <SparklesIcon size={28} className="text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Báo Cáo Tiến Độ AI
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <XIcon size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2Icon size={48} className="animate-spin text-green-600 mb-4" />
              <p className="text-gray-600 text-lg">Đang phân tích tiến độ...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16">
              <AlertCircleIcon size={48} className="text-red-500 mb-4" />
              <p className="text-red-600 text-lg font-medium">{error}</p>
              <button
                onClick={fetchProgressReport}
                className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : report ? (
            <div className="space-y-6">
              {/* Plant Name */}
              <div className="text-center pb-4 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-green-700">
                  🌱 {report.plantName}
                </h3>
              </div>

              {/* No Strategy Message */}
              {!report.hasStrategy && report.message && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                  <AlertCircleIcon size={48} className="text-yellow-600 mx-auto mb-3" />
                  <p className="text-lg text-yellow-800">{report.message}</p>
                </div>
              )}

              {/* Statistics */}
              {report.hasStrategy && report.statistics && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle2Icon size={24} className="text-green-600" />
                      <span className="text-sm font-medium text-gray-700">Hoàn thành</span>
                    </div>
                    <div className="text-3xl font-bold text-green-700">
                      {report.statistics.completedTasks}/{report.statistics.totalTasks}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {report.statistics.completionRate}% công việc
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUpIcon size={24} className="text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Theo dõi</span>
                    </div>
                    <div className="text-3xl font-bold text-blue-700">
                      {report.statistics.daysTracked}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      ngày chăm sóc
                    </div>
                  </div>
                </div>
              )}

              {/* Health Status */}
              {report.health && (
                <div 
                  className="rounded-xl p-6 border-2" 
                  style={{ 
                    borderColor: report.health.color,
                    backgroundColor: `${report.health.color}10`
                  }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-6xl">{report.health.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-600 mb-1">
                        Tình trạng sức khỏe
                      </div>
                      <div 
                        className="text-2xl font-bold mb-2"
                        style={{ color: report.health.color }}
                      >
                        {report.health.message}
                      </div>
                      <div className="text-sm text-gray-700">
                        {report.summary}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Issues */}
              {report.issues && (
                <div className={`rounded-xl p-5 border ${report.issues.hasIssues ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">
                      {report.issues.hasIssues ? '⚠️' : '✨'}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-gray-600">
                        Vấn đề hiện tại
                      </div>
                      <div className={`text-lg font-bold ${report.issues.hasIssues ? 'text-red-700' : 'text-green-700'}`}>
                        {report.issues.message}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {report.recommendations && report.recommendations.length > 0 && (
                <div className="space-y-3">
                  <div className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    💡 Đề xuất từ AI
                  </div>
                  {report.recommendations.map((rec, index) => {
                    const bgColors = {
                      urgent: 'bg-red-50 border-red-200',
                      health: 'bg-orange-50 border-orange-200',
                      praise: 'bg-green-50 border-green-200',
                      weather: 'bg-blue-50 border-blue-200',
                    };
                    
                    return (
                      <div
                        key={index}
                        className={`rounded-lg p-4 border ${bgColors[rec.type]}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl flex-shrink-0">{rec.icon}</span>
                          <p className="text-gray-800 text-sm flex-1">
                            {rec.message}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

