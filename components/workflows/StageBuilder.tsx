'use client';

import { useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, Grip } from 'lucide-react';
import type { WorkflowStage, WorkflowStageColor } from '@/lib/supabase';

interface StageBuilderProps {
  stages: WorkflowStage[];
  onChange: (stages: WorkflowStage[]) => void;
  disabled?: boolean;
}

const COLOR_OPTIONS: Array<{ color: WorkflowStageColor; label: string; hex: string }> = [
  { color: 'yellow', label: 'Yellow (Design/Draft)', hex: '#EAB308' },
  { color: 'green', label: 'Green (Approved)', hex: '#10B981' },
  { color: 'blue', label: 'Blue (In Review)', hex: '#3B82F6' },
  { color: 'purple', label: 'Purple (Final)', hex: '#A855F7' },
  { color: 'orange', label: 'Orange (Changes)', hex: '#F59E0B' },
  { color: 'red', label: 'Red (Blocked)', hex: '#EF4444' },
  { color: 'gray', label: 'Gray (Pending)', hex: '#6B7280' },
];

export default function StageBuilder({ stages, onChange, disabled = false }: StageBuilderProps) {
  const addStage = () => {
    const newOrder = stages.length + 1;
    const newStage: WorkflowStage = {
      order: newOrder,
      name: '',
      color: 'blue',
    };
    onChange([...stages, newStage]);
  };

  const removeStage = (index: number) => {
    if (stages.length === 1) return; // Cannot remove last stage

    const newStages = stages.filter((_, i) => i !== index);
    // Reorder remaining stages
    const reorderedStages = newStages.map((stage, i) => ({
      ...stage,
      order: i + 1,
    }));
    onChange(reorderedStages);
  };

  const updateStage = (index: number, field: 'name' | 'color', value: string) => {
    const newStages = [...stages];
    newStages[index] = {
      ...newStages[index],
      [field]: value,
    };
    onChange(newStages);
  };

  const moveStage = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === stages.length - 1) return;

    const newStages = [...stages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    // Swap stages
    [newStages[index], newStages[targetIndex]] = [newStages[targetIndex], newStages[index]];

    // Reorder
    const reorderedStages = newStages.map((stage, i) => ({
      ...stage,
      order: i + 1,
    }));

    onChange(reorderedStages);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Workflow Stages
        </label>
        <span className="text-xs text-gray-500">
          {stages.length} stage{stages.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Stage list */}
      <div className="space-y-2">
        {stages.map((stage, index) => (
          <div
            key={index}
            className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg"
          >
            {/* Drag handle (visual only) */}
            <div className="flex flex-col gap-1 mt-2">
              <Grip className="h-4 w-4 text-gray-400" />
            </div>

            {/* Order number */}
            <div className="flex items-center justify-center w-8 h-8 mt-1 bg-white border border-gray-300 rounded-full text-sm font-semibold text-gray-700">
              {stage.order}
            </div>

            {/* Stage name input */}
            <div className="flex-1">
              <input
                type="text"
                value={stage.name}
                onChange={(e) => updateStage(index, 'name', e.target.value)}
                placeholder="Stage name..."
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-100"
              />
            </div>

            {/* Color picker */}
            <div className="w-36">
              <select
                value={stage.color}
                onChange={(e) => updateStage(index, 'color', e.target.value as WorkflowStageColor)}
                disabled={disabled}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-100 text-sm"
                style={{
                  backgroundColor: COLOR_OPTIONS.find((c) => c.color === stage.color)?.hex + '20',
                  borderColor: COLOR_OPTIONS.find((c) => c.color === stage.color)?.hex,
                }}
              >
                {COLOR_OPTIONS.map((colorOption) => (
                  <option key={colorOption.color} value={colorOption.color}>
                    {colorOption.color.charAt(0).toUpperCase() + colorOption.color.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Move up/down buttons */}
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => moveStage(index, 'up')}
                disabled={disabled || index === 0}
                className="p-1 hover:bg-gray-200 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Move up"
              >
                <ChevronUp className="h-4 w-4 text-gray-600" />
              </button>
              <button
                type="button"
                onClick={() => moveStage(index, 'down')}
                disabled={disabled || index === stages.length - 1}
                className="p-1 hover:bg-gray-200 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Move down"
              >
                <ChevronDown className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            {/* Delete button */}
            <button
              type="button"
              onClick={() => removeStage(index)}
              disabled={disabled || stages.length === 1}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title={stages.length === 1 ? 'Cannot delete last stage' : 'Delete stage'}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </button>
          </div>
        ))}
      </div>

      {/* Add stage button */}
      <button
        type="button"
        onClick={addStage}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus className="h-4 w-4" />
        Add Stage
      </button>

      {/* Stage preview */}
      {stages.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs font-medium text-blue-900 mb-2">Preview</p>
          <div className="flex gap-2 overflow-x-auto">
            {stages.map((stage, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border text-sm whitespace-nowrap"
                style={{
                  borderColor: COLOR_OPTIONS.find((c) => c.color === stage.color)?.hex,
                  backgroundColor: COLOR_OPTIONS.find((c) => c.color === stage.color)?.hex + '15',
                }}
              >
                <span className="font-semibold text-gray-700">{stage.order}</span>
                <span className="text-gray-900">
                  {stage.name || `Stage ${stage.order}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
