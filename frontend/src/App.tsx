import { useState, useEffect } from "react";
import { AuthForm } from "./components/AuthForm";
import { Dashboard } from "./components/Dashboard";
import { Toaster } from "./components/ui/sonner";
import { API_ENDPOINTS, apiCall } from "./config/api";

export default function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(false);

  const fetchProfile = async () => {
    try {
      console.log("Fetching user profile...", accessToken);
      const data = await apiCall(API_ENDPOINTS.profile);
      console.log("Fetched profile:", data);
      setUserProfile(data.user);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    checkExistingSession();
    loadDarkModePreference();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const loadDarkModePreference = () => {
    const saved = localStorage.getItem("darkMode");
    if (saved !== null) {
      setDarkMode(saved === "true");
    } else {
      // Check system preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setDarkMode(prefersDark);
    }
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", String(newMode));
  };

  const checkExistingSession = () => {
    try {
      const token = localStorage.getItem("authToken");
      const uid = localStorage.getItem("userId");

      if (token && uid) {
        setAccessToken(token);
        setUserId(uid);
        fetchProfile();
      }
    } catch (error) {
      console.error("Error checking session:", error);
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
    return (
      <AuthForm
        onAuthSuccess={handleAuthSuccess}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />
    );
  }

  return (
    <>
      <Dashboard
        accessToken={accessToken}
        userId={userId}
        onLogout={handleLogout}
        userProfile={userProfile}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />
      <Toaster />
    </>
  );
}
