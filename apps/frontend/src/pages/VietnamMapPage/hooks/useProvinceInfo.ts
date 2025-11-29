import { useState, useEffect } from 'react';
import { provinceService, type ProvinceInfo } from '../../../services/provinceService';

export const useProvinceInfo = (provinceCode: string | null) => {
  const [data, setData] = useState<ProvinceInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!provinceCode) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    // Reset data immediately when provinceCode changes to show loading state
    setData(null);
    setError(null);
    setLoading(true);

    const fetchInfo = async () => {
      try {
        const info = await provinceService.getProvinceInfo(provinceCode);
        setData(info);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching province info:', err);
        const errorMessage = err.response?.data?.message || 
                            err.message || 
                            'Không thể tải thông tin tỉnh';
        setError(errorMessage);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
  }, [provinceCode]);

  return { data, loading, error };
};

