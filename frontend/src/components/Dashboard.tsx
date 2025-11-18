import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { TasksList } from './TasksList';
import { ChallengesList } from './ChallengesList';
import { FriendsManager } from './FriendsManager';
import { PenaltiesView } from './PenaltiesView';
import { Button } from './ui/button';
import { LogOut, Users, ListTodo, Target, DollarSign } from 'lucide-react';
import { API_ENDPOINTS, apiCall } from '../config/api';

interface DashboardProps {
  accessToken: string;
  userId: string;
  onLogout: () => void;
}

export function Dashboard({ accessToken, userId, onLogout }: DashboardProps) {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await apiCall(API_ENDPOINTS.profile);
      setUserProfile(data.user);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    onLogout();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-indigo-600">Done Dailies</h1>
            <p className="text-gray-600 mt-1">Welcome back, {userProfile?.name || 'User'}!</p>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <ListTodo className="w-4 h-4" />
              <span className="hidden sm:inline">Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="challenges" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Challenges</span>
            </TabsTrigger>
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Friends</span>
            </TabsTrigger>
            <TabsTrigger value="penalties" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Penalties</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks">
            <TasksList accessToken={accessToken} userId={userId} />
          </TabsContent>

          <TabsContent value="challenges">
            <ChallengesList accessToken={accessToken} userId={userId} />
          </TabsContent>

          <TabsContent value="friends">
            <FriendsManager accessToken={accessToken} userId={userId} />
          </TabsContent>

          <TabsContent value="penalties">
            <PenaltiesView accessToken={accessToken} userId={userId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}