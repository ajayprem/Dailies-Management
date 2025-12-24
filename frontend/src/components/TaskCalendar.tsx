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
  period?: string;
}

export function TaskCalendar({
  completedDates,
  taskTitle,
  period,
}: TaskCalendarProps) {
  const [month, setMonth] = useState<Date>(new Date());
  // const period = undefined; // default - will be overridden by prop if provided

  // Expand completed date keys into actual Date objects depending on period
  const expandedDateObjects: Date[] = [];
  const expandedDateSet = new Set<string>();

  const p = (period as string) || "daily";

  const pad2 = (n: number) => String(n).padStart(2, "0");
  const formatDate = (d: Date) =>
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const parseKeyToDate = (key: string) => {
    const parts = key.split("-");
    if (parts.length < 3) return new Date(key + "T00:00:00");
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const day = Number(parts[2]);
    return new Date(y, m - 1, day);
  };

  for (const key of completedDates) {
    // parse canonical key like "2025-12-22" (ISO date)
    if (!key) continue;
    // weekly: key is week-start (Monday) -> mark 7 days
    if (p === "weekly") {
      const start = parseKeyToDate(key);
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const s = formatDate(d);
        if (!expandedDateSet.has(s)) {
          expandedDateSet.add(s);
          expandedDateObjects.push(
            new Date(d.getFullYear(), d.getMonth(), d.getDate())
          );
        }
      }
    } else if (p === "monthly") {
      // key is month-start (first of month) -> mark entire month
      const start = parseKeyToDate(key);
      const year = start.getFullYear();
      const monthIdx = start.getMonth();
      const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
      for (let i = 0; i < daysInMonth; i++) {
        const d = new Date(year, monthIdx, 1 + i);
        const s = formatDate(d);
        if (!expandedDateSet.has(s)) {
          expandedDateSet.add(s);
          expandedDateObjects.push(
            new Date(d.getFullYear(), d.getMonth(), d.getDate())
          );
        }
      }
    } else {
      // daily or unknown: treat key as single completed date
      const d = parseKeyToDate(key);
      const s = formatDate(d);
      if (!expandedDateSet.has(s)) {
        expandedDateSet.add(s);
        expandedDateObjects.push(
          new Date(d.getFullYear(), d.getMonth(), d.getDate())
        );
      }
    }
  }

  const isDayCompleted = (day: Date) => {
    const dayStr = day.toISOString().split("T")[0];
    return expandedDateSet.has(dayStr);
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
          selected={expandedDateObjects}
          month={month}
          onMonthChange={setMonth}
          className="rounded-md border"
          modifiers={{
            completed: expandedDateObjects,
          }}
          modifiersClassNames={{
            completed: "bg-green-100 text-green-900 hover:bg-green-200",
          }}
        />
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          <p>Total completions: {completedDates.length}</p>
          <p className="mt-1 text-xs text-gray-500">
            Highlighted dates show when you completed this task
            {p === "weekly"
              ? " (entire weeks shown)"
              : p === "monthly"
              ? " (entire months shown)"
              : ""}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
