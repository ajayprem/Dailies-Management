import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Calendar, CheckCircle, Circle, AlertCircle, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_ENDPOINTS, apiCall } from '../config/api';
import { toast } from 'sonner';

interface DailyChallengesViewProps {
  challenges: any[];
  userId: number;
  onChallengeUpdate: () => void;
}

export function DailyChallengesView({ challenges, userId, onChallengeUpdate }: DailyChallengesViewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [challengesForDay, setChallengesForDay] = useState<any[]>([]);

  useEffect(() => {
    filterChallengesForDate(selectedDate);
  }, [selectedDate, challenges]);

  const filterChallengesForDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayOfMonth = date.getDate();

    const filtered = challenges.filter((challenge) => {
      // Only show accepted challenges
      if (challenge.status !== 'active') return false;

      // Check if user has accepted the challenge
      const userParticipant = challenge.participants?.find((p: any) => p.userId === userId);
      if (!userParticipant || userParticipant.status !== 'accepted') return false;

      // Check if date is within challenge's date range
      if (challenge.startDate) {
        const startDate = new Date(challenge.startDate);
        if (date < startDate) return false;
      }

      if (challenge.endDate) {
        const endDate = new Date(challenge.endDate);
        if (date > endDate) return false;
      }

      // Filter by period
      if (challenge.period === 'daily') {
        return true;
      } else if (challenge.period === 'weekly') {
        // For weekly challenges, show on the same day of week as creation
        const createdDate = new Date(challenge.createdAt || challenge.startDate);
        const createdDayOfWeek = createdDate.getDay();
        return dayOfWeek === createdDayOfWeek;
      } else if (challenge.period === 'monthly') {
        // For monthly challenges, show on the same day of month as creation
        const createdDate = new Date(challenge.createdAt || challenge.startDate);
        const createdDayOfMonth = createdDate.getDate();
        return dayOfMonth === createdDayOfMonth;
      }

      return false;
    });

    setChallengesForDay(filtered);
  };

  const isChallengeCompletedOnDate = (challenge: any, dateStr: string) => {
    const userParticipant = challenge.participants?.find((p: any) => p.userId === userId);
    return userParticipant?.completedDates?.includes(dateStr) || false;
  };

  const getAcceptedParticipants = (challenge: any) => {
    return challenge.participants?.filter((p: any) => p.status === 'accepted') || [];
  };

  const getCompletionStatusForDate = (challenge: any, dateStr: string) => {
    const acceptedParticipants = getAcceptedParticipants(challenge);
    const completedCount = acceptedParticipants.filter((p: any) => 
      p.completedDates?.includes(dateStr)
    ).length;
    
    return {
      completed: completedCount,
      total: acceptedParticipants.length
    };
  };

  const handleToggleCompletion = async (challenge: any, dateStr: string) => {
    const isCompleted = isChallengeCompletedOnDate(challenge, dateStr);

    try {
      if (isCompleted) {
        // Uncomplete for this specific date
        await apiCall(API_ENDPOINTS.uncompleteChallenge(challenge.id), {
          method: 'POST',
          body: JSON.stringify({ date: dateStr }),
        });
        toast.success('Challenge unmarked for this date');
      } else {
        // Complete for this specific date
        await apiCall(API_ENDPOINTS.completeChallenge(challenge.id), {
          method: 'POST',
          body: JSON.stringify({ date: dateStr }),
        });
        toast.success('Challenge marked complete! 🎉');
      }
      onChallengeUpdate();
    } catch (error) {
      console.error('Error toggling challenge completion:', error);
      toast.error('Failed to update challenge');
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    const newDate = new Date(currentDate);
    
    if (direction === 'prev') {
      newDate.setDate(currentDate.getDate() - 1);
    } else {
      newDate.setDate(currentDate.getDate() + 1);
    }
    
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const isFuture = new Date(selectedDate) > new Date();
  const canGoForward = new Date(selectedDate) < new Date();

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {isToday ? "Today's Challenges" : new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </h3>
          <span className="text-sm text-gray-500">{challengesForDay.length} {challengesForDay.length === 1 ? 'challenge' : 'challenges'}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateDate('prev')}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="flex-1"
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

        {isFuture && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Cannot mark challenges for future dates. Please select today or a past date.
            </p>
          </div>
        )}

        {challengesForDay.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Circle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No challenges due on this date</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {challengesForDay.map((challenge) => {
              const isCompleted = isChallengeCompletedOnDate(challenge, selectedDate);
              const completionStatus = getCompletionStatusForDate(challenge, selectedDate);
              const acceptedParticipants = getAcceptedParticipants(challenge);

              return (
                <Card key={challenge.id} className={isCompleted ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : ''}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-medium ${isCompleted ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>
                              {challenge.title}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={challenge.period === 'daily' ? 'default' : challenge.period === 'weekly' ? 'secondary' : 'outline'}>
                              {challenge.period}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {challenge.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{challenge.description}</p>
                      )}

                      <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{acceptedParticipants.length} participants</span>
                        </div>
                        <div>
                          Completed on this date: {completionStatus.completed}/{completionStatus.total}
                        </div>
                        <div>Penalty: ₹{challenge.penaltyAmount}</div>
                      </div>

                      <Button
                        onClick={() => handleToggleCompletion(challenge, selectedDate)}
                        disabled={isFuture}
                        variant={isCompleted ? 'secondary' : 'default'}
                        className="w-full"
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Completed
                          </>
                        ) : (
                          <>
                            <Circle className="w-4 h-4 mr-2" />
                            Mark Complete
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
