import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import {
  Plus,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  User,
  List,
  Trash2,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { API_ENDPOINTS, apiCall } from "../config/api";
import { TaskStats } from "./TaskStats";
import { DailyTasksView } from "./DailyTasksView";
import { TaskCard } from "./TaskCard";
import { toast } from "sonner";

export function TasksList() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statsTask, setStatsTask] = useState<any | null>(null);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [isPersonalTask, setIsPersonalTask] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    period: "daily",
    penaltyAmount: "",
    penaltyRecipientIds: [] as string[],
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
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
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const data = await apiCall(API_ENDPOINTS.getFriends);
      setFriends(data.friends || []);
    } catch (error) {
      console.error("Error fetching friends:", error);
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

      if (!isPersonalTask) {
        taskData.penaltyAmount = parseFloat(formData.penaltyAmount);
        taskData.penaltyRecipientIds = formData.penaltyRecipientIds;
      }

      await apiCall(API_ENDPOINTS.createTask, {
        method: "POST",
        body: JSON.stringify(taskData),
      });

      setDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        period: "daily",
        penaltyAmount: "",
        penaltyRecipientIds: [],
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
      });
      setIsPersonalTask(false);
      toast.success("Task created successfully!");
      fetchTasks();
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
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

  const handleViewStats = (task: any) => {
    setStatsTask(task);
    setStatsDialogOpen(true);
  };

  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${taskTitle}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await apiCall(API_ENDPOINTS.deleteTask(taskId), {
        method: "DELETE",
      });

      toast.success("Task deleted successfully!");
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading tasks...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2>My Tasks</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your daily, weekly, and monthly tasks
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showAllTasks ? "default" : "outline"}
            onClick={() => setShowAllTasks(!showAllTasks)}
          >
            <List className="w-4 h-4 mr-2" />
            {showAllTasks ? "Daily View" : "All Tasks"}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Set up a personal task or one with a penalty if you don't
                  complete it on time
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        title: e.target.value,
                      })
                    }
                    required
                    placeholder="e.g., Go to the gym"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Add more details about this task"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period">Period</Label>
                  <Select
                    value={formData.period}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        period: value,
                      })
                    }
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

                <div className="flex items-center space-x-2 p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
                  <Checkbox
                    id="personal"
                    checked={isPersonalTask}
                    onCheckedChange={(checked) => {
                      setIsPersonalTask(checked as boolean);
                      if (checked) {
                        setFormData({
                          ...formData,
                          penaltyAmount: "",
                          penaltyRecipientIds: [],
                        });
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
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            penaltyAmount: e.target.value,
                          })
                        }
                        required
                        placeholder="100.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Penalty Recipients (Select one or more)</Label>
                      <div className="space-y-2 border rounded-md p-3 max-h-48 overflow-y-auto">
                        {friends.length === 0 ? (
                          <p className="text-sm text-gray-500">
                            Add friends first to select recipients
                          </p>
                        ) : (
                          friends.map((friend) => (
                            <div
                              key={friend.id}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`recipient-${friend.id}`}
                                checked={formData.penaltyRecipientIds.includes(
                                  friend.id
                                )}
                                onCheckedChange={() =>
                                  toggleRecipientSelection(friend.id)
                                }
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
                          Penalty will be split among{" "}
                          {formData.penaltyRecipientIds.length} recipient(s)
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
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        startDate: e.target.value,
                      })
                    }
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    When should this task begin?
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        endDate: e.target.value,
                      })
                    }
                    min={
                      formData.startDate
                        ? new Date(
                            new Date(formData.startDate).getTime() + 86400000
                          )
                            .toISOString()
                            .split("T")[0]
                        : new Date().toISOString().split("T")[0]
                    }
                  />
                  <p className="text-xs text-gray-500">
                    Leave blank for ongoing task
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    !isPersonalTask &&
                    (friends.length === 0 ||
                      formData.penaltyRecipientIds.length === 0)
                  }
                >
                  Create Task
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {showAllTasks ? (
        /* All Tasks View */
        <div>
          <h3 className="mb-4">All Tasks ({tasks.length})</h3>
          {tasks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">
                  No tasks yet. Create your first task to get started!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {tasks.map((task) => {
                const completedToday = task.completedDates?.includes(
                  new Date().toISOString().split("T")[0]
                );
                return (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isCompletedToday={completedToday}
                    showCompletedCount={true}
                    actionButton={
                      <Button
                        onClick={() => handleViewStats(task)}
                        className="w-full"
                        variant="outline"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        View Stats & Calendar
                      </Button>
                    }
                    deleteButton={
                      <Button
                        onClick={() => handleDeleteTask(task.id, task.title)}
                        className="w-full"
                        variant="destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Task
                      </Button>
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Daily View - Using DailyTasksView Component */
        <DailyTasksView tasks={tasks} onTaskUpdate={fetchTasks} />
      )}

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
