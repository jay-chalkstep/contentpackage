'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Users, Loader2, AlertCircle } from 'lucide-react';
import AddStageReviewerModal from './AddStageReviewerModal';
import type { Workflow, WorkflowStageColor, ProjectStageReviewer } from '@/lib/supabase';

interface ProjectStageReviewersProps {
  projectId: string;
  projectName: string;
  workflow: Workflow;
  onUpdate?: () => void;
}

interface StageWithReviewers {
  stage_order: number;
  reviewers: ProjectStageReviewer[];
}

const stageColorClasses = {
  yellow: { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  green: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-800', dot: 'bg-green-500' },
  blue: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800', dot: 'bg-blue-500' },
  purple: { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-800', dot: 'bg-purple-500' },
  orange: { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-800', dot: 'bg-orange-500' },
  red: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-800', dot: 'bg-red-500' },
  gray: { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-800', dot: 'bg-gray-500' }
};

export default function ProjectStageReviewers({
  projectId,
  projectName,
  workflow,
  onUpdate
}: ProjectStageReviewersProps) {
  const [stageReviewers, setStageReviewers] = useState<StageWithReviewers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState<typeof workflow.stages[0] | null>(null);
  const [deletingReviewerId, setDeletingReviewerId] = useState<string | null>(null);

  useEffect(() => {
    fetchStageReviewers();
  }, [projectId]);

  const fetchStageReviewers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/reviewers`);
      if (!response.ok) throw new Error('Failed to fetch reviewers');
      const data = await response.json();
      setStageReviewers(data.reviewers || []);
    } catch (error) {
      console.error('Error fetching stage reviewers:', error);
      setError('Failed to load reviewers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddReviewer = (stage: typeof workflow.stages[0]) => {
    setSelectedStage(stage);
    setShowAddModal(true);
  };

  const handleRemoveReviewer = async (reviewerId: string) => {
    if (!confirm('Remove this reviewer from the stage?')) return;

    setDeletingReviewerId(reviewerId);
    try {
      const response = await fetch(`/api/projects/${projectId}/reviewers?reviewer_id=${reviewerId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove reviewer');
      }

      await fetchStageReviewers();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error removing reviewer:', error);
      alert(error instanceof Error ? error.message : 'Failed to remove reviewer');
    } finally {
      setDeletingReviewerId(null);
    }
  };

  const handleModalSuccess = async () => {
    await fetchStageReviewers();
    if (onUpdate) onUpdate();
  };

  const getReviewersForStage = (stageOrder: number): ProjectStageReviewer[] => {
    const stageData = stageReviewers.find(s => s.stage_order === stageOrder);
    return stageData?.reviewers || [];
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading reviewers...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-gray-700" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Stage Reviewers</h3>
              <p className="text-sm text-gray-600 mt-0.5">
                Assign team members to review mockups at each workflow stage
              </p>
            </div>
          </div>
        </div>

        {/* Stages Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflow.stages.map((stage) => {
              const reviewers = getReviewersForStage(stage.order);
              const colorClasses = stageColorClasses[stage.color as WorkflowStageColor] || stageColorClasses.gray;

              return (
                <div
                  key={stage.order}
                  className={`border ${colorClasses.border} rounded-lg overflow-hidden`}
                >
                  {/* Stage Header */}
                  <div className={`${colorClasses.bg} px-4 py-3 border-b ${colorClasses.border}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${colorClasses.dot}`} />
                      <h4 className={`font-medium ${colorClasses.text}`}>
                        Stage {stage.order}: {stage.name}
                      </h4>
                    </div>
                  </div>

                  {/* Reviewers List */}
                  <div className="p-4 space-y-2 min-h-[120px]">
                    {reviewers.length === 0 ? (
                      <div className="text-center py-4">
                        <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No reviewers assigned</p>
                      </div>
                    ) : (
                      reviewers.map((reviewer) => (
                        <div
                          key={reviewer.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {reviewer.user_image_url ? (
                              <img
                                src={reviewer.user_image_url}
                                alt={reviewer.user_name}
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                                {reviewer.user_name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="text-sm font-medium text-gray-900">
                              {reviewer.user_name}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveReviewer(reviewer.id)}
                            disabled={deletingReviewerId === reviewer.id}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                            title="Remove reviewer"
                          >
                            {deletingReviewerId === reviewer.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      ))
                    )}

                    {/* Add Reviewer Button */}
                    <button
                      onClick={() => handleAddReviewer(stage)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors text-sm font-medium"
                    >
                      <UserPlus className="h-4 w-4" />
                      Add Reviewer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Reviewer Modal */}
      {showAddModal && selectedStage && (
        <AddStageReviewerModal
          projectId={projectId}
          projectName={projectName}
          stage={selectedStage}
          onClose={() => {
            setShowAddModal(false);
            setSelectedStage(null);
          }}
          onSuccess={handleModalSuccess}
        />
      )}
    </>
  );
}
