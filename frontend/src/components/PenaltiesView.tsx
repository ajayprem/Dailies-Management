import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { TrendingUp, TrendingDown, IndianRupee, User } from "lucide-react";
import { Badge } from "./ui/badge";
import { API_ENDPOINTS, apiCall } from "../config/api";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

interface PenaltiesViewProps {
  accessToken: string;
  userId: number;
}

export function PenaltiesView({ accessToken, userId }: PenaltiesViewProps) {
  const [penalties, setPenalties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [owed, setOwed] = useState(0);
  const [receiving, setReceiving] = useState(0);
  const [owedList, setOwedList] = useState<any[]>([]);

  useEffect(() => {
    fetchPenalties();
  }, []);

  const handlePayPenalty = async (friendId: string) => {
    try {
      const response = await apiCall(API_ENDPOINTS.payPenalty(friendId), {
        method: "DELETE",
      });
      console.log("Penalty paid successfully:", response);
      fetchPenalties();
      // Optionally, refresh the penalties list or update the UI accordingly
    } catch (error) {
      console.error("Error paying penalty:", error);
    }
  };

  const fetchPenalties = async () => {
    try {
      const data = await apiCall(API_ENDPOINTS.getPenalties);
      setPenalties(data.penaltySummary.penalties || []);
      setOwed(data.penaltySummary.totalOwed || 0);
      setReceiving(data.penaltySummary.totalReceived || 0);
      setOwedList(data.penaltySummary.owedList || []);
      console.log("Fetched penalties:", owedList);
    } catch (error) {
      console.error("Error fetching penalties:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading penalties...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2>Penalties</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track penalties from incomplete tasks and challenges
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <TrendingDown className="w-5 h-5" />
              You Owe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">₹{owed.toFixed(2)}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              From incomplete tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <TrendingUp className="w-5 h-5" />
              You Receive
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">₹{receiving.toFixed(2)}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              From friends' penalties
            </p>
          </CardContent>
        </Card>
      </div>

      {owedList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
            <CardDescription>
              Search for users by email/username
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 ">
              {owedList.map((friend) => (
                <div
                  key={friend.id}
                  className="p-4 bg-gray-50 flex items-center justify-between rounded-lg dark:text-gray-400 dark:bg-gray-800"
                >
                  <div>
                    <p>{friend.name}</p>
                    <p className="text-sm text-gray-600">{friend.email}</p>
                  </div>
                  <Button onClick={() => handlePayPenalty(friend.id)}>
                    Pay {friend.name} {friend.amount}{" "}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Penalties List */}
      <Card>
        <CardHeader>
          <CardTitle>All Penalties</CardTitle>
          <CardDescription>
            {penalties.length === 0
              ? "No penalties recorded yet"
              : `${penalties.length} penalty record(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {penalties.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <IndianRupee className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No penalties yet. Keep completing your tasks!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {penalties.map((penalty) => {
                const isOwed = penalty.fromUserId === userId;
                const otherUser = isOwed ? penalty.toUser : penalty.fromUser;
                return (
                  <div
                    key={penalty.id}
                    className={`p-4 rounded-lg border ${
                      isOwed
                        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                        : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant={isOwed ? "destructive" : "default"}>
                            {isOwed ? "You Owe" : "You Receive"}
                          </Badge>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {penalty.type === "task"
                              ? "Task Penalty"
                              : "Challenge Penalty"}
                          </span>
                        </div>
                        {otherUser && (
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-sm font-medium">
                              {isOwed ? "To: " : "From: "}
                              <span
                                className={
                                  isOwed
                                    ? "text-red-700 dark:text-red-300"
                                    : "text-green-700 dark:text-green-300"
                                }
                              >
                                {otherUser}
                              </span>
                            </span>
                          </div>
                        )}
                        <p className="text-sm">{penalty.reason}</p>
                      </div>
                      <div
                        className={`text-xl ${isOwed ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
                      >
                        ₹{penalty.amount.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(penalty.periodKey).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
