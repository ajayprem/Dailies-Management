// API Configuration
// Update this with your backend URL
export const API_BASE_URL = 'http://localhost:8080/api'; // Change this to your backend URL

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  signup: `${API_BASE_URL}/auth/signup`,
  login: `${API_BASE_URL}/auth/login`,
  profile: `${API_BASE_URL}/auth/profile`,
  
  // Friends
  searchUsers: `${API_BASE_URL}/friends/search`,
  sendFriendRequest: `${API_BASE_URL}/friends/request`,
  getFriendRequests: `${API_BASE_URL}/friends/requests`,
  acceptFriendRequest: `${API_BASE_URL}/friends/accept`,
  deleteFriendRequest: `${API_BASE_URL}/friends/delete`,
  getFriends: `${API_BASE_URL}/friends`,
  getSentFriendRequests: `${API_BASE_URL}/friends/sent-requests`,
  
  // Tasks
  getTasks: `${API_BASE_URL}/tasks`,
  createTask: `${API_BASE_URL}/tasks`,
  completeTask: (taskId: string) => `${API_BASE_URL}/tasks/${taskId}/complete`,
  uncompleteTask: (taskId: string) => `${API_BASE_URL}/tasks/${taskId}/uncomplete`,
  completeTaskForDate: (taskId: string) => `${API_BASE_URL}/tasks/${taskId}/complete-for-date`,
  uncompleteTaskForDate: (taskId: string) => `${API_BASE_URL}/tasks/${taskId}/uncomplete-for-date`,
  getTaskStats: (taskId: string) => `${API_BASE_URL}/tasks/${taskId}/stats`,
  applyTaskPenalty: (taskId: string) => `${API_BASE_URL}/tasks/${taskId}/penalty`,
  
  // Challenges
  getChallenges: `${API_BASE_URL}/challenges`,
  createChallenge: `${API_BASE_URL}/challenges`,
  acceptChallenge: (challengeId: string) => `${API_BASE_URL}/challenges/${challengeId}/accept`,
  completeChallenge: (challengeId: string) => `${API_BASE_URL}/challenges/${challengeId}/complete`,
  uncompleteChallenge: (challengeId: string) => `${API_BASE_URL}/challenges/${challengeId}/uncomplete`,
  applyChallengePenalty: (challengeId: string) => `${API_BASE_URL}/challenges/${challengeId}/penalty`,
  
  // Penalties
  getPenalties: `${API_BASE_URL}/penalties`,
};

// Helper function for API calls
export async function apiCall(
  url: string,
  options: RequestInit = {}
): Promise<any> {
  const token = localStorage.getItem('authToken');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  console.log('API Call to:', url, 'with headers:', headers);
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `API call failed: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}