'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { MessageSquare, CheckCircle, Clock, XCircle } from 'lucide-react';

interface ReviewRequest {
  id: string;
  mockup_id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_email: string;
  status: 'pending' | 'viewed' | 'approved' | 'changes_requested';
  invited_by: string;
  invitation_message: string | null;
  invited_at: string;
  viewed_at: string | null;
  responded_at: string | null;
  mockup: {
    id: string;
    mockup_name: string;
    mockup_image_url: string;
    created_by: string;
    folder_name: string;
  };
}

export default function ReviewsPage() {
  const { userId, orgId } = useAuth();
  const [reviews, setReviews] = useState<ReviewRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    if (!userId || !orgId) return;

    fetchReviews();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`reviews-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mockup_reviewers',
          filter: `reviewer_id=eq.${userId}`,
        },
        () => {
          fetchReviews();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, orgId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('mockup_reviewers')
        .select(`
          *,
          mockup:card_mockups (
            id,
            mockup_name,
            mockup_image_url,
            created_by,
            folder_name
          )
        `)
        .eq('reviewer_id', userId)
        .eq('organization_id', orgId)
        .order('invited_at', { ascending: false });

      if (error) throw error;

      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = reviews.filter((review) => {
    if (filter === 'pending') {
      return review.status === 'pending' || review.status === 'viewed';
    }
    if (filter === 'completed') {
      return review.status === 'approved' || review.status === 'changes_requested';
    }
    return true;
  });

  const pendingCount = reviews.filter(
    (r) => r.status === 'pending' || r.status === 'viewed'
  ).length;

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
          <Clock size={12} />
          Pending
        </span>
      ),
      viewed: (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          <Clock size={12} />
          Viewed
        </span>
      ),
      approved: (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
          <CheckCircle size={12} />
          Approved
        </span>
      ),
      changes_requested: (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
          <XCircle size={12} />
          Changes Requested
        </span>
      ),
    };
    return badges[status as keyof typeof badges];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <MessageSquare size={32} />
                My Reviews
              </h1>
              <p className="text-gray-600 mt-2">
                Mockups awaiting your feedback
                {pendingCount > 0 && (
                  <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {pendingCount} pending
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All ({reviews.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Completed ({reviews.length - pendingCount})
            </button>
          </div>
        </div>

        {/* Reviews List */}
        {filteredReviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No reviews found
            </h3>
            <p className="text-gray-600">
              {filter === 'pending'
                ? "You don't have any pending review requests."
                : filter === 'completed'
                ? "You haven't completed any reviews yet."
                : "You haven't been invited to review any mockups yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <Link
                key={review.id}
                href={`/mockups/${review.mockup_id}`}
                className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
              >
                <div className="flex gap-6">
                  {/* Mockup Thumbnail */}
                  <div className="flex-shrink-0">
                    <div className="w-32 h-20 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={review.mockup.mockup_image_url}
                        alt={review.mockup.mockup_name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  {/* Review Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {review.mockup.mockup_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Folder: {review.mockup.folder_name || 'Uncategorized'}
                        </p>
                      </div>
                      {getStatusBadge(review.status)}
                    </div>

                    {review.invitation_message && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <p className="text-sm text-gray-700 italic">
                          "{review.invitation_message}"
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>
                        Invited: {new Date(review.invited_at).toLocaleDateString()}
                      </span>
                      {review.responded_at && (
                        <span>
                          Responded: {new Date(review.responded_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Arrow */}
                  <div className="flex-shrink-0 flex items-center">
                    <svg
                      className="w-6 h-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
