'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Workflow as WorkflowIcon } from 'lucide-react';
import type { Workflow, WorkflowStage } from '@/lib/supabase';
import StageBuilder from './StageBuilder';

interface WorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (workflowData: {
    name: string;
    description?: string;
    stages: WorkflowStage[];
    is_default?: boolean;
  }) => Promise<void>;
  workflow?: Workflow | null; // For edit mode
  mode?: 'create' | 'edit';
}

export default function WorkflowModal({
  isOpen,
  onClose,
  onSubmit,
  workflow,
  mode = 'create',
}: WorkflowModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [stages, setStages] = useState<WorkflowStage[]>([
    { order: 1, name: '', color: 'blue' },
  ]);
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load workflow data in edit mode
  useEffect(() => {
    if (mode === 'edit' && workflow) {
      setName(workflow.name);
      setDescription(workflow.description || '');
      setStages(workflow.stages.length > 0 ? workflow.stages : [{ order: 1, name: '', color: 'blue' }]);
      setIsDefault(workflow.is_default);
    }
  }, [mode, workflow]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate name
    if (!name.trim()) {
      setError('Workflow name is required');
      return;
    }

    // Validate stages
    if (stages.length === 0) {
      setError('Workflow must have at least one stage');
      return;
    }

    // Validate all stages have names
    for (let i = 0; i < stages.length; i++) {
      if (!stages[i].name.trim()) {
        setError(`Stage ${i + 1} must have a name`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        stages: stages.map((s) => ({
          ...s,
          name: s.name.trim(),
        })),
        is_default: isDefault,
      });

      // Reset form
      setName('');
      setDescription('');
      setStages([{ order: 1, name: '', color: 'blue' }]);
      setIsDefault(false);
      setError(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save workflow');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      // Reset form if not in edit mode
      if (mode === 'create') {
        setName('');
        setDescription('');
        setStages([{ order: 1, name: '', color: 'blue' }]);
        setIsDefault(false);
      }
      setError(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <WorkflowIcon className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'edit' ? 'Edit Workflow' : 'Create New Workflow'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Workflow Name */}
          <div>
            <label
              htmlFor="workflowName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Workflow Name <span className="text-red-500">*</span>
            </label>
            <input
              id="workflowName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., 3-Stage Review Process"
              disabled={isSubmitting}
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:bg-gray-50"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Description <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of when to use this workflow..."
              disabled={isSubmitting}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:bg-gray-50 resize-none"
            />
          </div>

          {/* Stages Builder */}
          <StageBuilder stages={stages} onChange={setStages} disabled={isSubmitting} />

          {/* Set as Default */}
          <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              disabled={isSubmitting}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded disabled:opacity-50"
            />
            <label htmlFor="isDefault" className="text-sm text-gray-700 cursor-pointer">
              <span className="font-medium">Set as default workflow</span>
              <span className="block text-xs text-gray-600 mt-0.5">
                New projects will pre-select this workflow
              </span>
            </label>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || stages.length === 0}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === 'edit' ? 'Updating...' : 'Creating...'}
                </>
              ) : mode === 'edit' ? (
                'Update Workflow'
              ) : (
                'Create Workflow'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
