import { useState, useEffect } from 'react';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = () => {
    try {
      const token = localStorage.getItem('authToken');
      const uid = localStorage.getItem('userId');

      if (token && uid) {
        setAccessToken(token);
        setUserId(uid);
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

  if (!accessToken || !userId) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <>
      <Dashboard accessToken={accessToken} userId={userId} onLogout={handleLogout} />
      <Toaster />
    </>
  );
}