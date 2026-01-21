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
  Calendar,
  Clock,
  X,
  XCircle,
  Award,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { API_ENDPOINTS, apiCall } from "../config/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { toast } from "sonner";
import { Alert, AlertDescription } from "./ui/alert";

interface ChallengesListProps {
  accessToken: string;
  userId: number;
}

export function ChallengesList({ accessToken, userId }: ChallengesListProps) {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [verificationTexts, setVerificationTexts] = useState<{
    [key: string]: string;
  }>({});
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
      toast.success("Challenge accepted!");
      fetchChallenges();
    } catch (error) {
      console.error("Error accepting challenge:", error);
      toast.error("Failed to accept challenge");
    }
  };

  const handleRejectChallenge = async (challengeId: string) => {
    try {
      await apiCall(API_ENDPOINTS.rejectChallenge(challengeId), {
        method: "POST",
      });
      toast.success("Challenge rejected");
      fetchChallenges();
    } catch (error) {
      console.error("Error rejecting challenge:", error);
      toast.error("Failed to reject challenge");
    }
  };

  const handleCompleteChallenge = async (challengeId: string) => {
    try {
      await apiCall(API_ENDPOINTS.completeChallenge(challengeId), {
        method: "POST",
        body: JSON.stringify({ date: new Date().toISOString().split("T")[0] }),
      });
      toast.success("Challenge completed! 🎉");
      fetchChallenges();
    } catch (error) {
      console.error("Error completing challenge:", error);
      toast.error("Failed to complete challenge");
    }
  };

  const handleCompleteChallengeForDate = async (
    challengeId: string,
    date: string
  ) => {
    const verificationText = verificationTexts[challengeId] || "";
    if (verificationText.toLowerCase().trim() !== "complete") {
      toast.error('Please type "complete" to confirm');
      return;
    }

    try {
      await apiCall(API_ENDPOINTS.completeChallenge(challengeId), {
        method: "POST",
        body: JSON.stringify({ date }),
      });
      toast.success(
        `Challenge completed for ${new Date(date).toLocaleDateString()}! 🎉`
      );
      setVerificationTexts((prev) => ({ ...prev, [challengeId]: "" }));
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
        body: JSON.stringify({ date: new Date().toISOString().split("T")[0] }),
      });
      toast.success("Challenge completion reset");
      fetchChallenges();
    } catch (error) {
      console.error("Error resetting challenge:", error);
      toast.error("Failed to reset challenge");
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
    const today = new Date().toISOString().split("T")[0];
    const userParticipant = getUserParticipant(challenge);
    return userParticipant?.completedDates?.includes(today);
  };

  const challengeRejectedParticipant = (challenge: any) => {
    return challenge.participants?.find((p: any) => p.status === "rejected");
  };

  const isUserInvited = (challenge: any) => {
    if (challenge.status !== "pending") return false; // invited challenges are still in pending state
    return (
      challenge.creatorId != userId &&
      !challenge.participants?.some((p: any) => p.userId === userId)
    );
  };

  const isPendingChallenge = (challenge: any) => {
    return challenge.status === "pending";
  };

  const getActiveAcceptedChallenges = () => {
    return challenges.filter((challenge) => {
      return challenge.status === "active";
    });
  };

  const getPendingChallenges = () => {
    return challenges.filter((challenge) => {
      return isPendingChallenge(challenge) && !isUserInvited(challenge);
    });
  };

  const getInvitedChallenges = () => {
    return challenges.filter((challenge) => isUserInvited(challenge));
  };

  const getRejectedChallenges = () => {
    return challenges.filter((challenge) => {
      return challenge.status === "rejected";
    });
  };

  const getCompletedChallenges = () => {
    return challenges.filter((challenge) => {
      const userParticipant = getUserParticipant(challenge);
      if (!userParticipant) return false;

      // Check if challenge has ended
      if (challenge.endDate) {
        const endDate = new Date(challenge.endDate);
        const today = new Date();
        return endDate < today;
      }

      // Or if challenge status is completed/failed
      return challenge.status === "completed" || challenge.status === "failed";
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading challenges...</div>;
  }

  const activeChallenges = getActiveAcceptedChallenges();
  const pendingChallenges = getPendingChallenges();
  const invitedChallenges = getInvitedChallenges();
  const rejectedChallenges = getRejectedChallenges();
  const completedChallenges = getCompletedChallenges();

  const renderChallengeCard = (challenge: any) => {
    const isInvited = isUserInvited(challenge);
    const isPending = isPendingChallenge(challenge);
    const completedToday = isChallengeCompletedToday(challenge);
    const userParticipant = getUserParticipant(challenge);
    const acceptedParticipants =
      challenge.participants?.filter((p: any) => p.status === "accepted") || [];
    const totalInvited = (challenge.invitedUserIds?.length || 0) + 1;
    const rejectedParticipant = challengeRejectedParticipant(challenge);
    const isCompleted =
      challenge.status === "completed" ||
      challenge.status === "failed" ||
      (challenge.endDate && new Date(challenge.endDate) < new Date());

    const lastUncompletedDate = userParticipant?.lastUncompletedDate;
    const verificationText = verificationTexts[challenge.id] || "";
    const isVerificationValid =
      verificationText.toLowerCase().trim() === "complete";

    const participants = challenge.participants?.map((p: any) => p.name);

    // Build participant status list for pending challenges
    const getParticipantStatusList = () => {
      if (!isPending || isInvited) return null;

      const allParticipantIds = new Set<number>();
      const participantStatuses = new Map<
        number,
        { name: string; email: string; status: string; isCurrentUser: boolean }
      >();

      // Add all invited users
      challenge.invitedUserIds?.forEach((invitedId: number) => {
        allParticipantIds.add(invitedId);
      });

      // Add current user (creator or participant)
      allParticipantIds.add(userId);

      // Map participant IDs to their status
      challenge.participants?.forEach((participant: any) => {
        const friend = friends.find((f) => f.id === participant.userId);
        const isCurrentUser = participant.userId === userId;

        participantStatuses.set(participant.userId, {
          name: isCurrentUser
            ? "You"
            : friend?.name || friend?.email || "Unknown User",
          email: friend?.email || "",
          status: participant.status,
          isCurrentUser,
        });
      });

      // Add invited users who haven't responded yet
      allParticipantIds.forEach((participantId) => {
        if (!participantStatuses.has(participantId)) {
          const friend = friends.find((f) => f.id === participantId);
          console.log(friends, participantId, friend);
          const isCurrentUser = participantId === userId;

          participantStatuses.set(participantId, {
            name: isCurrentUser
              ? "You"
              : friend?.name || friend?.email || "Unknown User",
            email: friend?.email || "",
            status: "pending",
            isCurrentUser,
          });
        }
      });

      return Array.from(participantStatuses.values());
    };

    const participantStatusList = getParticipantStatusList();

    return (
      <Card
        key={challenge.id}
        className={
          rejectedParticipant || lastUncompletedDate
            ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20"
            : isInvited
            ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20"
            : isPending
            ? "border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20"
            : isCompleted
            ? "border-gray-300 dark:border-gray-700 bg-green-700 dark:bg-green-100/20"
            : ""
        }
      >
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                {challenge.title}
                {completedToday && userParticipant && !isCompleted && (
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                )}
                {isPending && !isInvited && (
                  <Badge
                    variant="outline"
                    className="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                )}
                {rejectedParticipant && (
                  <Badge
                    variant="outline"
                    className="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700"
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Rejected
                  </Badge>
                )}
                {isCompleted && (
                  <Badge
                    variant="outline"
                    className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700"
                  >
                    {challenge.status === "completed" ? (
                      <Award className="w-3 h-3 mr-1" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 mr-1" />
                    )}
                    {challenge.status === "completed"
                      ? "Completed"
                      : challenge.status === "failed"
                      ? "Failed"
                      : "Ended"}
                  </Badge>
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
              <span>
                {acceptedParticipants.length} / {totalInvited} accepted
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Participants: {participants?.join(", ")}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Penalty: ₹{challenge.penaltyAmount}
            </div>
            {userParticipant && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                You completed: {userParticipant.completedDates?.length || 0}{" "}
                times
              </div>
            )}
            {(challenge.startDate || challenge.endDate) && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {challenge.startDate && (
                  <div>
                    Starts: {new Date(challenge.startDate).toLocaleDateString()}
                  </div>
                )}
                {challenge.endDate && (
                  <div>
                    Ends: {new Date(challenge.endDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}
            {isInvited && !rejectedParticipant ? (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleAcceptChallenge(challenge.id)}
                  className="w-full"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Accept
                </Button>
                <Button
                  onClick={() => handleRejectChallenge(challenge.id)}
                  variant="outline"
                  className="w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <X className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </div>
            ) : isPending && !rejectedParticipant ? (
              <>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md space-y-3">
                  <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Waiting for all participants to accept...
                  </div>
                  {participantStatusList &&
                    participantStatusList.length > 0 && (
                      <div className="space-y-2">
                        {participantStatusList.map((participant, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between text-sm"
                          >
                            <span
                              className={
                                participant.isCurrentUser
                                  ? "font-medium text-yellow-900 dark:text-yellow-100"
                                  : "text-yellow-700 dark:text-yellow-300"
                              }
                            >
                              {participant.name}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {participant.status === "accepted" ? (
                                <>
                                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                  <span className="text-green-700 dark:text-green-300 font-medium">
                                    Accepted
                                  </span>
                                </>
                              ) : participant.status === "rejected" ? (
                                <>
                                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                                  <span className="text-red-700 dark:text-red-300 font-medium">
                                    Rejected
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                  <span className="text-yellow-700 dark:text-yellow-300 font-medium">
                                    Pending
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </>
            ) : rejectedParticipant ? (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md text-sm text-red-800 dark:text-red-200">
                {userParticipant?.userId === rejectedParticipant?.userId
                  ? "You"
                  : rejectedParticipant?.name}{" "}
                declined this challenge invitation.
              </div>
            ) : userParticipant ? (
              lastUncompletedDate ? (
                <>
                  <AlertDescription className="text-orange-800 dark:text-orange-200">
                    <span className="inline-flex items-center gap-1 whitespace-nowrap">
                      <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      <span className="font-medium">Catch up required:</span>{" "}
                      You need to complete this challenge for{" "}
                      <span className="font-semibold">
                        {formatDate(lastUncompletedDate)}
                      </span>{" "}
                      before you can mark today as complete.
                    </span>
                  </AlertDescription>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Completing for: {formatDate(lastUncompletedDate)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {/* <label className="text-sm text-gray-600 dark:text-gray-400">
                      Type "complete" to confirm:
                    </label> */}
                      <Textarea
                        value={verificationText}
                        onChange={(e) =>
                          setVerificationTexts((prev) => ({
                            ...prev,
                            [challenge.id]: e.target.value,
                          }))
                        }
                        placeholder="Type 'complete' here to confirm"
                        className="h-12 resize-none"
                      />
                    </div>
                    <Button
                      onClick={() =>
                        handleCompleteChallengeForDate(
                          challenge.id,
                          lastUncompletedDate
                        )
                      }
                      disabled={!isVerificationValid}
                      className="w-full"
                      variant={isVerificationValid ? "default" : "secondary"}
                    >
                      Complete Challenge
                    </Button>
                  </div>
                </>
              ) : !isCompleted && (
                <>
                  <div className="grid grid-cols-2 gap-2 ">
                    <Button
                      onClick={() => handleCompleteChallenge(challenge.id)}
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
                </>
              ) 
            ) : null}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2>Challenges</h2>
          <p className="text-gray-600 mt-1">
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
                  onValueChange={(value) =>
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
                <Label htmlFor="penalty">Penalty Amount (₹)</Label>
                <Input
                  id="penalty"
                  type="number"
                  step="0.01"
                  value={formData.penaltyAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, penaltyAmount: e.target.value })
                  }
                  required
                  placeholder="250.00"
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

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="w-full inline-flex h-auto flex-wrap gap-2 bg-transparent p-0">
          <TabsTrigger value="active" className="flex-1 min-w-[100px]">
            Active ({activeChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex-1 min-w-[100px]">
            Requests ({invitedChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex-1 min-w-[100px]">
            Pending ({pendingChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex-1 min-w-[100px]">
            Rejected ({rejectedChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1 min-w-[100px]">
            Completed ({completedChallenges.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {activeChallenges.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500">
                  No active challenges. Create one or accept pending
                  invitations!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {activeChallenges.map(renderChallengeCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="mt-4">
          <div className="space-y-4">
            {invitedChallenges.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">Invitations</h3>
                <div className="grid gap-4">
                  {invitedChallenges.map(renderChallengeCard)}
                </div>
              </div>
            )}

            {invitedChallenges.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500">No pending challenges!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <div className="space-y-4">
            {pendingChallenges.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">Waiting for Others</h3>
                <div className="grid gap-4">
                  {pendingChallenges.map(renderChallengeCard)}
                </div>
              </div>
            )}

            {pendingChallenges.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500">No pending challenges!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="rejected" className="mt-4">
          <div className="space-y-4">
            {rejectedChallenges.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">
                  Rejected Challenges
                </h3>
                <div className="grid gap-4">
                  {rejectedChallenges.map(renderChallengeCard)}
                </div>
              </div>
            )}

            {rejectedChallenges.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500">No rejected challenges!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <div className="space-y-4">
            {completedChallenges.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">
                  Completed Challenges
                </h3>
                <div className="grid gap-4">
                  {completedChallenges.map(renderChallengeCard)}
                </div>
              </div>
            )}

            {completedChallenges.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500">No completed challenges!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
