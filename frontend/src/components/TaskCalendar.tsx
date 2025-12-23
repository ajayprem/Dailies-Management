import { useState } from "react";
import { Calendar } from "./ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { CheckCircle } from "lucide-react";

interface TaskCalendarProps {
  completedDates: string[];
  taskTitle: string;
}

export function TaskCalendar({ completedDates, taskTitle }: TaskCalendarProps) {
  const [month, setMonth] = useState<Date>(new Date());

  // Convert completed dates to Date objects
  const completedDateObjects = completedDates.map(
    (dateStr) => new Date(dateStr + "T00:00:00")
  );

  const isDayCompleted = (day: Date) => {
    const dayStr = day.toISOString().split("T")[0];
    return completedDates.includes(dayStr);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Completion History
        </CardTitle>
        <CardDescription>Days you completed "{taskTitle}"</CardDescription>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="multiple"
          selected={completedDateObjects}
          month={month}
          onMonthChange={setMonth}
          className="rounded-md border"
          modifiers={{
            completed: completedDateObjects,
          }}
          modifiersClassNames={{
            completed: "bg-green-100 text-green-900 hover:bg-green-200",
          }}
        />
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          <p>Total completions: {completedDates.length}</p>
          <p className="mt-1 text-xs text-gray-500">
            Green highlighted dates show when you completed this task
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
