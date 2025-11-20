import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'

const app = new Hono()

app.use('*', cors())
app.use('*', logger(console.log))

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

// Helper to verify user
async function verifyUser(request: Request) {
  const accessToken = request.headers.get('Authorization')?.split(' ')[1]
  if (!accessToken) return null
  
  const { data: { user }, error } = await supabase.auth.getUser(accessToken)
  if (error || !user) return null
  
  return user.id
}

// Sign up route
app.post('/make-server-8bccf31d/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json()
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    })
    
    if (error) {
      console.log(`Error during signup: ${error.message}`)
      return c.json({ error: error.message }, 400)
    }
    
    // Create user profile
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      friends: [],
      createdAt: new Date().toISOString()
    })
    
    return c.json({ user: data.user })
  } catch (error) {
    console.log(`Signup error: ${error}`)
    return c.json({ error: 'Signup failed' }, 500)
  }
})

// Get user profile
app.get('/make-server-8bccf31d/profile', async (c) => {
  const userId = await verifyUser(c.req.raw)
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)
  
  try {
    const user = await kv.get(`user:${userId}`)
    return c.json({ user })
  } catch (error) {
    console.log(`Error fetching profile: ${error}`)
    return c.json({ error: 'Failed to fetch profile' }, 500)
  }
})

// Search users by email
app.get('/make-server-8bccf31d/users/search', async (c) => {
  const userId = await verifyUser(c.req.raw)
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)
  
  try {
    const email = c.req.query('email')
    if (!email) return c.json({ users: [] })
    
    const allUsers = await kv.getByPrefix('user:')
    const matches = allUsers
      .filter((u: any) => u.email.toLowerCase().includes(email.toLowerCase()) && u.id !== userId)
      .map((u: any) => ({ id: u.id, email: u.email, name: u.name }))
    
    return c.json({ users: matches })
  } catch (error) {
    console.log(`Error searching users: ${error}`)
    return c.json({ error: 'Search failed' }, 500)
  }
})

// Send friend request
app.post('/make-server-8bccf31d/friends/request', async (c) => {
  const userId = await verifyUser(c.req.raw)
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)
  
  try {
    const { friendId } = await c.req.json()
    
    // Create friend request
    const requestId = `${userId}-${friendId}-${Date.now()}`
    await kv.set(`friend_request:${requestId}`, {
      id: requestId,
      fromUserId: userId,
      toUserId: friendId,
      status: 'pending',
      createdAt: new Date().toISOString()
    })
    
    return c.json({ success: true })
  } catch (error) {
    console.log(`Error sending friend request: ${error}`)
    return c.json({ error: 'Failed to send request' }, 500)
  }
})

// Get friend requests
app.get('/make-server-8bccf31d/friends/requests', async (c) => {
  const userId = await verifyUser(c.req.raw)
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)
  
  try {
    const allRequests = await kv.getByPrefix('friend_request:')
    const requests = allRequests.filter((r: any) => r.toUserId === userId && r.status === 'pending')
    
    // Get user details for each request
    const requestsWithUsers = await Promise.all(
      requests.map(async (r: any) => {
        const fromUser = await kv.get(`user:${r.fromUserId}`)
        return { ...r, fromUser: { id: fromUser.id, name: fromUser.name, email: fromUser.email } }
      })
    )
    
    return c.json({ requests: requestsWithUsers })
  } catch (error) {
    console.log(`Error fetching friend requests: ${error}`)
    return c.json({ error: 'Failed to fetch requests' }, 500)
  }
})

// Accept friend request
app.post('/make-server-8bccf31d/friends/accept', async (c) => {
  const userId = await verifyUser(c.req.raw)
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)
  
  try {
    const { requestId } = await c.req.json()
    const request = await kv.get(`friend_request:${requestId}`)
    
    if (!request || request.toUserId !== userId) {
      return c.json({ error: 'Invalid request' }, 400)
    }
    
    // Update request status
    await kv.set(`friend_request:${requestId}`, { ...request, status: 'accepted' })
    
    // Add to both users' friend lists
    const user = await kv.get(`user:${userId}`)
    const friend = await kv.get(`user:${request.fromUserId}`)
    
    await kv.set(`user:${userId}`, {
      ...user,
      friends: [...(user.friends || []), request.fromUserId]
    })
    
    await kv.set(`user:${request.fromUserId}`, {
      ...friend,
      friends: [...(friend.friends || []), userId]
    })
    
    return c.json({ success: true })
  } catch (error) {
    console.log(`Error accepting friend request: ${error}`)
    return c.json({ error: 'Failed to accept request' }, 500)
  }
})

