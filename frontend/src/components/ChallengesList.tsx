import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import {
  Plus,
  CheckCircle,
  Users,
  Target,
  BarChart3,
  RotateCcw,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { API_ENDPOINTS, apiCall } from "../config/api";
import { ChallengeStats } from "./ChallengeStats";
import { toast } from "sonner";

interface ChallengesListProps {
  accessToken: string;
  userId: string;
}

export function ChallengesList({ accessToken, userId }: ChallengesListProps) {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    period: "daily",
    penaltyAmount: "",
    invitedUserIds: [] as string[],
    startDate: new Date().toISOString().split("T")[0], // Default to today
    endDate: "", // Optional
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
      console.error("Error fetching challenges:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const data = await apiCall(API_ENDPOINTS.getFriends);
      setFriends(data.friends || []);
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiCall(API_ENDPOINTS.createChallenge, {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          penaltyAmount: parseFloat(formData.penaltyAmount),
        }),
      });

      setDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        period: "daily",
        penaltyAmount: "",
        invitedUserIds: [],
        startDate: new Date().toISOString().split("T")[0], // Default to today
        endDate: "", // Optional
      });
      fetchChallenges();
    } catch (error) {
      console.error("Error creating challenge:", error);
    }
  };

  const handleAcceptChallenge = async (challengeId: string) => {
    try {
      await apiCall(API_ENDPOINTS.acceptChallenge(challengeId), {
        method: "POST",
      });
      fetchChallenges();
    } catch (error) {
      console.error("Error accepting challenge:", error);
    }
  };

  const handleCompleteChallenge = async (challengeId: string) => {
    try {
      await apiCall(API_ENDPOINTS.completeChallenge(challengeId), {
        method: "POST",
      });
      toast.success("Challenge completed! 🎉");
      fetchChallenges();
    } catch (error) {
      console.error("Error completing challenge:", error);
      toast.error("Failed to complete challenge");
    }
  };

  const handleResetChallenge = async (challengeId: string) => {
    try {
      await apiCall(API_ENDPOINTS.uncompleteChallenge(challengeId), {
        method: "POST",
      });
      toast.success("Challenge completion reset");
      fetchChallenges();
    } catch (error) {
      console.error("Error resetting challenge:", error);
      toast.error("Failed to reset challenge");
    }
  };

  const handleOpenStats = (challenge: any) => {
    setSelectedChallenge(challenge);
    setStatsDialogOpen(true);
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
    const today = new Date().toISOString().split("T")[0];
    const userParticipant = getUserParticipant(challenge);
    return userParticipant?.completedDates?.includes(today);
  };

  const isUserInvited = (challenge: any) => {
    return (
      challenge.invitedUsers?.includes(userId) &&
      !challenge.participants?.some((p: any) => p.userId === userId)
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading challenges...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2>Challenges</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and join challenges with friends
          </p>
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
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  placeholder="e.g., 30-Day Fitness Challenge"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe what participants need to do"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="period">Period</Label>
                <Select
                  value={formData.period}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, period: value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, penaltyAmount: e.target.value })
                  }
                  required
                  placeholder="25.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Invite Friends</Label>
                <div className="space-y-2 border rounded-md p-3 max-h-48 overflow-y-auto">
                  {friends.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No friends to invite. Add friends first!
                    </p>
                  ) : (
                    friends.map((friend) => (
                      <div
                        key={friend.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={friend.id}
                          checked={formData.invitedUserIds.includes(friend.id)}
                          onCheckedChange={() =>
                            toggleFriendSelection(friend.id)
                          }
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
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
                <p className="text-xs text-gray-500">
                  When should this challenge begin?
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  min={
                    formData.startDate
                      ? new Date(
                          new Date(formData.startDate).getTime() + 86400000
                        )
                          .toISOString()
                          .split("T")[0]
                      : new Date().toISOString().split("T")[0]
                  }
                />
                <p className="text-xs text-gray-500">
                  Leave blank for ongoing challenge
                </p>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={
                  friends.length === 0 || formData.invitedUserIds.length === 0
                }
              >
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
            <p className="text-gray-500">
              No challenges yet. Create one to challenge your friends!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {challenges.map((challenge) => {
            const isInvited = isUserInvited(challenge);
            const completedToday = isChallengeCompletedToday(challenge);
            const userParticipant = getUserParticipant(challenge);
            const acceptedParticipants =
              challenge.participants?.filter(
                (p: any) => p.status === "accepted"
              ) || [];

            return (
              <Card
                key={challenge.id}
                className={isInvited ? "border-indigo-300 bg-indigo-50" : ""}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {challenge.title}
                        {completedToday && userParticipant && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {challenge.description}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        challenge.period === "daily"
                          ? "default"
                          : challenge.period === "weekly"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {challenge.period}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>{acceptedParticipants.length} participant(s)</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Penalty: ${challenge.penaltyAmount}
                    </div>
                    {userParticipant && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        You completed:{" "}
                        {userParticipant.completedDates?.length || 0} times
                      </div>
                    )}
                    {(challenge.startDate || challenge.endDate) && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {challenge.startDate && (
                          <div>
                            Starts:{" "}
                            {new Date(challenge.startDate).toLocaleDateString()}
                          </div>
                        )}
                        {challenge.endDate && (
                          <div>
                            Ends:{" "}
                            {new Date(challenge.endDate).toLocaleDateString()}
                          </div>
                        )}
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
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={() =>
                              handleCompleteChallenge(challenge.id)
                            }
                            disabled={completedToday}
                            variant={completedToday ? "secondary" : "default"}
                          >
                            {completedToday ? "Completed" : "Complete"}
                          </Button>
                          <Button
                            onClick={() => handleResetChallenge(challenge.id)}
                            disabled={!completedToday}
                            variant="outline"
                          >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Reset
                          </Button>
                        </div>
                        <Button
                          onClick={() => handleOpenStats(challenge)}
                          variant="ghost"
                          className="w-full"
                        >
                          <BarChart3 className="w-4 h-4 mr-2" />
                          View Stats & Calendar
                        </Button>
                      </>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Challenge Stats Dialog */}
      {selectedChallenge && (
        <ChallengeStats
          challenge={selectedChallenge}
          userId={userId}
          open={statsDialogOpen}
          onOpenChange={setStatsDialogOpen}
        />
      )}
    </div>
  );
}
