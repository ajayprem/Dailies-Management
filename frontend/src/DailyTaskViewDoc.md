# Daily Tasks View Feature

## Overview

The **Daily Tasks View** is a new feature that allows users to view and manage tasks for specific dates, including retroactive completion of tasks for past dates they may have forgotten to mark complete.

---

## User Experience

### Accessing the Daily View

Users can access this feature by clicking the "Daily View" tab in the Tasks section. This view is displayed alongside the "All Tasks" view using a tab interface.

### Features

1. **Date Selection**
   - A date picker allows users to select any day (up to today)
   - Defaults to today's date
   - Cannot select future dates (with appropriate warning message)
   - Shows helpful context about the selected date

2. **Filtered Task Display**
   - Shows only tasks that are due on the selected date
   - Tasks are filtered based on their period:
     - **Daily tasks**: Show every day
     - **Weekly tasks**: Show on the same day of the week as when created
     - **Monthly tasks**: Show on the same day of the month as when created
   - Respects task start and end dates

3. **Retroactive Completion**
   - Users can mark tasks as complete for past dates
   - Users can unmark completions if they made a mistake
   - Each task shows its completion status for the selected date
   - Completed tasks are highlighted with green background
   - Completion status updates in real-time

4. **Visual Feedback**
   - Completed tasks have a green background with a checkmark icon
   - Incomplete tasks have a standard appearance with a circle icon
   - Future dates show a warning that prevents marking tasks complete
   - Empty state when no tasks are due on the selected date

---

## Technical Implementation

### Component Structure

```
TasksList (Parent Component)
  └── Tabs
      ├── TabsContent "All Tasks" (Original view)
      └── TabsContent "Daily View" (New)
          └── DailyTasksView Component
```

### DailyTasksView Component

**Location:** `/components/DailyTasksView.tsx`

**Props:**
- `tasks`: Array of all user tasks
- `onTaskUpdate`: Callback to refresh tasks after completion

**Key Functions:**

1. **filterTasksForDate(dateStr)**
   - Filters tasks to show only those due on the selected date
   - Checks period type (daily/weekly/monthly)
   - Validates against start and end dates
   - Returns filtered array of tasks

2. **isTaskCompletedOnDate(task, dateStr)**
   - Checks if a task is marked complete for a specific date
   - Returns boolean

3. **handleToggleCompletion(task, dateStr)**
   - Marks or unmarks a task for a specific date
   - Calls appropriate API endpoint
   - Shows success/error toast notifications
   - Triggers parent component to refresh tasks

### Period-Based Filtering Logic

**Daily Tasks:**
```typescript
// Show on every date
if (task.period === 'daily') {
  return true;
}
```

**Weekly Tasks:**
```typescript
// Show on the same day of week as creation
if (task.period === 'weekly') {
  const createdDate = new Date(task.createdAt || task.startDate);
  const createdDayOfWeek = createdDate.getDay();
  return dayOfWeek === createdDayOfWeek;
}
```

**Monthly Tasks:**
```typescript
// Show on the same day of month as creation
if (task.period === 'monthly') {
  const createdDate = new Date(task.createdAt || task.startDate);
  const createdDayOfMonth = createdDate.getDate();
  return dayOfMonth === createdDayOfMonth;
}
```

---

## Backend Requirements

### New API Endpoints

#### POST /api/tasks/{taskId}/complete-for-date

Mark a task as completed for a specific date.

**Request Body:**
```json
{
  "date": "2024-01-15"  // YYYY-MM-DD format
}
```

**Response:**
```json
{
  "success": true,
  "task": {
    // Updated task with the date added to completedDates array
  }
}
```

**Backend Logic:**
- Validate that the date is not in the future
- Validate that the date falls within the task's start/end date range
- Validate that the date matches the task's period schedule
- Add the date to the `completedDates` array if not already present
- Return updated task object

---

#### POST /api/tasks/{taskId}/uncomplete-for-date

Remove completion for a specific date.

**Request Body:**
```json
{
  "date": "2024-01-15"  // YYYY-MM-DD format
}
```

