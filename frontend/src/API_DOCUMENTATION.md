# Done Dailies - API Documentation

This document describes the API endpoints your backend needs to implement for the Done Dailies application.

## Configuration

Update the `API_BASE_URL` in `/config/api.ts` to point to your backend server.

```typescript
export const API_BASE_URL = 'http://localhost:3000/api'; // Change this to your backend URL
```

## Authentication

All authenticated endpoints require an `Authorization` header with a Bearer token:

```
Authorization: Bearer {token}
```

---

## Auth Endpoints

### POST /api/auth/signup

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "userId": "user_id_here"
}
```

### POST /api/auth/login

Sign in with existing credentials.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "userId": "user_id_here"
}
```

### GET /api/auth/profile

Get the authenticated user's profile.

**Headers:** Requires `Authorization`

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "friends": ["friend_id_1", "friend_id_2"],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Friends Endpoints

### GET /api/users/search?email={email}

Search for users by email address.

**Headers:** Requires `Authorization`

**Query Parameters:**
- `email` (string): Email to search for

**Response:**
```json
{
  "users": [
    {
      "id": "user_id",
      "email": "friend@example.com",
      "name": "Friend Name"
    }
  ]
}
```

### POST /api/friends/request

Send a friend request.

**Headers:** Requires `Authorization`

**Request Body:**
```json
{
  "friendId": "user_id_to_befriend"
}
```

**Response:**
```json
{
  "success": true
}
```

### GET /api/friends/requests

Get pending friend requests for the authenticated user.

**Headers:** Requires `Authorization`

**Response:**
```json
{
  "requests": [
    {
      "id": "request_id",
      "fromUserId": "sender_user_id",
      "toUserId": "receiver_user_id",
      "status": "pending",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "fromUser": {
        "id": "sender_user_id",
        "name": "Sender Name",
        "email": "sender@example.com"
      }
    }
  ]
}
```

### POST /api/friends/accept

Accept a friend request.

**Headers:** Requires `Authorization`

**Request Body:**
```json
{
  "requestId": "request_id"
}
```

**Response:**
```json
{
  "success": true
}
```

### GET /api/friends

Get the authenticated user's friends list.

**Headers:** Requires `Authorization`

**Response:**
```json
{
  "friends": [
    {
      "id": "friend_id",
      "name": "Friend Name",
      "email": "friend@example.com"
    }
  ]
}
```

---

## Tasks Endpoints

### GET /api/tasks

Get all tasks for the authenticated user.

**Headers:** Requires `Authorization`

**Response:**
```json
{
  "tasks": [
    {
      "id": "task_id",
      "userId": "user_id",
      "title": "Go to the gym",
      "description": "30 minutes cardio",
      "period": "daily",
      "penaltyAmount": 10.00,
      "penaltyRecipientId": "friend_id",
      "status": "active",
      "completedDates": ["2024-01-01", "2024-01-02"],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "nextDueDate": "2024-01-03"
    }
  ]
}
```

### POST /api/tasks

Create a new task.

**Headers:** Requires `Authorization`

**Request Body:**
```json
{
  "title": "Go to the gym",
  "description": "30 minutes cardio",
  "period": "daily",
  "penaltyAmount": 10.00,
  "penaltyRecipientId": "friend_id"
}
```

**Response:**
```json
{
  "task": {
    "id": "task_id",
    "userId": "user_id",
    "title": "Go to the gym",
    "description": "30 minutes cardio",
    "period": "daily",
    "penaltyAmount": 10.00,
    "penaltyRecipientId": "friend_id",
    "status": "active",
    "completedDates": [],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "nextDueDate": "2024-01-02"
  }
}
```

### POST /api/tasks/{taskId}/complete

Mark a task as complete for today.

**Headers:** Requires `Authorization`

**Response:**
```json
{
  "success": true
}
```

### POST /api/tasks/{taskId}/uncomplete

Remove today's completion for a task (reset/undo completion).

**Headers:** Requires `Authorization`

**Response:**
```json
{
  "success": true
}
```

### GET /api/tasks/{taskId}/stats

Get detailed statistics for a specific task.

**Headers:** Requires `Authorization`

**Response:**
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

### POST /api/tasks/{taskId}/penalty

Apply a penalty for an incomplete task.

**Headers:** Requires `Authorization`

**Response:**
```json
{
  "success": true,
  "penaltyId": "penalty_id"
}
```

---

## Challenges Endpoints

### GET /api/challenges

Get all challenges for the authenticated user (created or invited to).

**Headers:** Requires `Authorization`

**Response:**
```json
{
  "challenges": [
    {
      "id": "challenge_id",
      "creatorId": "creator_user_id",
      "title": "30-Day Fitness Challenge",
      "description": "Work out every day",
      "period": "daily",
      "penaltyAmount": 25.00,
      "participants": [
        {
          "userId": "user_id",
          "status": "accepted",
          "completedDates": ["2024-01-01"]
        }
      ],
      "invitedUsers": ["invited_user_id"],
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "nextDueDate": "2024-01-02"
    }
  ]
}
```

### POST /api/challenges

Create a new challenge.

**Headers:** Requires `Authorization`

**Request Body:**
```json
{
  "title": "30-Day Fitness Challenge",
  "description": "Work out every day",
  "period": "daily",
  "penaltyAmount": 25.00,
  "invitedUserIds": ["friend_id_1", "friend_id_2"]
}
```

**Response:**
```json
{
  "challenge": {
    "id": "challenge_id",
    "creatorId": "user_id",
    "title": "30-Day Fitness Challenge",
    "description": "Work out every day",
    "period": "daily",
    "penaltyAmount": 25.00,
    "participants": [
      {
        "userId": "user_id",
        "status": "accepted",
        "completedDates": []
      }
    ],
    "invitedUsers": ["friend_id_1", "friend_id_2"],
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "nextDueDate": "2024-01-02"
  }
}
```

### POST /api/challenges/{challengeId}/accept

Accept a challenge invitation.

**Headers:** Requires `Authorization`

**Response:**
```json
{
  "success": true
}
```

### POST /api/challenges/{challengeId}/complete

Mark a challenge as complete for today.

**Headers:** Requires `Authorization`

**Response:**
```json
{
  "success": true
}
```

### POST /api/challenges/{challengeId}/penalty

Apply a penalty for a failed challenge.

**Headers:** Requires `Authorization`

**Request Body:**
```json
{
  "failedUserId": "user_id_who_failed"
}
```

**Response:**
```json
{
  "success": true,
  "penaltyId": "penalty_id"
}
```

---

## Penalties Endpoints

### GET /api/penalties

Get all penalties for the authenticated user (owed or receiving).

**Headers:** Requires `Authorization`

**Response:**
```json
{
  "penalties": [
    {
      "id": "penalty_id",
      "type": "task",
      "taskId": "task_id",
      "fromUserId": "user_who_owes",
      "toUserId": "user_who_receives",
      "amount": 10.00,
      "reason": "Incomplete task: Go to the gym",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## Data Models

### Period Values
- `"daily"` - Task/Challenge repeats every day
- `"weekly"` - Task/Challenge repeats every week  
- `"monthly"` - Task/Challenge repeats every month

### Status Values
- `"active"` - Task/Challenge is active
- `"pending"` - Friend request is pending
- `"accepted"` - Friend request or challenge participation accepted

---

## Notes

- All dates should be in ISO 8601 format
- Amounts are in USD (or your currency of choice)
- The `completedDates` array stores dates in YYYY-MM-DD format
- The frontend checks if today's date is in `completedDates` to determine completion status