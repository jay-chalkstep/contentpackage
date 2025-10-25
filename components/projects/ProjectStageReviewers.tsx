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
        {/* Compact Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900">Stage Reviewers</h3>
          </div>
          <p className="text-xs text-gray-500">Assign team members per stage</p>
        </div>

        {/* Horizontal Scrollable Stages */}
        <div className="p-3">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {workflow.stages.map((stage) => {
              const reviewers = getReviewersForStage(stage.order);
              const colorClasses = stageColorClasses[stage.color as WorkflowStageColor] || stageColorClasses.gray;

              return (
                <div
                  key={stage.order}
                  className={`flex-shrink-0 w-56 border ${colorClasses.border} rounded-lg overflow-hidden`}
                >
                  {/* Compact Stage Header */}
                  <div className={`${colorClasses.bg} px-3 py-2 border-b ${colorClasses.border}`}>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${colorClasses.dot}`} />
                      <h4 className={`text-xs font-semibold ${colorClasses.text} truncate`}>
                        Stage {stage.order}: {stage.name}
                      </h4>
                    </div>
                  </div>

                  {/* Compact Reviewers Display */}
                  <div className="p-3 space-y-2">
                    {reviewers.length === 0 ? (
                      <div className="text-center py-3">
                        <Users className="h-6 w-6 text-gray-300 mx-auto mb-1" />
                        <p className="text-xs text-gray-500">No reviewers</p>
                      </div>
                    ) : (
                      <>
                        {/* Avatar Stack (max 3 visible) */}
                        <div className="flex items-center gap-1">
                          <div className="flex -space-x-2">
                            {reviewers.slice(0, 3).map((reviewer) => (
                              <div key={reviewer.id} className="relative group">
                                {reviewer.user_image_url ? (
                                  <img
                                    src={reviewer.user_image_url}
                                    alt={reviewer.user_name}
                                    className="w-7 h-7 rounded-full border-2 border-white"
                                    title={reviewer.user_name}
                                  />
                                ) : (
                                  <div
                                    className="w-7 h-7 rounded-full border-2 border-white bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
                                    title={reviewer.user_name}
                                  >
                                    {reviewer.user_name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          {reviewers.length > 3 && (
                            <span className="text-xs text-gray-500 ml-1">
                              +{reviewers.length - 3}
                            </span>
                          )}
                        </div>

                        {/* Reviewer List (expandable) */}
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {reviewers.map((reviewer) => (
                            <div
                              key={reviewer.id}
                              className="flex items-center justify-between p-1.5 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                {reviewer.user_image_url ? (
                                  <img
                                    src={reviewer.user_image_url}
                                    alt={reviewer.user_name}
                                    className="w-5 h-5 rounded-full flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs flex-shrink-0">
                                    {reviewer.user_name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="text-xs font-medium text-gray-900 truncate">
                                  {reviewer.user_name}
                                </span>
                              </div>
                              <button
                                onClick={() => handleRemoveReviewer(reviewer.id)}
                                disabled={deletingReviewerId === reviewer.id}
                                className="p-0.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 flex-shrink-0"
                                title="Remove reviewer"
                              >
                                {deletingReviewerId === reviewer.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Compact Add Button */}
                    <button
                      onClick={() => handleAddReviewer(stage)}
                      className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 border border-dashed border-gray-300 text-gray-600 rounded hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors text-xs font-medium"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Add
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
