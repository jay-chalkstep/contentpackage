'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import type { MockupWithProgress, Workflow, WorkflowStage } from '@/lib/supabase';
import StageStatusPill from './StageStatusPill';

interface WorkflowBoardProps {
  workflow: Workflow;
  mockups: MockupWithProgress[];
  onRefresh: () => void;
}

export default function WorkflowBoard({
  workflow,
  mockups,
  onRefresh
}: WorkflowBoardProps) {
  const router = useRouter();
  const stages = workflow.stages || [];

  // Group mockups by their current stage
  const mockupsByStage = stages.reduce((acc, stage) => {
    acc[stage.order] = mockups.filter(m => {
      const stageProgress = m.progress?.find(p => p.stage_order === stage.order);
      return stageProgress?.status === 'in_review';
    });
    return acc;
  }, {} as Record<number, MockupWithProgress[]>);

  // Color mapping for workflow stage colors
  const stageColorClasses = {
    yellow: 'bg-yellow-50 border-yellow-200',
    green: 'bg-green-50 border-green-200',
    blue: 'bg-blue-50 border-blue-200',
    purple: 'bg-purple-50 border-purple-200',
    orange: 'bg-orange-50 border-orange-200',
    red: 'bg-red-50 border-red-200',
    gray: 'bg-gray-50 border-gray-200'
  };

  const stageHeaderColors = {
    yellow: 'bg-yellow-100 text-yellow-800',
    green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    orange: 'bg-orange-100 text-orange-800',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Workflow: {workflow.name}
        </h2>
        {workflow.description && (
          <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
        )}

        {/* Legend - Moved to top */}
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-300"></div>
            <span>In Review</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-100 border border-green-300"></div>
            <span>Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-100 border border-red-300"></div>
            <span>Changes Requested</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-200"></div>
            <span>Not Started</span>
          </div>
        </div>
      </div>

      {/* Workflow board - horizontal columns */}
      <div className="overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-4">
          {stages.map((stage) => {
            const stageMockups = mockupsByStage[stage.order] || [];
            const bgColor = stageColorClasses[stage.color] || stageColorClasses.gray;
            const headerColor = stageHeaderColors[stage.color] || stageHeaderColors.gray;

            return (
              <div
                key={stage.order}
                className={`flex-shrink-0 w-56 border rounded-lg ${bgColor}`}
              >
                {/* Stage header */}
                <div className={`px-3 py-2 ${headerColor} rounded-t-lg border-b`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-xs">
                      Stage {stage.order}: {stage.name}
                    </h3>
                    <span className="text-xs font-medium px-1.5 py-0.5 bg-white bg-opacity-50 rounded-full">
                      {stageMockups.length}
                    </span>
                  </div>
                </div>

                {/* Mockups in this stage */}
                <div className="p-2 space-y-2 min-h-[200px]">
                  {stageMockups.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No mockups in review
                    </div>
                  ) : (
                    stageMockups.map((mockup) => {
                      const stageProgress = mockup.progress?.find(
                        (p) => p.stage_order === stage.order
                      );

                      return (
                        <div
                          key={mockup.id}
                          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                        >
                          {/* Mockup thumbnail */}
                          <div
                            className="relative aspect-[3/2] bg-gray-100 cursor-pointer"
                            onClick={() => router.push(`/mockups/${mockup.id}`)}
                          >
                            {mockup.mockup_image_url ? (
                              <img
                                src={mockup.mockup_image_url}
                                alt={mockup.mockup_name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-gray-400 text-sm">No preview</span>
                              </div>
                            )}
                          </div>

                          {/* Mockup info */}
                          <div className="p-2">
                            <h4 className="font-medium text-xs text-gray-900 truncate mb-1.5">
                              {mockup.mockup_name}
                            </h4>

                            {/* Status pill */}
                            {stageProgress && (
                              <div className="mb-1.5">
                                <StageStatusPill
                                  status={stageProgress.status}
                                  stageName={stage.name}
                                  reviewedBy={stageProgress.reviewed_by_name}
                                  reviewedAt={stageProgress.reviewed_at}
                                  notes={stageProgress.notes}
                                />
                              </div>
                            )}

                            {/* Action button */}
                            <button
                              onClick={() => router.push(`/mockups/${mockup.id}`)}
                              className="w-full flex items-center justify-center gap-1.5 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Review
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
