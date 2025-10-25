'use client';

import { useState, useEffect } from 'react';
import { X, UserPlus, Loader2 } from 'lucide-react';
import type { WorkflowStage, WorkflowStageColor } from '@/lib/supabase';

interface OrganizationMember {
  id: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
  emailAddresses: { emailAddress: string }[];
}

interface AddStageReviewerModalProps {
  projectId: string;
  projectName: string;
  stage: WorkflowStage;
  onClose: () => void;
  onSuccess: () => void;
}

const stageColorClasses = {
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
  gray: 'bg-gray-500'
};

export default function AddStageReviewerModal({
  projectId,
  projectName,
  stage,
  onClose,
  onSuccess
}: AddStageReviewerModalProps) {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganizationMembers();
  }, []);

  const fetchOrganizationMembers = async () => {
    try {
      const response = await fetch('/api/org/members');
      if (!response.ok) throw new Error('Failed to fetch organization members');
      const { members: fetchedMembers } = await response.json();
      setMembers(fetchedMembers || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      setError('Failed to load organization members');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setSubmitting(true);
    setError(null);

    try {
      const selectedMember = members.find(m => m.id === selectedUserId);
      if (!selectedMember) throw new Error('Selected member not found');

      const response = await fetch(`/api/projects/${projectId}/reviewers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage_order: stage.order,
          user_id: selectedMember.id,
          user_name: `${selectedMember.firstName} ${selectedMember.lastName}`.trim() || 'Unknown User',
          user_image_url: selectedMember.imageUrl || undefined
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add reviewer');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding reviewer:', error);
      setError(error instanceof Error ? error.message : 'Failed to add reviewer');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedMember = members.find(m => m.id === selectedUserId);

  const stageColorClass = stageColorClasses[stage.color as WorkflowStageColor] || stageColorClasses.gray;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <UserPlus className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Add Reviewer</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Project Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Project</div>
            <div className="font-medium text-gray-900">{projectName}</div>
          </div>

          {/* Stage Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-2">Stage</div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${stageColorClass}`} />
              <span className="font-medium text-gray-900">
                Stage {stage.order}: {stage.name}
              </span>
            </div>
          </div>

          {/* Member Selection */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Reviewer
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Choose a team member...</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {`${member.firstName} ${member.lastName}`.trim() || member.emailAddresses[0]?.emailAddress || 'Unknown User'}
                  </option>
                ))}
              </select>

              {/* Selected Member Preview */}
              {selectedMember && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                  {selectedMember.imageUrl ? (
                    <img
                      src={selectedMember.imageUrl}
                      alt={`${selectedMember.firstName} ${selectedMember.lastName}`}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                      {selectedMember.firstName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-gray-900">
                      {`${selectedMember.firstName} ${selectedMember.lastName}`.trim() || 'Unknown User'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedMember.emailAddresses[0]?.emailAddress}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedUserId || submitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Add Reviewer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
