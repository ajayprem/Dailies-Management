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
  showCompletedCount?: boolean;
  isCompletedToday?: boolean;
  highlightCompleted?: boolean;
}

export function TaskCard({
  task,
  actionButton,
  showCompletedCount = false,
  isCompletedToday = false,
  highlightCompleted = false,
}: TaskCardProps) {
  const shouldHighlight = highlightCompleted && isCompletedToday;

  return (
    <Card className={shouldHighlight ? "bg-green-50 border-green-200" : ""}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle
              className={`flex items-center gap-2 ${
                shouldHighlight ? "line-through text-gray-500" : ""
              }`}
            >
              {task.title}
              {isCompletedToday && (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              {!task.penaltyAmount && (
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200"
                >
                  <User className="w-3 h-3 mr-1" />
                  Personal
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              {task.description}
            </CardDescription>
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
      <CardContent>
        <div className="space-y-3">
          {task.penaltyAmount != 0 && (
            <>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span>Penalty: ₹{task.penaltyAmount}</span>
              </div>
              {task.recipientFriends && task.recipientFriends.length > 0 && (
                <div className="text-sm text-gray-600">
                  Recipients:{" "}
                  {task.recipientFriends.map((f: any) => f.name).join(", ")}
                </div>
              )}
            </>
          )}
          {showCompletedCount && (
            <div className="text-sm text-gray-600">
              Completed: {task.completedDates?.length || 0} times
            </div>
          )}
          {(task.startDate || task.endDate) && (
            <div className="text-sm text-gray-600">
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
          {actionButton}
        </div>
      </CardContent>
    </Card>
  );
}
