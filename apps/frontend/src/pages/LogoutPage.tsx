import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_CONFIG } from '../config/api';

export const LogoutPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      try {
        console.log('🚪 [Logout] Starting logout process...');
        
        // Get refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        
        // Call backend logout API if token exists
        if (refreshToken && (window as any).accessToken) {
          try {
            await fetch(`${API_CONFIG.BASE_URL}/auth/logout`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${(window as any).accessToken}`
              },
              body: JSON.stringify({ refreshToken })
            });
            console.log('✅ [Logout] Backend logout successful');
          } catch (error) {
            console.warn('⚠️ [Logout] Backend logout failed (non-critical):', error);
          }
        }
        
        // Clear all local storage and tokens
        localStorage.clear();
        sessionStorage.clear();
        delete (window as any).accessToken;
        
        console.log('✅ [Logout] Tokens cleared');
        
        // Redirect to auth page after a short delay
        setTimeout(() => {
          navigate('/auth', { replace: true });
        }, 500);
      } catch (error) {
        console.error('❌ [Logout] Error:', error);
        // Still clear tokens even if API call fails
        localStorage.clear();
        sessionStorage.clear();
        delete (window as any).accessToken;
        navigate('/auth', { replace: true });
      }
    };

    performLogout();
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div style={{
        fontSize: '2rem',
        fontWeight: 'bold',
        color: '#4CAF50'
      }}>
        Logging out...
      </div>
      <div style={{
        fontSize: '1rem',
        color: '#666'
      }}>
        Please wait...
      </div>
    </div>
  );
};

export default LogoutPage;

