// Using the same environment variable pattern as in App.tsx
import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Create a custom axios instance for authenticated requests
const authAxios = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Function to get token from cookies
function getAuthToken() {
  const tokenCookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('token='));
  
  return tokenCookie ? tokenCookie.split('=')[1] : '';
}

// Add token to all requests
authAxios.interceptors.request.use(config => {
  const token = getAuthToken();
  if (token) {
    // Add token as both cookie and authorization header for redundancy
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export interface Friend {
  id: number;
  user_id: number;
  friend_id: number;
  username: string;
  email: string;
  status: string;
  requested_by: number;
  created_at: string;
}

export interface UserSearchResult {
  id: number;
  username: string;
  email: string;
}

// Get list of friends
export async function getFriends(): Promise<Friend[]> {
  try {
    const response = await authAxios.get('/friends/');
    // Make sure we always return an array, even if the API returns null or undefined
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching friends:', error);
    // Return empty array instead of throwing error so the UI can handle it gracefully
    return [];
  }
}

// Get pending friend requests
export async function getFriendRequests(): Promise<Friend[]> {
  try {
    const response = await authAxios.get('/friends/requests');
    return response.data;
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    throw new Error('Failed to fetch friend requests');
  }
}

// Send a friend request
export async function sendFriendRequest(friendId: number): Promise<{ message: string }> {
  try {
    const response = await authAxios.post('/friends/request', 
      { friend_id: friendId }
    );
    return response.data;
  } catch (error) {
    console.error('Error sending friend request:', error);
    throw new Error('Failed to send friend request');
  }
}

// Respond to a friend request (accept or reject)
export async function respondToFriendRequest(
  requestId: number, 
  action: 'accept' | 'reject'
): Promise<{ message: string }> {
  try {
    const response = await authAxios.put(`/friends/request/${requestId}`, 
      { action }
    );
    return response.data;
  } catch (error) {
    console.error(`Error ${action}ing friend request:`, error);
    throw new Error(`Failed to ${action} friend request`);
  }
}

// Remove a friend
export async function removeFriend(friendshipId: number): Promise<{ message: string }> {
  try {
    const response = await authAxios.delete(`/friends/${friendshipId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing friend:', error);
    throw new Error('Failed to remove friend');
  }
}

// Search for users to add as friends
export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  try {
    const response = await authAxios.get('/friends/search', {
      params: { q: query }
    });
    // Make sure we always return an array, even if the API returns null or undefined
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error searching users:', error);
    // Return empty array instead of throwing to prevent UI errors
    return [];
  }
}
