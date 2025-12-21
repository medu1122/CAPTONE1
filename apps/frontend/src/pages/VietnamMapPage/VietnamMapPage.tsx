import React, { useState, useEffect } from 'react';
import { Header } from '../ChatAnalyzePage/components/layout/Header';
import { VietnamMapSVG } from './components/VietnamMapSVG';
import { ProvinceSelect } from './components/ProvinceSelect';
import { ProvinceBasicInfo } from './components/ProvinceBasicInfo';
import { ProvinceRecommendations } from './components/ProvinceRecommendations';
import { ProvinceArticles } from './components/ProvinceArticles';
import { useProvinceInfo } from './hooks/useProvinceInfo';
import { useProvinceRecommendation } from './hooks/useProvinceRecommendation';
import { Map, AlertCircleIcon } from 'lucide-react';
import { ComplaintModal } from '../../components/ComplaintModal';
import { vietnamProvinces } from '../../data/vietnamProvinces';
import { profileService } from '../../services/profileService';
import { useAuth } from '../../contexts/AuthContext';

export const VietnamMapPage: React.FC = () => {
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const { user } = useAuth();
  const { data: provinceInfo, loading, error } = useProvinceInfo(selectedProvince);
  const { recommendation } = useProvinceRecommendation(selectedProvince);

  // Auto-select location from profile or default to Đà Nẵng
  useEffect(() => {
    const loadLocation = async () => {
      setLoadingLocation(true);
      
      // Default to Đà Nẵng
      const defaultProvince = 'DN';
      
      if (!user) {
        // If not logged in, default to Đà Nẵng
        setSelectedProvince(defaultProvince);
        setLoadingLocation(false);
        return;
      }

      try {
        const profile = await profileService.getProfile();
        if (profile.address?.province) {
          // Find province code from province name
          const province = vietnamProvinces.find(
            p => p.name === profile.address.province || 
                 p.name.toLowerCase() === profile.address.province?.toLowerCase()
          );
          if (province) {
            setSelectedProvince(province.code);
            setLoadingLocation(false);
            return;
          }
        }
        
        // If no province in profile, default to Đà Nẵng
        setSelectedProvince(defaultProvince);
      } catch (error) {
        console.error('Failed to load profile:', error);
        // Default to Đà Nẵng on error
        setSelectedProvince(defaultProvince);
      } finally {
        setLoadingLocation(false);
      }
    };

    loadLocation();
  }, [user]);

  const handleProvinceSelect = (code: string) => {
    setSelectedProvince(code);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <Map className="text-green-600" size={32} />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bản đồ Nông vụ</h1>
            </div>
            {selectedProvince && (
              <button
                onClick={() => setShowComplaintModal(true)}
                className="px-4 py-2 border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors flex items-center gap-2"
              >
                <AlertCircleIcon size={18} />
                <span>Khiếu nại</span>
              </button>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-300">
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

        {/* Bottom Section - Recommendations and Articles - Always visible */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recommendations */}
          <div>
            <ProvinceRecommendations provinceCode={selectedProvince} />
          </div>

          {/* Articles */}
          <div key={selectedProvince || 'empty'}>
            <ProvinceArticles info={provinceInfo} loading={loading} />
          </div>
        </div>
      </div>

      {/* Complaint Modal */}
      <ComplaintModal
        isOpen={showComplaintModal}
        onClose={() => setShowComplaintModal(false)}
        type="map"
        relatedId={selectedProvince || undefined}
        relatedType={selectedProvince ? 'map' : undefined}
        contextData={selectedProvince ? {
          provinceCode: selectedProvince,
          provinceName: provinceInfo?.provinceName,
          provinceInfo: provinceInfo ? {
            temperature: provinceInfo.temperature,
            weatherDescription: provinceInfo.weatherDescription,
            soilTypes: provinceInfo.soilTypes,
            soilDetails: provinceInfo.soilDetails,
            currentMonth: provinceInfo.currentMonth?.month || (typeof provinceInfo.currentMonth === 'number' ? provinceInfo.currentMonth : new Date().getMonth() + 1),
          } : null,
          recommendation: recommendation ? {
            season: recommendation.season,
            crops: recommendation.crops,
            harvesting: recommendation.harvesting,
            weather: recommendation.weather,
            notes: recommendation.notes,
          } : null,
        } : undefined}
        onSuccess={() => {
          alert('Cảm ơn bạn đã gửi khiếu nại. Chúng tôi sẽ xem xét và cải thiện tính năng bản đồ!')
        }}
      />
    </div>
  );
};

