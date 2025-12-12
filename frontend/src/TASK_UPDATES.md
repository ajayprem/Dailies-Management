# Task Updates - Personal Tasks, Multiple Recipients & Currency Change

## Summary of Changes

This update includes three major enhancements to the task management system:

1. **Personal Tasks** - Tasks without penalties for personal accountability
2. **Multiple Penalty Recipients** - Split penalties among multiple friends
3. **Currency Change** - All amounts changed from $ (Dollar) to ₹ (Rupee)
4. **Daily View as Default** - Redesigned task page with date navigation

---

## 1. Personal Tasks (No Penalty)

### Feature Description

Users can now create tasks without any penalty concept for pure personal tracking and accountability.

### Implementation

#### UI Changes

- Added checkbox "This is a personal task (no penalty)" in task creation form
- When checked:
  - Penalty amount field is hidden
  - Penalty recipients selector is hidden
  - Form validation adjusted (no friends required)
- Personal tasks display a blue badge with "Personal" label

#### Badge Display

```tsx
{!task.penaltyAmount && (
  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
    <User className="w-3 h-3 mr-1" />
    Personal
  </Badge>
)}
```

#### Backend Data Structure

**Personal Task:**
```json
{
  "title": "Morning meditation",
  "description": "15 minutes",
  "period": "daily",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
  // No penaltyAmount or penaltyRecipientIds
}
```

**Task with Penalty:**
```json
{
  "title": "Go to gym",
  "description": "1 hour workout",
  "period": "daily",
  "penaltyAmount": 100.00,
  "penaltyRecipientIds": ["friend_id_1", "friend_id_2"],
  "startDate": "2024-01-01"
}
```

---

## 2. Multiple Penalty Recipients

### Feature Description

Users can now select **one or more friends** to receive penalties when a task is not completed. The penalty amount is split among all selected recipients.

### Changes from Previous

**Before:** Single recipient dropdown (penaltyRecipientId)
**After:** Multi-select checkbox list (penaltyRecipientIds array)

### Implementation

#### UI - Multi-Select Recipients

```tsx
<div className="space-y-2">
  <Label>Penalty Recipients (Select one or more)</Label>
  <div className="space-y-2 border rounded-md p-3 max-h-48 overflow-y-auto">
    {friends.map((friend) => (
      <div key={friend.id} className="flex items-center space-x-2">
        <Checkbox
          id={`recipient-${friend.id}`}
          checked={formData.penaltyRecipientIds.includes(friend.id)}
          onCheckedChange={() => toggleRecipientSelection(friend.id)}
        />
        <label htmlFor={`recipient-${friend.id}`}>
          {friend.name}
        </label>
      </div>
    ))}
  </div>
  {formData.penaltyRecipientIds.length > 0 && (
    <p className="text-xs text-gray-500">
      Penalty will be split among {formData.penaltyRecipientIds.length} recipient(s)
    </p>
  )}
</div>
```

#### Display Recipients

Task cards now show all recipients:

```tsx
{task.recipientFriends && task.recipientFriends.length > 0 && (
  <div className="text-sm text-gray-600">
    Recipients: {task.recipientFriends.map((f: any) => f.name).join(', ')}
  </div>
)}
```

Example: "Recipients: John, Sarah, Mike"

### Backend Requirements

#### API Changes

**POST /api/tasks - Create Task**

Request body now includes:
```json
{
  "penaltyRecipientIds": ["user_id_1", "user_id_2", "user_id_3"]
}
```

**GET /api/tasks - Response**

Backend should populate friend details:
```json
{
  "tasks": [
    {
      "id": "task_id",
      "penaltyAmount": 150.00,
      "penaltyRecipientIds": ["friend_1", "friend_2"],
      "recipientFriends": [
        { "id": "friend_1", "name": "John Doe" },
        { "id": "friend_2", "name": "Jane Smith" }
      ]
    }
  ]
}
```

#### Penalty Distribution Logic

When a task penalty is triggered, backend should:

1. Calculate split amount: `splitAmount = penaltyAmount / recipientIds.length`
2. Create penalty records for each recipient
3. Example: ₹300 penalty with 3 recipients = ₹100 each

```javascript
// Backend pseudo-code
const splitAmount = task.penaltyAmount / task.penaltyRecipientIds.length;

for (const recipientId of task.penaltyRecipientIds) {
  await createPenalty({
    fromUserId: task.userId,
    toUserId: recipientId,
    amount: splitAmount,
    taskId: task.id,
    type: 'task',
    reason: `Incomplete task: ${task.title}`
  });
}
```

---

## 3. Currency Change: $ → ₹

### All Currency References Updated

Changed from Dollar ($) to Indian Rupee (₹) across the entire application:

#### Updated Files

1. **/components/TasksList.tsx**
   - Form label: "Penalty Amount (₹)"
   - Placeholder: "100.00" (was "10.00")
   - Display: `₹{task.penaltyAmount}`

