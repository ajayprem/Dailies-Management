import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Plus, CheckCircle, AlertTriangle, BarChart3, RotateCcw, Calendar, User } from 'lucide-react';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { API_ENDPOINTS, apiCall } from '../config/api';
import { TaskStats } from './TaskStats';
import { DailyTasksView } from './DailyTasksView';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export function TasksList() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statsTask, setStatsTask] = useState<any | null>(null);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [isPersonalTask, setIsPersonalTask] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    period: 'daily',
    penaltyAmount: '',
    penaltyRecipientIds: [] as string[],
    startDate: new Date().toISOString().split('T')[0], // Default to today
    endDate: '', // Optional
  });

  useEffect(() => {
    fetchTasks();
    fetchFriends();
  }, []);

  const fetchTasks = async () => {
    try {
      const data = await apiCall(API_ENDPOINTS.getTasks);
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const data = await apiCall(API_ENDPOINTS.getFriends);
      setFriends(data.friends || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const taskData: any = {
        title: formData.title,
        description: formData.description,
        period: formData.period,
        startDate: formData.startDate,
        endDate: formData.endDate,
      };

      // Only add penalty fields if it's not a personal task
      if (!isPersonalTask) {
        taskData.penaltyAmount = parseFloat(formData.penaltyAmount);
        taskData.penaltyRecipientIds = formData.penaltyRecipientIds;
      }

      await apiCall(API_ENDPOINTS.createTask, {
        method: 'POST',
        body: JSON.stringify(taskData),
      });

      setDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        period: 'daily',
        penaltyAmount: '',
        penaltyRecipientIds: [],
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
      });
      setIsPersonalTask(false);
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const toggleRecipientSelection = (friendId: string) => {
    setFormData((prev) => ({
      ...prev,
      penaltyRecipientIds: prev.penaltyRecipientIds.includes(friendId)
        ? prev.penaltyRecipientIds.filter((id) => id !== friendId)
        : [...prev.penaltyRecipientIds, friendId],
    }));
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await apiCall(API_ENDPOINTS.completeTask(taskId), {
        method: 'POST',
      });
      toast.success('Task completed! 🎉');
      fetchTasks();
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Failed to complete task');
    }
  };

  const handleUncompleteTask = async (taskId: string) => {
    try {
      await apiCall(API_ENDPOINTS.uncompleteTask(taskId), {
        method: 'POST',
      });
      toast.success('Task completion reset');
      fetchTasks();
    } catch (error) {
      console.error('Error uncompleting task:', error);
      toast.error('Failed to reset task');
    }
  };

  const handleViewStats = (task: any) => {
    setStatsTask(task);
    setStatsDialogOpen(true);
  };

  const isTaskCompletedToday = (task: any) => {
    const today = new Date().toISOString().split('T')[0];
    return task.completedDates?.includes(today);
  };

  if (loading) {
    return <div className="text-center py-8">Loading tasks...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2>My Tasks</h2>
          <p className="text-gray-600 mt-1">Manage your daily, weekly, and monthly tasks</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Set up a personal task or one with a penalty if you don't complete it on time
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g., Go to the gym"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add more details about this task"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="period">Period</Label>
                <Select
                  value={formData.period}
                  onValueChange={(value) => setFormData({ ...formData, period: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-md bg-gray-50">
                <Checkbox
                  id="personal"
                  checked={isPersonalTask}
                  onCheckedChange={(checked) => {
                    setIsPersonalTask(checked as boolean);
                    if (checked) {
                      setFormData({ ...formData, penaltyAmount: '', penaltyRecipientIds: [] });
                    }
                  }}
                />
                <label
                  htmlFor="personal"
                  className="text-sm cursor-pointer flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  This is a personal task (no penalty)
                </label>
              </div>

              {!isPersonalTask && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="penalty">Penalty Amount (₹)</Label>
                    <Input
                      id="penalty"
                      type="number"
                      step="0.01"
                      value={formData.penaltyAmount}
                      onChange={(e) => setFormData({ ...formData, penaltyAmount: e.target.value })}
                      required
                      placeholder="100.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Penalty Recipients (Select one or more)</Label>
                    <div className="space-y-2 border rounded-md p-3 max-h-48 overflow-y-auto">
                      {friends.length === 0 ? (
                        <p className="text-sm text-gray-500">Add friends first to select recipients</p>
                      ) : (
                        friends.map((friend) => (
                          <div key={friend.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`recipient-${friend.id}`}
                              checked={formData.penaltyRecipientIds.includes(friend.id)}
                              onCheckedChange={() => toggleRecipientSelection(friend.id)}
                            />
                            <label
                              htmlFor={`recipient-${friend.id}`}
                              className="text-sm cursor-pointer flex-1"
                            >
                              {friend.name}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                    {formData.penaltyRecipientIds.length > 0 && (
                      <p className="text-xs text-gray-500">
                        Penalty will be split among {formData.penaltyRecipientIds.length} recipient(s)
                      </p>
                    )}
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
                <p className="text-xs text-gray-500">When should this task begin?</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  min={formData.startDate ? new Date(new Date(formData.startDate).getTime() + 86400000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-500">Leave blank for ongoing task</p>
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={!isPersonalTask && (friends.length === 0 || formData.penaltyRecipientIds.length === 0)}
              >
                Create Task
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="daily">
            <Calendar className="w-4 h-4 mr-2" />
            Daily View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {tasks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">No tasks yet. Create your first task to get started!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">{tasks.map((task) => {
              const completedToday = isTaskCompletedToday(task);
              return (
                <Card key={task.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {task.title}
                          {completedToday && (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                          {!task.penaltyAmount && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              <User className="w-3 h-3 mr-1" />
                              Personal
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">{task.description}</CardDescription>
                      </div>
                      <Badge variant={task.period === 'daily' ? 'default' : task.period === 'weekly' ? 'secondary' : 'outline'}>
                        {task.period}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {task.penaltyAmount && (
                        <>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                            <span>Penalty: ₹{task.penaltyAmount}</span>
                          </div>
                          {task.recipientFriends && task.recipientFriends.length > 0 && (
                            <div className="text-sm text-gray-600">
                              Recipients: {task.recipientFriends.map((f: any) => f.name).join(', ')}
                            </div>
                          )}
                        </>
                      )}
                      <div className="text-sm text-gray-600">
                        Completed: {task.completedDates?.length || 0} times
                      </div>
                      {(task.startDate || task.endDate) && (
                        <div className="text-sm text-gray-600">
                          {task.startDate && <div>Starts: {new Date(task.startDate).toLocaleDateString()}</div>}
                          {task.endDate && <div>Ends: {new Date(task.endDate).toLocaleDateString()}</div>}
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => handleCompleteTask(task.id)}
                          disabled={completedToday}
                          className="w-full"
                          variant={completedToday ? 'secondary' : 'default'}
                        >
                          {completedToday ? 'Completed ✓' : 'Mark Complete'}
                        </Button>
                        <Button
                          onClick={() => handleUncompleteTask(task.id)}
                          disabled={!completedToday}
                          className="w-full"
                          variant="outline"
                          size="sm"
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Reset
                        </Button>
                      </div>
                      <Button
                        onClick={() => handleViewStats(task)}
                        className="w-full"
                        variant="outline"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        View Stats & Calendar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="daily" className="mt-4">
          <DailyTasksView tasks={tasks} onTaskUpdate={fetchTasks} />
        </TabsContent>
      </Tabs>

      {/* Stats Dialog */}
      {statsTask && (
        <TaskStats
          task={statsTask}
          open={statsDialogOpen}
          onOpenChange={setStatsDialogOpen}
        />
      )}
    </div>
  );
}