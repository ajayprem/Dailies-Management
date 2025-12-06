import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { UserPlus, Users, Check, X } from 'lucide-react';
import { Badge } from './ui/badge';
import { API_ENDPOINTS, apiCall } from '../config/api';

interface FriendsManagerProps {
  accessToken: string;
  userId: string;
}

export function FriendsManager({ accessToken, userId }: FriendsManagerProps) {
  const [friends, setFriends] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
  }, []);

  const fetchFriends = async () => {
    try {
      const data = await apiCall(API_ENDPOINTS.getFriends);
      setFriends(data.friends || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const data = await apiCall(API_ENDPOINTS.getFriendRequests);
      setFriendRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const data = await apiCall(`${API_ENDPOINTS.searchUsers}?search=${encodeURIComponent(search)}`);
      setSearchResults(data.users || []);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleSendRequest = async (friendId: string) => {
    try {
      await apiCall(API_ENDPOINTS.sendFriendRequest, {
        method: 'POST',
        body: JSON.stringify({ friendId }),
      });

      alert('Friend request sent!');
      setSearchResults([]);
      setSearch('');
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await apiCall(API_ENDPOINTS.acceptFriendRequest, {
        method: 'POST',
        body: JSON.stringify({ requestId }),
      });

      fetchFriends();
      fetchFriendRequests();
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2>Friends</h2>
        <p className="text-gray-600 mt-1">Manage your friends and friend requests</p>
      </div>

      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Friend Requests</CardTitle>
            <CardDescription>You have {friendRequests.length} pending request(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {friendRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p>{request.fromUser.name}</p>
                    <p className="text-sm text-gray-600">{request.fromUser.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAcceptRequest(request.id)}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Friends */}
      <Card>
        <CardHeader>
          <CardTitle>Add Friends</CardTitle>
          <CardDescription>Search for users by email/username</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch}>
                Search
              </Button>
            </div>
            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p>{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSendRequest(user.id)}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Add Friend
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Friends List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Friends</CardTitle>
          <CardDescription>
            {friends.length === 0 ? 'No friends yet' : `${friends.length} friend(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {friends.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>Add friends to create challenges and share penalties</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="p-4 bg-gray-50 rounded-lg"
                >
                  <p>{friend.name}</p>
                  <p className="text-sm text-gray-600">{friend.email}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}