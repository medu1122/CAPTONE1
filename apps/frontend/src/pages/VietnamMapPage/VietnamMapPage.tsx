import React, { useState } from 'react';
import { Header } from '../ChatAnalyzePage/components/layout/Header';
import { VietnamMapSVG } from './components/VietnamMapSVG';
import { ProvinceSelect } from './components/ProvinceSelect';
import { ProvinceBasicInfo } from './components/ProvinceBasicInfo';
import { ProvinceRecommendations } from './components/ProvinceRecommendations';
import { ProvinceArticles } from './components/ProvinceArticles';
import { useProvinceInfo } from './hooks/useProvinceInfo';
import { Map } from 'lucide-react';

export const VietnamMapPage: React.FC = () => {
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const { data: provinceInfo, loading, error } = useProvinceInfo(selectedProvince);

  const handleProvinceSelect = (code: string) => {
    setSelectedProvince(code);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <Map className="text-green-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">Bản đồ Nông vụ</h1>
          </div>
          <p className="text-gray-600">
            Chọn một tỉnh trên bản đồ hoặc từ danh sách để xem thông tin về loại đất, cây trồng theo mùa và các bài báo liên quan
          </p>
        </div>

        {/* Province Select */}
        <div className="mb-6">
          <ProvinceSelect
            selectedProvince={selectedProvince}
            onProvinceSelect={handleProvinceSelect}
          />
        </div>

        {/* Main Content - Map and Basic Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Map */}
          <div>
            <VietnamMapSVG
              selectedProvince={selectedProvince}
              onProvinceClick={handleProvinceSelect}
            />
          </div>

          {/* Basic Info Panel */}
          <div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
            <ProvinceBasicInfo info={provinceInfo} loading={loading} />
          </div>
        </div>

        {/* Bottom Section - Recommendations and Articles */}
        {selectedProvince && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recommendations */}
            <div>
              <ProvinceRecommendations provinceCode={selectedProvince} />
            </div>

            {/* Articles */}
            <div key={selectedProvince}>
              <ProvinceArticles info={provinceInfo} loading={loading} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

