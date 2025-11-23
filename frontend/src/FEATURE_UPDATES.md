# Done Dailies - New Feature Updates

## Overview

Four new features have been added to the Done Dailies task management system:

1. **Task Reset Functionality** - Users can undo a task completion if marked by mistake
2. **Calendar View** - Visual calendar showing all past task completions
3. **Detailed Stats Page** - Comprehensive performance metrics for each task
4. **Start and End Dates** - Tasks and challenges now support configurable start and end dates

All of these features apply to both **Tasks** and **Challenges**.

---

## 1. Reset Functionality (Tasks & Challenges)

### User Experience
**For Tasks:**
- Each task card now displays a "Reset" button alongside the "Mark Complete" button
- The Reset button is only enabled when a task has been completed today
- Clicking Reset removes today's completion and shows a success notification
- This allows users to correct mistakes without affecting their completion history

**For Challenges:**
- Challenge cards also include a "Reset" button
- Same functionality as tasks - removes today's completion for the user
- Other participants' completions are not affected

### Backend Requirements
New API endpoints are required:

**POST** `/api/tasks/{taskId}/uncomplete`
- Removes the current date from the task's `completedDates` array
- Returns `{ "success": true }` on success
- Requires Authorization header

**POST** `/api/challenges/{challengeId}/uncomplete`
- Removes the current date from the user's participant record `completedDates` array
- Returns `{ "success": true }` on success
- Requires Authorization header

---

## 2. Calendar View (Tasks & Challenges)

### User Experience
- Accessible through the "View Stats & Calendar" button on each task/challenge card
- Displays an interactive calendar with completed dates highlighted in green
- Users can navigate between months to see historical completion data
- Shows total completion count below the calendar
- Provides visual feedback for consistency

**For Challenges:**
- Shows only the current user's completion dates
- Other participants' completions are shown in the stats section

### Implementation Details
- Uses the existing UI calendar component
- Highlights dates from the `completedDates` array
- For challenges, uses the user's participant record `completedDates`
- No new API endpoints required (uses existing data)

### Component Structure
```
TaskStats / ChallengeStats Dialog
  └── TaskCalendar Component
      └── UI Calendar (with highlighted completion dates)
```

---

## 3. Detailed Stats Page (Tasks & Challenges)

### User Experience
Opens a comprehensive dialog showing:

#### Overview Stats (Top Cards)
- **Total Completions**: Number of times the task has been completed
- **Current Streak**: Consecutive days the task has been completed
- **Longest Streak**: Best streak ever achieved
- **Completion Rate**: Percentage based on expected completions

#### Task Details Card
- Task description
- Period (daily/weekly/monthly) with badge
- Penalty amount
- Next due date
- Status

#### Calendar View
- Visual representation of all completion dates
- Month navigation
- Color-coded completion indicators

#### Performance Insights
- Dynamic motivational messages based on completion rate
- Streak celebrations
- Personalized suggestions

### Calculations

**Current Streak**: Counts consecutive days from today backwards where the task was completed

**Longest Streak**: Finds the longest consecutive sequence of completions in history

**Completion Rate**: 
```
(totalCompletions / expectedCompletions) × 100
where expectedCompletions depends on task period and days since creation
```

### Backend Requirements (Optional)

While the frontend calculates stats from the `completedDates` array, you may optionally implement:

**GET** `/api/tasks/{taskId}/stats`
- Returns pre-calculated statistics
- Reduces frontend computation for tasks with many completions
- Response format:
```json
{
  "stats": {
    "totalCompletions": 15,
    "currentStreak": 3,
    "longestStreak": 7,
    "completionRate": 85.5,
    "totalPenalties": 2,
    "penaltyAmount": 20.00
  }
}
```

---

## 4. Start and End Dates

### User Experience
**For Tasks:**
- When creating a new task, users can specify when it should start (required)
- Users can optionally set an end date for time-bound tasks
- Start date must be today or later
- End date must be after the start date
- These dates are displayed on task cards

**For Challenges:**
- Same date functionality applies to challenges
- All participants follow the same start and end dates
- Perfect for time-boxed challenges like "30-Day Fitness Challenge"

### Form Validation
- Start date picker has minimum value of today
- End date picker has minimum value of start date + 1 day
- End date is optional (blank = ongoing task/challenge)
- Helper text guides users on the purpose of each field

### Backend Requirements

Both task and challenge creation endpoints now include:

**Request Body Changes:**
```json
{
  "startDate": "2024-01-01",  // Required, YYYY-MM-DD format
  "endDate": "2024-12-31"     // Optional, YYYY-MM-DD format
}
```

**Response Changes:**
- Task and challenge objects now include `startDate` and `endDate` fields
- Backend should validate that:
  - startDate >= today
  - endDate > startDate (if provided)
  - Dates are in YYYY-MM-DD format

**Business Logic Considerations:**
- Tasks/challenges should only become "active" on or after their start date
- Tasks/challenges should automatically become "completed" or "expired" after their end date
- Completion tracking should only occur within the date range
- Penalties should not apply before start date or after end date

---

## Updated API Endpoints Summary

### New Required Endpoints
- `POST /api/tasks/{taskId}/uncomplete` - Reset task completion
- `POST /api/challenges/{challengeId}/uncomplete` - Reset challenge completion

### New Optional Endpoint
- `GET /api/tasks/{taskId}/stats` - Get pre-calculated task statistics

### Updated Files
- `/config/api.ts` - Added new endpoint definitions
- `/API_DOCUMENTATION.md` - Added documentation for new endpoints
- `/components/TasksList.tsx` - Added reset button and stats dialog
- `/components/TaskStats.tsx` - New component for detailed task stats
- `/components/ChallengesList.tsx` - Added reset button and stats dialog
- `/components/ChallengeStats.tsx` - New component for detailed challenge stats
- `/components/TaskCalendar.tsx` - New component for calendar view (shared between tasks and challenges)
- `/App.tsx` - Added toast notification support

---

## User Feedback

### Toast Notifications
The following user-facing notifications are now displayed:
- ✅ "Task completed! 🎉" / "Challenge completed! 🎉" - When marking complete
- ✅ "Task completion reset" / "Challenge completion reset" - When resetting
- ❌ "Failed to complete task/challenge" - On completion error
- ❌ "Failed to reset task/challenge" - On reset error

---

## Testing Recommendations

1. **Reset Functionality**
   - Mark a task complete, then immediately reset it
   - Verify the completion is removed from today's date
   - Verify the button states update correctly

2. **Calendar View**
   - Create tasks with various completion patterns
   - Navigate through different months
   - Verify all completed dates are highlighted correctly

3. **Stats Accuracy**
   - Test streak calculations with consecutive completions
   - Test completion rate with different task periods (daily/weekly/monthly)
   - Verify stats update after completing/resetting tasks

4. **Start and End Dates**
   - Set start and end dates for tasks
   - Verify task status changes based on current date
   - Test edge cases (e.g., task starts today, ends tomorrow)

---

## Future Enhancements

Potential improvements to consider:
- Export stats as PDF or image
- Compare stats across multiple tasks
- Set streak goals and notifications
- Share achievements with friends
- Detailed analytics charts using recharts library