// Get friends list
app.get('/make-server-8bccf31d/friends', async (c) => {
  const userId = await verifyUser(c.req.raw)
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)
  
  try {
    const user = await kv.get(`user:${userId}`)
    const friendIds = user.friends || []
    
    const friends = await Promise.all(
      friendIds.map(async (fId: string) => {
        const friend = await kv.get(`user:${fId}`)
        return { id: friend.id, name: friend.name, email: friend.email }
      })
    )
    
    return c.json({ friends })
  } catch (error) {
    console.log(`Error fetching friends: ${error}`)
    return c.json({ error: 'Failed to fetch friends' }, 500)
  }
})

// Create task
app.post('/make-server-8bccf31d/tasks', async (c) => {
  const userId = await verifyUser(c.req.raw)
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)
  
  try {
    const { title, description, period, penaltyAmount, penaltyRecipientId } = await c.req.json()
    
    const taskId = `task:${userId}:${Date.now()}`
    const task = {
      id: taskId,
      userId,
      title,
      description,
      period, // 'daily', 'weekly', 'monthly'
      penaltyAmount,
      penaltyRecipientId,
      status: 'active',
      completedDates: [],
      createdAt: new Date().toISOString(),
      nextDueDate: getNextDueDate(period)
    }
    
    await kv.set(taskId, task)
    return c.json({ task })
  } catch (error) {
    console.log(`Error creating task: ${error}`)
    return c.json({ error: 'Failed to create task' }, 500)
  }
})

// Get user tasks
app.get('/make-server-8bccf31d/tasks', async (c) => {
  const userId = await verifyUser(c.req.raw)
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)
  
  try {
    const allTasks = await kv.getByPrefix(`task:${userId}:`)
    return c.json({ tasks: allTasks })
  } catch (error) {
    console.log(`Error fetching tasks: ${error}`)
    return c.json({ error: 'Failed to fetch tasks' }, 500)
  }
})

// Complete task
app.post('/make-server-8bccf31d/tasks/:taskId/complete', async (c) => {
  const userId = await verifyUser(c.req.raw)
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)
  
  try {
    const taskId = c.req.param('taskId')
    const task = await kv.get(taskId)
    
    if (!task || task.userId !== userId) {
      return c.json({ error: 'Task not found' }, 404)
    }
    
    const today = new Date().toISOString().split('T')[0]
    const completedDates = task.completedDates || []
    
    if (!completedDates.includes(today)) {
      completedDates.push(today)
    }
    
    await kv.set(taskId, {
      ...task,
      completedDates,
      nextDueDate: getNextDueDate(task.period)
    })
    
    return c.json({ success: true })
  } catch (error) {
    console.log(`Error completing task: ${error}`)
    return c.json({ error: 'Failed to complete task' }, 500)
  }
})

// Apply penalty (when task is incomplete)
app.post('/make-server-8bccf31d/tasks/:taskId/penalty', async (c) => {
  const userId = await verifyUser(c.req.raw)
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)
  
  try {
    const taskId = c.req.param('taskId')
    const task = await kv.get(taskId)
    
    if (!task || task.userId !== userId) {
      return c.json({ error: 'Task not found' }, 404)
    }
    
    const penaltyId = `penalty:${Date.now()}`
    await kv.set(penaltyId, {
      id: penaltyId,
      type: 'task',
      taskId,
      fromUserId: userId,
      toUserId: task.penaltyRecipientId,
      amount: task.penaltyAmount,
      reason: `Incomplete task: ${task.title}`,
      createdAt: new Date().toISOString()
    })
    
    return c.json({ success: true, penaltyId })
  } catch (error) {
    console.log(`Error applying penalty: ${error}`)
    return c.json({ error: 'Failed to apply penalty' }, 500)
  }
})

// Create challenge
app.post('/make-server-8bccf31d/challenges', async (c) => {
  const userId = await verifyUser(c.req.raw)
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)
  
  try {
    const { title, description, period, penaltyAmount, invitedUserIds } = await c.req.json()
    
    const challengeId = `challenge:${Date.now()}`
    const challenge = {
      id: challengeId,
      creatorId: userId,
      title,
      description,
      period,
      penaltyAmount,
      participants: [{
        userId,
        status: 'accepted',
        completedDates: []
      }],
      invitedUsers: invitedUserIds,
      status: 'active',
      createdAt: new Date().toISOString(),
      nextDueDate: getNextDueDate(period)
    }
    
    await kv.set(challengeId, challenge)
    return c.json({ challenge })
  } catch (error) {
    console.log(`Error creating challenge: ${error}`)
    return c.json({ error: 'Failed to create challenge' }, 500)
  }
})

