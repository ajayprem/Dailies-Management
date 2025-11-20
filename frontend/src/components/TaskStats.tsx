import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { TaskCalendar } from './TaskCalendar';
import { TrendingUp, Calendar as CalendarIcon, Award, AlertTriangle, Target } from 'lucide-react';

interface TaskStatsProps {
  task: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskStats({ task, open, onOpenChange }: TaskStatsProps) {
  const [stats, setStats] = useState({
    totalCompletions: 0,
    currentStreak: 0,
    longestStreak: 0,
    completionRate: 0,
    totalPenalties: 0,
    penaltyAmount: 0,
  });

  useEffect(() => {
    if (open && task) {
      calculateStats();
    }
  }, [open, task]);

  const calculateStats = () => {
    const completedDates = task.completedDates || [];
    const totalCompletions = completedDates.length;

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    const sortedDates = [...completedDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    for (let i = 0; i < sortedDates.length; i++) {
      const date = new Date(sortedDates[i]);
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      
      const dateStr = date.toISOString().split('T')[0];
      const expectedStr = expectedDate.toISOString().split('T')[0];
      
      if (dateStr === expectedStr) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    const allDates = [...completedDates].sort();
    
    for (let i = 0; i < allDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(allDates[i - 1]);
        const currDate = new Date(allDates[i]);
        const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Calculate completion rate
    const createdDate = new Date(task.createdAt);
    const daysSinceCreation = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    let expectedCompletions = 0;
    
    if (task.period === 'daily') {
      expectedCompletions = daysSinceCreation;
    } else if (task.period === 'weekly') {
      expectedCompletions = Math.floor(daysSinceCreation / 7);
    } else if (task.period === 'monthly') {
      expectedCompletions = Math.floor(daysSinceCreation / 30);
    }
    
    const completionRate = expectedCompletions > 0 ? (totalCompletions / expectedCompletions) * 100 : 0;

    setStats({
      totalCompletions,
      currentStreak,
      longestStreak,
      completionRate: Math.min(completionRate, 100),
      totalPenalties: 0, // This would come from backend
      penaltyAmount: task.penaltyAmount,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            {task.title} - Statistics
          </DialogTitle>
          <DialogDescription>
            Detailed performance metrics for this task
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Completions</CardDescription>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  {stats.totalCompletions}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Times completed since creation
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Current Streak</CardDescription>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  {stats.currentStreak} days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Longest: {stats.longestStreak} days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Completion Rate</CardDescription>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-indigo-500" />
                  {stats.completionRate.toFixed(1)}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={stats.completionRate} className="h-2" />
              </CardContent>
            </Card>
          </div>

          {/* Task Details */}
          <Card>
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Description:</span>
                <span>{task.description || 'No description'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Period:</span>
                <Badge variant={task.period === 'daily' ? 'default' : task.period === 'weekly' ? 'secondary' : 'outline'}>
                  {task.period}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Penalty Amount:</span>
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  ${task.penaltyAmount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Next Due Date:</span>
                <span>{task.nextDueDate || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                <Badge variant={task.status === 'active' ? 'default' : 'secondary'}>
                  {task.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Calendar View */}
          <TaskCalendar 
            completedDates={task.completedDates || []} 
            taskTitle={task.title}
          />

          {/* Performance Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.completionRate >= 80 ? (
                <p className="text-green-600">🎉 Excellent! You're maintaining a great completion rate!</p>
              ) : stats.completionRate >= 50 ? (
                <p className="text-yellow-600">👍 Good progress! Try to be more consistent.</p>
              ) : (
                <p className="text-orange-600">⚠️ You might want to adjust your task schedule or penalties.</p>
              )}
              
              {stats.currentStreak >= 7 && (
                <p className="text-indigo-600">🔥 You're on fire! {stats.currentStreak} day streak!</p>
              )}
              
              {stats.currentStreak === 0 && stats.totalCompletions > 0 && (
                <p className="text-gray-600">💪 Time to start a new streak!</p>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
