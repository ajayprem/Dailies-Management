import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { CheckCircle, AlertTriangle, User } from "lucide-react";

interface TaskCardProps {
  task: any;
  actionButton?: React.ReactNode;
  deleteButton?: React.ReactNode;
  showCompletedCount?: boolean;
  isCompletedToday?: boolean;
  highlightCompleted?: boolean;
}

export function TaskCard({
  task,
  actionButton,
  deleteButton,
  showCompletedCount = false,
  isCompletedToday = false,
  highlightCompleted = false,
}: TaskCardProps) {
  const shouldHighlight = highlightCompleted && isCompletedToday;

  return (
    <Card
      className={`flex flex-col ${
        shouldHighlight
          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
          : ""
      }`}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle
              className={`flex items-center gap-2 ${
                shouldHighlight
                  ? "line-through text-gray-500 dark:text-gray-400"
                  : ""
              }`}
            >
              {task.title}
              {isCompletedToday && (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              )}
              {!task.penaltyAmount && (
                <Badge
                  variant="outline"
                  className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                >
                  <User className="w-3 h-3 mr-1" />
                  Personal
                </Badge>
              )}
            </CardTitle>
          </div>
          <Badge
            variant={
              task.period === "daily"
                ? "default"
                : task.period === "weekly"
                ? "secondary"
                : "outline"
            }
          >
            {task.period}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-3 flex-1">
          {task.penaltyAmount ? (
            <>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <AlertTriangle className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                <span>Penalty: ₹{task.penaltyAmount}</span>
              </div>
              {task.recipientFriends && task.recipientFriends.length > 0 && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Recipients:{" "}
                  {task.recipientFriends.map((f: any) => f.name).join(", ")}
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <User className="w-4 h-12 text-blue-500 dark:text-blue-400" />
              <span>Personal task - no penalty</span>
            </div>
          )}
          {showCompletedCount && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Completed: {task.completedDates?.length || 0} times
            </div>
          )}
          {(task.startDate || task.endDate) && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {task.startDate && (
                <div>
                  Starts: {new Date(task.startDate).toLocaleDateString()}
                </div>
              )}
              {task.endDate && (
                <div>Ends: {new Date(task.endDate).toLocaleDateString()}</div>
              )}
            </div>
          )}
        </div>
        {actionButton && <div className="mt-3">{actionButton}</div>}
        {deleteButton && <div className="mt-3">{deleteButton}</div>}
      </CardContent>
    </Card>
  );
}