// Get challenges (created by or invited to)
app.get('/make-server-8bccf31d/challenges', async (c) => {
  const userId = await verifyUser(c.req.raw)
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)
  
  try {
    const allChallenges = await kv.getByPrefix('challenge:')
    const userChallenges = allChallenges.filter((ch: any) => 
      ch.creatorId === userId || 
      ch.invitedUsers?.includes(userId) || 
      ch.participants?.some((p: any) => p.userId === userId)
    )
    
    return c.json({ challenges: userChallenges })
  } catch (error) {
    console.log(`Error fetching challenges: ${error}`)
    return c.json({ error: 'Failed to fetch challenges' }, 500)
  }
})

// Accept challenge invitation
app.post('/make-server-8bccf31d/challenges/:challengeId/accept', async (c) => {
  const userId = await verifyUser(c.req.raw)
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)
  
  try {
    const challengeId = c.req.param('challengeId')
    const challenge = await kv.get(challengeId)
    
    if (!challenge || !challenge.invitedUsers?.includes(userId)) {
      return c.json({ error: 'Challenge not found' }, 404)
    }
    
    // Add user to participants
    const participants = challenge.participants || []
    if (!participants.some((p: any) => p.userId === userId)) {
      participants.push({
        userId,
        status: 'accepted',
        completedDates: []
      })
    }
    
    await kv.set(challengeId, { ...challenge, participants })
    return c.json({ success: true })
  } catch (error) {
    console.log(`Error accepting challenge: ${error}`)
    return c.json({ error: 'Failed to accept challenge' }, 500)
  }
})

// Complete challenge
app.post('/make-server-8bccf31d/challenges/:challengeId/complete', async (c) => {
  const userId = await verifyUser(c.req.raw)
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)
  
  try {
    const challengeId = c.req.param('challengeId')
    const challenge = await kv.get(challengeId)
    
    if (!challenge) {
      return c.json({ error: 'Challenge not found' }, 404)
    }
    
    const today = new Date().toISOString().split('T')[0]
    const participants = challenge.participants.map((p: any) => {
      if (p.userId === userId) {
        const completedDates = p.completedDates || []
        if (!completedDates.includes(today)) {
          completedDates.push(today)
        }
        return { ...p, completedDates }
      }
      return p
    })
    
    await kv.set(challengeId, {
      ...challenge,
      participants,
      nextDueDate: getNextDueDate(challenge.period)
    })
    
    return c.json({ success: true })
  } catch (error) {
    console.log(`Error completing challenge: ${error}`)
    return c.json({ error: 'Failed to complete challenge' }, 500)
  }
})

// Apply penalty to challenge participant
app.post('/make-server-8bccf31d/challenges/:challengeId/penalty', async (c) => {
  const userId = await verifyUser(c.req.raw)
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)
  
  try {
    const challengeId = c.req.param('challengeId')
    const { failedUserId } = await c.req.json()
    const challenge = await kv.get(challengeId)
    
    if (!challenge) {
      return c.json({ error: 'Challenge not found' }, 404)
    }
    
    const penaltyId = `penalty:${Date.now()}`
    await kv.set(penaltyId, {
      id: penaltyId,
      type: 'challenge',
      challengeId,
      fromUserId: failedUserId,
      amount: challenge.penaltyAmount,
      reason: `Failed challenge: ${challenge.title}`,
      createdAt: new Date().toISOString()
    })
    
    return c.json({ success: true, penaltyId })
  } catch (error) {
    console.log(`Error applying challenge penalty: ${error}`)
    return c.json({ error: 'Failed to apply penalty' }, 500)
  }
})

// Get penalties
app.get('/make-server-8bccf31d/penalties', async (c) => {
  const userId = await verifyUser(c.req.raw)
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)
  
  try {
    const allPenalties = await kv.getByPrefix('penalty:')
    const userPenalties = allPenalties.filter((p: any) => 
      p.fromUserId === userId || p.toUserId === userId
    )
    
    return c.json({ penalties: userPenalties })
  } catch (error) {
    console.log(`Error fetching penalties: ${error}`)
    return c.json({ error: 'Failed to fetch penalties' }, 500)
  }
})

// Helper function to calculate next due date
function getNextDueDate(period: string): string {
  const now = new Date()
  switch (period) {
    case 'daily':
      now.setDate(now.getDate() + 1)
      break
    case 'weekly':
      now.setDate(now.getDate() + 7)
      break
    case 'monthly':
      now.setMonth(now.getMonth() + 1)
      break
  }
  return now.toISOString().split('T')[0]
}

Deno.serve(app.fetch)