2. **/components/DailyTasksView.tsx**
   - Display: `₹{task.penaltyAmount}`

3. **/components/ChallengesList.tsx**
   - Form label: "Penalty Amount (₹)"
   - Placeholder: "250.00" (was "25.00")
   - Display: `₹{challenge.penaltyAmount}`

4. **/components/DailyChallengesView.tsx**
   - Display: `₹{challenge.penaltyAmount}`

5. **/components/PenaltiesView.tsx**
   - Summary amounts: `₹{owed.toFixed(2)}`
   - Penalty list: `₹{penalty.amount.toFixed(2)}`

6. **/components/TaskStats.tsx**
   - Penalty display: `₹{task.penaltyAmount}`

7. **/components/ChallengeStats.tsx**
   - Penalty display: `₹{challenge.penaltyAmount}`

#### Sample Amounts Adjusted

To reflect typical Rupee values:
- Tasks: ₹100 (was $10)
- Challenges: ₹250 (was $25)

---

## 4. Daily View as Default with Navigation

### Major UI Redesign

The Tasks page now defaults to a **daily view** with date navigation controls instead of separate tabs.

### New Interface

#### Navigation Controls

1. **Back Arrow (←)** - Go to previous day
2. **Date Picker** - Select any specific date
3. **Forward Arrow (→)** - Go to next day (disabled for future dates)
4. **"All Tasks" Button** - Toggle to see complete task list

#### Default View

Shows: "Today's Tasks" by default with:
- All tasks due today (both completed and uncompleted)
- Clear completion status indicators
- One-click completion toggle

#### Date Navigation

```tsx
<div className="flex items-center gap-2">
  <Button variant="outline" size="icon" onClick={() => navigateDate('prev')}>
    <ChevronLeft className="w-4 h-4" />
  </Button>
  
  <Input
    type="date"
    value={selectedDate}
    onChange={(e) => setSelectedDate(e.target.value)}
    max={new Date().toISOString().split('T')[0]}
  />
  
  <Button 
    variant="outline" 
    size="icon" 
    onClick={() => navigateDate('next')}
    disabled={!canGoForward}
  >
    <ChevronRight className="w-4 h-4" />
  </Button>
</div>
```

### Smart Filtering

Tasks are filtered based on:
- **Daily tasks**: Show every day
- **Weekly tasks**: Show on matching day of week
- **Monthly tasks**: Show on matching day of month
- **Date range**: Respect startDate and endDate

### View Toggle

Users can switch between:

**Daily View (Default)**
- Date-focused view
- Navigation arrows
- Tasks for selected date only
- Completion status for that date

**All Tasks View**
- Complete task list
- Shows total count
- Stats and management for each task
- Today's completion status

### Removed Features

- ❌ Separate "Daily View" tab (now the default)
- ❌ "All Tasks" as default tab
- ✅ Single toggle button to switch views

---

## Updated Data Model

### Task Object (Complete)

```typescript
interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  period: 'daily' | 'weekly' | 'monthly';
  
  // Optional penalty fields (personal tasks won't have these)
  penaltyAmount?: number;
  penaltyRecipientIds?: string[];
  recipientFriends?: Array<{
    id: string;
    name: string;
    email?: string;
  }>;
  
  // Dates
  startDate: string;        // YYYY-MM-DD
  endDate?: string;         // YYYY-MM-DD (optional)
  createdAt: string;
  
  // Completion tracking
  completedDates: string[]; // Array of YYYY-MM-DD dates
  status: 'active' | 'completed' | 'archived';
}
```

### Examples

**Personal Task (No Penalty):**
```json
{
  "id": "task_1",
  "userId": "user_123",
  "title": "Morning meditation",
  "description": "15 minutes mindfulness",
  "period": "daily",
  "startDate": "2024-01-01",
  "completedDates": ["2024-01-01", "2024-01-02"],
  "status": "active"
}
```

**Task with Single Recipient:**
```json
{
  "id": "task_2",
  "userId": "user_123",
  "title": "Gym workout",
  "description": "1 hour strength training",
  "period": "daily",
  "penaltyAmount": 100.00,
  "penaltyRecipientIds": ["friend_1"],
  "recipientFriends": [
    { "id": "friend_1", "name": "John Doe" }
  ],
  "startDate": "2024-01-01",
  "completedDates": ["2024-01-01"],
  "status": "active"
}
```

**Task with Multiple Recipients:**
```json
{
  "id": "task_3",
  "userId": "user_123",
  "title": "Code review",
  "description": "Review PRs daily",
  "period": "daily",
  "penaltyAmount": 300.00,
  "penaltyRecipientIds": ["friend_1", "friend_2", "friend_3"],
  "recipientFriends": [
    { "id": "friend_1", "name": "John" },
    { "id": "friend_2", "name": "Sarah" },
    { "id": "friend_3", "name": "Mike" }
  ],
  "startDate": "2024-01-01",
  "endDate": "2024-03-31",
  "completedDates": ["2024-01-01", "2024-01-02"],
  "status": "active"
}
```

