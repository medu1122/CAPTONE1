import { useState, useEffect } from 'react';
import { provinceService, ProvinceRecommendation } from '../../../services/provinceService';

export const useProvinceRecommendation = (provinceCode: string | null) => {
  const [recommendation, setRecommendation] = useState<ProvinceRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Loading states for each section (staggered loading)
  const [loadingStates, setLoadingStates] = useState({
    season: false,
    crops: false,
    harvesting: false,
    weather: false,
    notes: false
  });

  useEffect(() => {
    if (!provinceCode) {
      setRecommendation(null);
      setError(null);
      setLoadingStates({
        season: false,
        crops: false,
        harvesting: false,
        weather: false,
        notes: false
      });
      return;
    }

    const fetchRecommendation = async () => {
      setLoading(true);
      setError(null);
      
      // Reset loading states
      setLoadingStates({
        season: true,
        crops: false,
        harvesting: false,
        weather: false,
        notes: false
      });
      
      try {
        const data = await provinceService.getProvinceRecommendation(provinceCode);
        
        // Set recommendation immediately
        setRecommendation(data);
        
        // Staggered loading: show each section with delay
        if (data.season) {
          setTimeout(() => {
            setLoadingStates(prev => ({ ...prev, season: false, crops: true }));
          }, 200);
        } else {
          setLoadingStates(prev => ({ ...prev, season: false, crops: true }));
        }
        
        if (data.crops && data.crops.length > 0) {
          setTimeout(() => {
            setLoadingStates(prev => ({ ...prev, crops: false, harvesting: data.harvesting.length > 0 }));
          }, 400);
        } else {
          setLoadingStates(prev => ({ ...prev, crops: false, harvesting: data.harvesting.length > 0 }));
        }
        
        if (data.harvesting && data.harvesting.length > 0) {
          setTimeout(() => {
            setLoadingStates(prev => ({ ...prev, harvesting: false, weather: !!data.weather }));
          }, 600);
        } else {
          setLoadingStates(prev => ({ ...prev, harvesting: false, weather: !!data.weather }));
        }
        
        if (data.weather) {
          setTimeout(() => {
            setLoadingStates(prev => ({ ...prev, weather: false, notes: data.notes.length > 0 }));
          }, 800);
        } else {
          setLoadingStates(prev => ({ ...prev, weather: false, notes: data.notes.length > 0 }));
        }
        
        if (data.notes && data.notes.length > 0) {
          setTimeout(() => {
            setLoadingStates(prev => ({ ...prev, notes: false }));
          }, 1000);
        } else {
          setLoadingStates(prev => ({ ...prev, notes: false }));
        }
        
        setError(null);
      } catch (err: any) {
        console.error('Error fetching province recommendation:', err);
        const errorMessage = err.response?.data?.message || 
                            err.message || 
                            'Không thể tải tư vấn mùa vụ';
        setError(errorMessage);
        setRecommendation(null);
        setLoadingStates({
          season: false,
          crops: false,
          harvesting: false,
          weather: false,
          notes: false
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendation();
  }, [provinceCode]);

  return { recommendation, loading, error, loadingStates };
};

