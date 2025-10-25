'use client';

import { useState, useEffect } from 'react';
import { Sparkles, CheckCircle, XCircle, Clock, Image, Tag, Folder, Search, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Badge from '@/components/ui/Badge';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

interface AIActivity {
  id: string;
  type: 'analysis' | 'search' | 'suggestion' | 'tagging';
  status: 'processing' | 'completed' | 'failed';
  mockupId?: string;
  mockupName?: string;
  mockupImageUrl?: string;
  message: string;
  details?: string;
  timestamp: Date;
  duration?: number; // milliseconds
}

interface AIActivityFeedProps {
  organizationId?: string;
  limit?: number;
  showFilters?: boolean;
  onActivityClick?: (activity: AIActivity) => void;
  className?: string;
}

export default function AIActivityFeed({
  organizationId,
  limit = 20,
  showFilters = true,
  onActivityClick,
  className = '',
}: AIActivityFeedProps) {
  const [activities, setActivities] = useState<AIActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'processing' | 'completed' | 'failed'>('all');

  useEffect(() => {
    fetchActivities();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchActivities, 5000);
    return () => clearInterval(interval);
  }, [organizationId, limit]);

  const fetchActivities = async () => {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(organizationId && { organizationId }),
      });

      const response = await fetch(`/api/ai/activity?${params}`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Failed to fetch AI activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: AIActivity['type']) => {
    switch (type) {
      case 'analysis':
        return Image;
      case 'search':
        return Search;
      case 'suggestion':
        return Folder;
      case 'tagging':
        return Tag;
      default:
        return Sparkles;
    }
  };

  const getStatusIcon = (status: AIActivity['status']) => {
    switch (status) {
      case 'processing':
        return Clock;
      case 'completed':
        return CheckCircle;
      case 'failed':
        return XCircle;
    }
  };

  const getStatusColor = (status: AIActivity['status']) => {
    switch (status) {
      case 'processing':
        return 'text-blue-600';
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
    }
  };

  const getStatusBadgeVariant = (status: AIActivity['status']) => {
    switch (status) {
      case 'processing':
        return 'info' as const;
      case 'completed':
        return 'success' as const;
      case 'failed':
        return 'error' as const;
    }
  };

  const filteredActivities = activities.filter(
    (activity) => filter === 'all' || activity.status === filter
  );

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <LoadingSkeleton shape="card" count={5} showSparkle />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Activity</h3>
          {activities.length > 0 && (
            <Badge variant="ai" size="sm">
              {activities.length}
            </Badge>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                filter === 'all'
                  ? 'bg-purple-100 text-purple-700 border border-purple-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('processing')}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                filter === 'processing'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Processing
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                filter === 'completed'
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                filter === 'failed'
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Failed
            </button>
          </div>
        )}
      </div>

      {/* Activity List */}
      {filteredActivities.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-900 mb-1">No activity yet</p>
          <p className="text-xs text-gray-600">
            {filter === 'all'
              ? 'AI activity will appear here as you use AI features'
              : `No ${filter} activities found`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredActivities.map((activity) => {
            const ActivityIcon = getActivityIcon(activity.type);
            const StatusIcon = getStatusIcon(activity.status);
            const statusColor = getStatusColor(activity.status);

            return (
              <div
                key={activity.id}
                onClick={() => onActivityClick?.(activity)}
                className={`bg-white border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors ${
                  onActivityClick ? 'cursor-pointer' : ''
                }`}
              >
                <div className="flex gap-3">
                  {/* Mockup Thumbnail */}
                  {activity.mockupImageUrl && (
                    <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={activity.mockupImageUrl}
                        alt={activity.mockupName || 'Mockup'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <ActivityIcon className="h-4 w-4 text-purple-600 flex-shrink-0" />
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.message}
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(activity.status)} size="sm">
                        <StatusIcon
                          className={`h-3 w-3 mr-1 ${
                            activity.status === 'processing' ? 'animate-spin' : ''
                          }`}
                        />
                        {activity.status}
                      </Badge>
                    </div>

                    {/* Details */}
                    {activity.details && (
                      <p className="text-xs text-gray-600 mb-2">{activity.details}</p>
                    )}

                    {/* Mockup Name */}
                    {activity.mockupName && (
                      <p className="text-xs text-gray-500 mb-2 truncate">
                        {activity.mockupName}
                      </p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </span>
                      {activity.duration && activity.status === 'completed' && (
                        <span>
                          • {(activity.duration / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats Summary */}
      {activities.length > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {activities.filter((a) => a.status === 'completed').length}
              </p>
              <p className="text-xs text-gray-600">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {activities.filter((a) => a.status === 'processing').length}
              </p>
              <p className="text-xs text-gray-600">Processing</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {activities.filter((a) => a.status === 'failed').length}
              </p>
              <p className="text-xs text-gray-600">Failed</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
