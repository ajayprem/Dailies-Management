import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Calendar, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { API_ENDPOINTS, apiCall } from '../config/api';
import { toast } from 'sonner';

interface DailyTasksViewProps {
  tasks: any[];
  onTaskUpdate: () => void;
}

export function DailyTasksView({ tasks, onTaskUpdate }: DailyTasksViewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [tasksForDay, setTasksForDay] = useState<any[]>([]);

  useEffect(() => {
    filterTasksForDate(selectedDate);
  }, [selectedDate, tasks]);

  const filterTasksForDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayOfMonth = date.getDate();

    const filtered = tasks.filter((task) => {
      // Check if task is active
      if (task.status !== 'active') return false;

      // Check if date is within task's date range
      if (task.startDate) {
        const startDate = new Date(task.startDate);
        if (date < startDate) return false;
      }

      if (task.endDate) {
        const endDate = new Date(task.endDate);
        if (date > endDate) return false;
      }

      // Filter by period
      if (task.period === 'daily') {
        return true;
      } else if (task.period === 'weekly') {
        // For weekly tasks, show on the same day of week as creation
        const createdDate = new Date(task.createdAt || task.startDate);
        const createdDayOfWeek = createdDate.getDay();
        return dayOfWeek === createdDayOfWeek;
      } else if (task.period === 'monthly') {
        // For monthly tasks, show on the same day of month as creation
        const createdDate = new Date(task.createdAt || task.startDate);
        const createdDayOfMonth = createdDate.getDate();
        return dayOfMonth === createdDayOfMonth;
      }

      return false;
    });

    setTasksForDay(filtered);
  };

  const isTaskCompletedOnDate = (task: any, dateStr: string) => {
    return task.completedDates?.includes(dateStr) || false;
  };

  const handleToggleCompletion = async (task: any, dateStr: string) => {
    const isCompleted = isTaskCompletedOnDate(task, dateStr);

    try {
      if (isCompleted) {
        // Uncomplete for this specific date
        await apiCall(API_ENDPOINTS.uncompleteTaskForDate(task.id), {
          method: 'POST',
          body: JSON.stringify({ date: dateStr }),
        });
        toast.success('Task unmarked for this date');
      } else {
        // Complete for this specific date
        await apiCall(API_ENDPOINTS.completeTaskForDate(task.id), {
          method: 'POST',
          body: JSON.stringify({ date: dateStr }),
        });
        toast.success('Task marked complete! 🎉');
      }
      onTaskUpdate();
    } catch (error) {
      console.error('Error toggling task completion:', error);
      toast.error('Failed to update task');
    }
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const isFuture = new Date(selectedDate) > new Date();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Daily Tasks View
          </CardTitle>
          <CardDescription>
            Select a date to view and manage tasks for that day
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="selectedDate">Select Date</Label>
            <Input
              id="selectedDate"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
            {isToday && (
              <p className="text-sm text-indigo-600">📅 Viewing today's tasks</p>
            )}
            {!isToday && !isFuture && (
              <p className="text-sm text-gray-600">
                📅 Viewing tasks for {new Date(selectedDate).toLocaleDateString()}
              </p>
            )}
          </div>

          {isFuture && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                Cannot mark tasks for future dates. Please select today or a past date.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-medium">
              Tasks for this day ({tasksForDay.length})
            </h3>

            {tasksForDay.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Circle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No tasks due on this date</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasksForDay.map((task) => {
                  const isCompleted = isTaskCompletedOnDate(task, selectedDate);

                  return (
                    <Card key={task.id} className={isCompleted ? 'bg-green-50 border-green-200' : ''}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={isCompleted ? 'line-through text-gray-500' : ''}>
                                {task.title}
                              </h4>
                              <Badge variant={task.period === 'daily' ? 'default' : task.period === 'weekly' ? 'secondary' : 'outline'}>
                                {task.period}
                              </Badge>
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                            )}
                            {task.penaltyAmount && (
                              <div className="flex flex-col gap-1 text-sm text-gray-500">
                                <span>Penalty: ₹{task.penaltyAmount}</span>
                                {task.recipientFriends && task.recipientFriends.length > 0 && (
                                  <span>→ {task.recipientFriends.map((f: any) => f.name).join(', ')}</span>
                                )}
                              </div>
                            )}
                          </div>

                          <Button
                            onClick={() => handleToggleCompletion(task, selectedDate)}
                            disabled={isFuture}
                            variant={isCompleted ? 'secondary' : 'default'}
                            size="sm"
                          >
                            {isCompleted ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Completed
                              </>
                            ) : (
                              <>
                                <Circle className="w-4 h-4 mr-1" />
                                Mark Complete
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