---

## Form Validation

### Personal Tasks
- ✅ Title required
- ✅ Period required
- ✅ Start date required
- ❌ No penalty amount needed
- ❌ No recipients needed
- ❌ No friends needed

### Tasks with Penalty
- ✅ Title required
- ✅ Period required
- ✅ Start date required
- ✅ Penalty amount required
- ✅ At least one recipient required
- ✅ Must have friends to create

### Button States

```tsx
<Button 
  type="submit" 
  disabled={!isPersonalTask && (friends.length === 0 || formData.penaltyRecipientIds.length === 0)}
>
  Create Task
</Button>
```

- Personal task: Always enabled (if basic fields filled)
- Task with penalty: Requires friends and at least one recipient selected

---

## User Experience Improvements

### 1. Flexible Task Creation
- Users can track habits without social pressure
- Option to add accountability later
- Mix personal and penalty-based tasks

### 2. Fair Penalty Distribution
- Split penalties among multiple friends
- More flexible accountability structure
- Better for group accountability

### 3. Localized Currency
- Indian Rupee (₹) for local users
- Adjusted sample amounts to realistic values

### 4. Streamlined Daily View
- Immediate focus on today's tasks
- Easy navigation to past/future days
- Quick access to complete task list when needed
- Less clicking, more doing

### 5. Visual Clarity
- Personal tasks clearly marked with badge
- Completed tasks shown with green background
- Future dates blocked with warning message
- Today's tasks highlighted

---

## API Documentation Updates

### Updated Endpoints

#### POST /api/tasks

**Request Body:**
```json
{
  "title": "Task title",
  "description": "Description",
  "period": "daily",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  
  // Optional - only for tasks with penalties
  "penaltyAmount": 100.00,
  "penaltyRecipientIds": ["friend_id_1", "friend_id_2"]
}
```

**Validation:**
- If `penaltyAmount` is provided, `penaltyRecipientIds` must have at least one ID
- If `penaltyRecipientIds` is provided, `penaltyAmount` must be positive number
- Both penalty fields must be either present or absent together

#### GET /api/tasks

**Response:**
```json
{
  "tasks": [
    {
      "id": "task_id",
      "title": "Task title",
      "penaltyAmount": 150.00,
      "penaltyRecipientIds": ["friend_1", "friend_2"],
      "recipientFriends": [
        { "id": "friend_1", "name": "John", "email": "john@example.com" },
        { "id": "friend_2", "name": "Sarah", "email": "sarah@example.com" }
      ],
      "completedDates": ["2024-01-01", "2024-01-02"]
    }
  ]
}
```

**Backend Logic:**
- Populate `recipientFriends` array by joining with user table
- Include at minimum: id, name
- Optionally include: email, avatar

---

## Migration Guide

### For Existing Tasks

Existing tasks with `penaltyRecipientId` should be migrated to `penaltyRecipientIds`:

```javascript
// Migration pseudo-code
for (const task of existingTasks) {
  if (task.penaltyRecipientId) {
    task.penaltyRecipientIds = [task.penaltyRecipientId];
    delete task.penaltyRecipientId;
  }
}
```

### For Penalties

When calculating penalties for old tasks:
- If task has `penaltyRecipientIds`, split penalty
- Maintain backward compatibility

---

## Testing Checklist

### Personal Tasks
- [ ] Create personal task without selecting friends
- [ ] Verify no penalty fields shown when checkbox checked
- [ ] Verify "Personal" badge displays on task card
- [ ] Complete personal task - no penalty created
- [ ] View stats for personal task

### Multiple Recipients
- [ ] Create task with 1 recipient
- [ ] Create task with 3+ recipients
- [ ] Verify recipient names display correctly
- [ ] Verify split amount calculation
- [ ] Miss task deadline - verify penalties created for all recipients

### Daily View
- [ ] Default view shows today's tasks
- [ ] Navigate backward with arrow
- [ ] Navigate forward with arrow (disabled for future)
- [ ] Select specific date with date picker
- [ ] Toggle to "All Tasks" view
- [ ] Toggle back to daily view
- [ ] Complete task for selected date
- [ ] Verify completion persists after navigation

### Currency
- [ ] Verify ₹ symbol shows in all locations
- [ ] Create task with rupee amount
- [ ] View penalties in rupees
- [ ] Check challenge penalties in rupees

---

## Summary

These updates provide users with:
1. **Flexibility** - Choice between personal tracking and accountability
2. **Collaboration** - Split penalties among multiple friends
3. **Localization** - Rupee currency for Indian market
4. **Efficiency** - Quick daily task management with navigation

The application now supports a wider range of use cases from purely personal habit tracking to complex group accountability systems.