**Response:**
```json
{
  "success": true
}
```

**Backend Logic:**
- Remove the specified date from the `completedDates` array
- Return success status

---

### Data Validation

The backend should validate:

1. **Date Format**: Must be YYYY-MM-DD
2. **Date Range**: Must be today or earlier (not future)
3. **Task Dates**: Must fall within task's start and end dates
4. **Period Matching**: Should ideally validate that the date matches the task's period
5. **Authorization**: User must own the task

---

## Use Cases

### 1. Forgot to Mark Yesterday's Task

**Scenario:** User completed a daily task yesterday but forgot to mark it in the app.

**Steps:**
1. Navigate to Tasks → Daily View
2. Select yesterday's date using the date picker
3. Find the task in the filtered list
4. Click "Mark Complete" button
5. Task is highlighted as completed
6. The completion is reflected in stats and calendar views

---

### 2. Reviewing Past Week Performance

**Scenario:** User wants to review which tasks they completed last week.

**Steps:**
1. Navigate to Tasks → Daily View
2. Use date picker to select dates from last week
3. View completion status for each day
4. Mark any missed completions if they actually did the task

---

### 3. Correcting a Mistake

**Scenario:** User accidentally marked a task complete for a day they didn't actually do it.

**Steps:**
1. Navigate to Tasks → Daily View
2. Select the date with the incorrect completion
3. Find the task (will be highlighted green)
4. Click "Completed" button to toggle it off
5. Task returns to incomplete status

---

## Updated Files

### New Files
- `/components/DailyTasksView.tsx` - Main component for daily view

### Modified Files
- `/components/TasksList.tsx` - Added tabs and integrated DailyTasksView
- `/config/api.ts` - Added new API endpoint definitions
- `/API_DOCUMENTATION.md` - Documented new endpoints

---

## User Benefits

1. **Flexibility**: Can retroactively mark tasks complete without losing credit
2. **Accuracy**: Historical task tracking is more accurate
3. **Forgiveness**: Reduces penalty risk for users who forget to mark tasks
4. **Planning**: Can review and plan based on specific dates
5. **Accountability**: Complete historical view of task performance

---

## Future Enhancements

Potential improvements to consider:

1. **Week View**: Show an entire week at once in a grid layout
2. **Bulk Actions**: Mark multiple tasks complete for a date at once
3. **Reminders**: Set reminders for specific dates/tasks
4. **Notes**: Add notes to specific task completions
5. **Quick Jump**: Buttons for "Yesterday", "Last Week", etc.
6. **Calendar Integration**: Visual calendar with clickable dates
7. **Challenges Support**: Extend the same functionality to challenges

---

## Testing Recommendations

1. **Date Filtering**
   - Verify daily tasks show on all dates
   - Verify weekly tasks show on correct day of week
   - Verify monthly tasks show on correct day of month
   - Test edge cases (month boundaries, leap years)

2. **Retroactive Completion**
   - Mark a task complete for yesterday
   - Verify it appears in the "All Tasks" view completion count
   - Verify it appears in the calendar view
   - Verify stats are updated correctly

3. **Validation**
   - Try to select a future date (should be blocked)
   - Try to mark future task complete (should show warning)
   - Verify tasks respect start and end dates

4. **State Management**
   - Mark task complete in Daily View
   - Switch to All Tasks view and verify status
   - Refresh page and verify persistence
   - Check multiple dates for the same task

---

## Design Decisions

### Why Block Future Dates?

Tasks cannot be marked complete for future dates because:
- It would defeat the accountability purpose of the app
- It would corrupt completion rate statistics
- It doesn't make logical sense in the app's context

### Why Filter by Period?

The filtering by period ensures users only see relevant tasks:
- Weekly tasks only appear on their designated day
- Monthly tasks only appear on their designated date
- This prevents confusion and keeps the view clean

### Why Use Tabs Instead of Separate Page?

Tabs keep related functionality together:
- Users can quickly switch between views
- No navigation overhead
- Clear visual hierarchy
- Consistent with modern UI patterns
