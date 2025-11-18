import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Plus, CheckCircle, Users, Target } from 'lucide-react';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { API_ENDPOINTS, apiCall } from '../config/api';

interface ChallengesListProps {
  accessToken: string;
  userId: string;
}

export function ChallengesList({ accessToken, userId }: ChallengesListProps) {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    period: 'daily',
    penaltyAmount: '',
    invitedUserIds: [] as string[],
  });

  useEffect(() => {
    fetchChallenges();
    fetchFriends();
  }, []);

  const fetchChallenges = async () => {
    try {
      const data = await apiCall(API_ENDPOINTS.getChallenges);
      setChallenges(data.challenges || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const data = await apiCall(API_ENDPOINTS.getFriends);
      setFriends(data.friends || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiCall(API_ENDPOINTS.createChallenge, {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          penaltyAmount: parseFloat(formData.penaltyAmount),
        }),
      });

      setDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        period: 'daily',
        penaltyAmount: '',
        invitedUserIds: [],
      });
      fetchChallenges();
    } catch (error) {
      console.error('Error creating challenge:', error);
    }
  };

  const handleAcceptChallenge = async (challengeId: string) => {
    try {
      await apiCall(API_ENDPOINTS.acceptChallenge(challengeId), {
        method: 'POST',
      });
      fetchChallenges();
    } catch (error) {
      console.error('Error accepting challenge:', error);
    }
  };

  const handleCompleteChallenge = async (challengeId: string) => {
    try {
      await apiCall(API_ENDPOINTS.completeChallenge(challengeId), {
        method: 'POST',
      });
      fetchChallenges();
    } catch (error) {
      console.error('Error completing challenge:', error);
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    setFormData((prev) => ({
      ...prev,
      invitedUserIds: prev.invitedUserIds.includes(friendId)
        ? prev.invitedUserIds.filter((id) => id !== friendId)
        : [...prev.invitedUserIds, friendId],
    }));
  };

  const getUserParticipant = (challenge: any) => {
    return challenge.participants?.find((p: any) => p.userId === userId);
  };

  const isChallengeCompletedToday = (challenge: any) => {
    const today = new Date().toISOString().split('T')[0];
    const userParticipant = getUserParticipant(challenge);
    return userParticipant?.completedDates?.includes(today);
  };

  const isUserInvited = (challenge: any) => {
    return challenge.invitedUsers?.includes(userId) && !challenge.participants?.some((p: any) => p.userId === userId);
  };

  if (loading) {
    return <div className="text-center py-8">Loading challenges...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2>Challenges</h2>
          <p className="text-gray-600 mt-1">Create and join challenges with friends</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Challenge
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Challenge</DialogTitle>
              <DialogDescription>
                Challenge your friends to complete a task together
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateChallenge} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Challenge Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g., 30-Day Fitness Challenge"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what participants need to do"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="period">Period</Label>
                <Select
                  value={formData.period}
                  onValueChange={(value) => setFormData({ ...formData, period: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="penalty">Penalty Amount ($)</Label>
                <Input
                  id="penalty"
                  type="number"
                  step="0.01"
                  value={formData.penaltyAmount}
                  onChange={(e) => setFormData({ ...formData, penaltyAmount: e.target.value })}
                  required
                  placeholder="25.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Invite Friends</Label>
                <div className="space-y-2 border rounded-md p-3 max-h-48 overflow-y-auto">
                  {friends.length === 0 ? (
                    <p className="text-sm text-gray-500">No friends to invite. Add friends first!</p>
                  ) : (
                    friends.map((friend) => (
                      <div key={friend.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={friend.id}
                          checked={formData.invitedUserIds.includes(friend.id)}
                          onCheckedChange={() => toggleFriendSelection(friend.id)}
                        />
                        <label
                          htmlFor={friend.id}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {friend.name}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={friends.length === 0 || formData.invitedUserIds.length === 0}>
                Create Challenge
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {challenges.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500">No challenges yet. Create one to challenge your friends!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {challenges.map((challenge) => {
            const isInvited = isUserInvited(challenge);
            const completedToday = isChallengeCompletedToday(challenge);
            const userParticipant = getUserParticipant(challenge);
            const acceptedParticipants = challenge.participants?.filter((p: any) => p.status === 'accepted') || [];

            return (
              <Card key={challenge.id} className={isInvited ? 'border-indigo-300 bg-indigo-50' : ''}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {challenge.title}
                        {completedToday && userParticipant && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">{challenge.description}</CardDescription>
                    </div>
                    <Badge variant={challenge.period === 'daily' ? 'default' : challenge.period === 'weekly' ? 'secondary' : 'outline'}>
                      {challenge.period}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{acceptedParticipants.length} participant(s)</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Penalty: ${challenge.penaltyAmount}
                    </div>
                    {userParticipant && (
                      <div className="text-sm text-gray-600">
                        You completed: {userParticipant.completedDates?.length || 0} times
                      </div>
                    )}
                    {isInvited ? (
                      <Button
                        onClick={() => handleAcceptChallenge(challenge.id)}
                        className="w-full"
                      >
                        Accept Challenge
                      </Button>
                    ) : userParticipant ? (
                      <Button
                        onClick={() => handleCompleteChallenge(challenge.id)}
                        disabled={completedToday}
                        className="w-full"
                        variant={completedToday ? 'secondary' : 'default'}
                      >
                        {completedToday ? 'Completed Today' : 'Mark Complete'}
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}