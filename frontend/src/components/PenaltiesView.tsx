import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from './ui/badge';
import { API_ENDPOINTS, apiCall } from '../config/api';

interface PenaltiesViewProps {
  accessToken: string;
  userId: string;
}

export function PenaltiesView({ accessToken, userId }: PenaltiesViewProps) {
  const [penalties, setPenalties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPenalties();
  }, []);

  const fetchPenalties = async () => {
    try {
      const data = await apiCall(API_ENDPOINTS.getPenalties);
      setPenalties(data.penalties || []);
    } catch (error) {
      console.error('Error fetching penalties:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const owed = penalties
      .filter((p) => p.fromUserId === userId)
      .reduce((sum, p) => sum + p.amount, 0);

    const receiving = penalties
      .filter((p) => p.toUserId === userId)
      .reduce((sum, p) => sum + p.amount, 0);

    return { owed, receiving };
  };

  if (loading) {
    return <div className="text-center py-8">Loading penalties...</div>;
  }

  const { owed, receiving } = calculateTotals();

  return (
    <div className="space-y-6">
      <div>
        <h2>Penalties</h2>
        <p className="text-gray-600 mt-1">Track penalties from incomplete tasks and challenges</p>
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
            <div className="text-3xl">${owed.toFixed(2)}</div>
            <p className="text-sm text-gray-600 mt-1">From incomplete tasks</p>
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
            <div className="text-3xl">${receiving.toFixed(2)}</div>
            <p className="text-sm text-gray-600 mt-1">From friends' penalties</p>
          </CardContent>
        </Card>
      </div>

      {/* Penalties List */}
      <Card>
        <CardHeader>
          <CardTitle>All Penalties</CardTitle>
          <CardDescription>
            {penalties.length === 0 ? 'No penalties recorded yet' : `${penalties.length} penalty record(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {penalties.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No penalties yet. Keep completing your tasks!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {penalties.map((penalty) => {
                const isOwed = penalty.fromUserId === userId;
                return (
                  <div
                    key={penalty.id}
                    className={`p-4 rounded-lg border ${
                      isOwed ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={isOwed ? 'destructive' : 'default'}>
                            {isOwed ? 'You Owe' : 'You Receive'}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {penalty.type === 'task' ? 'Task Penalty' : 'Challenge Penalty'}
                          </span>
                        </div>
                        <p className="text-sm">{penalty.reason}</p>
                      </div>
                      <div className={`text-xl ${isOwed ? 'text-red-600' : 'text-green-600'}`}>
                        ${penalty.amount.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(penalty.createdAt).toLocaleDateString()}
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