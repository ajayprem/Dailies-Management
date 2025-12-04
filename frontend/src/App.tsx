import { useState, useEffect } from 'react';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import { Toaster } from './components/ui/sonner';
import { API_ENDPOINTS, apiCall } from './config/api';

export default function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  const fetchProfile = async () => {
    try {
      console.log('Fetching user profile...', accessToken);
      const data = await apiCall(API_ENDPOINTS.profile);
      console.log('Fetched profile:', data);
      setUserProfile(data.user);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = () => {
    try {
      const token = localStorage.getItem('authToken');
      const uid = localStorage.getItem('userId');

      if (token && uid) {
        setAccessToken(accessToken);
        setUserId(uid);
        fetchProfile();
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleAuthSuccess = (token: string, uid: string) => {
    setAccessToken(token);
    setUserId(uid);
    fetchProfile();
  };

  const handleLogout = () => {
    setAccessToken(null);
    setUserId(null);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl">Loading Done Dailies...</div>
        </div>
      </div>
    );
  }

  if (!accessToken || !userId || !userProfile) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <>
      <Dashboard accessToken={accessToken} userProfile={userProfile} userId={userId} onLogout={handleLogout} />
      <Toaster />
    </>
  );
}