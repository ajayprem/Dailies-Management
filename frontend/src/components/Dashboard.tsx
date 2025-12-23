import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { TasksList } from "./TasksList";
import { ChallengesList } from "./ChallengesList";
import { FriendsManager } from "./FriendsManager";
import { PenaltiesView } from "./PenaltiesView";
import { Button } from "./ui/button";
import {
  LogOut,
  Users,
  ListTodo,
  Target,
  IndianRupee,
  Moon,
  Sun,
} from "lucide-react";
import { API_ENDPOINTS, apiCall } from "../config/api";

interface DashboardProps {
  accessToken: string;
  userProfile: any;
  userId: string;
  onLogout: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export function Dashboard({
  accessToken,
  userProfile,
  userId,
  onLogout,
  darkMode,
  toggleDarkMode,
}: DashboardProps) {
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-indigo-950">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-indigo-600 dark:text-indigo-400">
              Done Dailies
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Welcome back, {userProfile?.name || "User"}!
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={toggleDarkMode} variant="outline" size="sm">
              {darkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
              <span className="sr-only">Toggle dark mode</span>
            </Button>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
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
              <IndianRupee className="w-4 h-4" />
              <span className="hidden sm:inline">Penalties</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks">
            <TasksList />
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
