import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  Calendar,
  CheckCircle,
  Circle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";
import { API_ENDPOINTS, apiCall } from "../config/api";
import { TaskCard } from "./TaskCard";
import { toast } from "sonner";

interface DailyTasksViewProps {
  tasks: any[];
  onTaskUpdate: () => void;
}

export function DailyTasksView({ tasks, onTaskUpdate }: DailyTasksViewProps) {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
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
      if (task.status !== "active") return false;

      // Check if date is within task's date range
      if (task.startDate) {
        const startDate = new Date(task.startDate);
        if (date < startDate) return false;
      }

      if (task.endDate) {
        const endDate = new Date(task.endDate);
        if (date > endDate) return false;
      }

      return true;
    });

    setTasksForDay(filtered);
  };

  const isTaskCompletedOnDate = (task: any, dateStr: string) => {
    const list = task.completedDates || [];
    const period = task.period || "daily";
    // daily -> dateStr directly
    if (period === "daily") return list.includes(dateStr);

    const date = new Date(dateStr);
    // weekly: check week-start key (Monday) or fallback to dateStr
    if (period === "weekly") {
      const day = date.getDay(); // 0=Sun,1=Mon
      const diffToMonday = (day + 6) % 7; // days since Monday
      const monday = new Date(date);
      monday.setDate(date.getDate() - diffToMonday);
      const weekKey = monday.toISOString().split("T")[0];
      return list.includes(weekKey) || list.includes(dateStr);
    }

    // monthly: check month-start key (YYYY-MM-01) or fallback to dateStr
    if (period === "monthly") {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const monthKey = `${year}-${month}-01`;
      return list.includes(monthKey) || list.includes(dateStr);
    }

    return list.includes(dateStr);
  };

  const handleToggleCompletion = async (task: any, dateStr: string) => {
    const isCompleted = isTaskCompletedOnDate(task, dateStr);

    try {
      if (isCompleted) {
        // Uncomplete for this specific date
        await apiCall(API_ENDPOINTS.uncompleteTaskForDate(task.id), {
          method: "POST",
          body: JSON.stringify({ date: dateStr }),
        });
        toast.success("Task unmarked for this date");
      } else {
        // Complete for this specific date
        await apiCall(API_ENDPOINTS.completeTaskForDate(task.id), {
          method: "POST",
          body: JSON.stringify({ date: dateStr }),
        });
        toast.success("Task marked complete! 🎉");
      }
      onTaskUpdate();
    } catch (error) {
      console.error("Error toggling task completion:", error);
      toast.error("Failed to update task");
    }
  };

  const navigateDate = (direction: "prev" | "next") => {
    const currentDate = new Date(selectedDate);
    const newDate = new Date(currentDate);

    if (direction === "prev") {
      newDate.setDate(currentDate.getDate() - 1);
    } else {
      newDate.setDate(currentDate.getDate() + 1);
    }

    setSelectedDate(newDate.toISOString().split("T")[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split("T")[0];
  const isFuture = new Date(selectedDate) > new Date();
  const canGoForward = new Date(selectedDate) < new Date();

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {isToday
              ? "Today's Tasks"
              : new Date(selectedDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
          </h3>
          <span className="text-sm text-gray-500">
            {tasksForDay.length} {tasksForDay.length === 1 ? "task" : "tasks"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateDate("prev")}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            className="flex-1 text-center [text-align-last:center]"
          />

          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateDate("next")}
            disabled={!canGoForward}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {isFuture && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              Cannot mark tasks for future dates. Please select today or a past
              date.
            </p>
          </div>
        )}

        {tasksForDay.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Circle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No tasks due on this date</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {tasksForDay.map((task) => {
              const isCompleted = isTaskCompletedOnDate(task, selectedDate);

              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  isCompletedToday={isCompleted}
                  highlightCompleted={true}
                  showCompletedCount={false}
                  actionButton={
                    <Button
                      onClick={() => handleToggleCompletion(task, selectedDate)}
                      disabled={isFuture}
                      variant={isCompleted ? "secondary" : "default"}
                      className="w-full"
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Completed
                        </>
                      ) : (
                        <>
                          <Circle className="w-4 h-4 mr-2" />
                          Mark Complete
                        </>
                      )}
                    </Button>
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
