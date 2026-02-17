'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePlanStore } from '@/lib/store';
import type { Milestone } from '@/lib/types';
import { Modal } from '@/components/UI/Modal';
import { Input } from '@/components/UI/Input';
import { Textarea } from '@/components/UI/Textarea';
import { Button } from '@/components/UI/Button';
import { ConfirmModal } from '@/components/UI/ConfirmModal';
import { formatDate } from '@/lib/utils';
import { Calendar, Edit2, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

type MilestoneFormState = {
  title: string;
  date: string;
  description: string;
};

const initialFormState: MilestoneFormState = {
  title: '',
  date: '',
  description: '',
};

interface MilestoneManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  canEdit: boolean;
}

function toInputDate(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

export function MilestoneManagerModal({ isOpen, onClose, canEdit }: MilestoneManagerModalProps) {
  const { plan, addMilestone, updateMilestone, deleteMilestone } = usePlanStore();
  const [form, setForm] = useState<MilestoneFormState>(initialFormState);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Milestone | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setForm(initialFormState);
    setEditingMilestoneId(null);
    setDeleteTarget(null);
  }, [isOpen]);

  const sortedMilestones = useMemo(() => {
    const milestones = plan?.milestones ?? [];
    return [...milestones].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [plan?.milestones]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!form.title.trim() || !form.date) {
      toast.error('Milestone title and date are required');
      return;
    }

    const parsedDate = new Date(form.date);
    if (Number.isNaN(parsedDate.getTime())) {
      toast.error('Please enter a valid date');
      return;
    }

    const payload = {
      title: form.title.trim(),
      date: parsedDate.toISOString(),
      description: form.description.trim() || undefined,
    };

    if (editingMilestoneId) {
      updateMilestone(editingMilestoneId, payload);
      toast.success('Milestone updated');
    } else {
      addMilestone(payload);
      toast.success('Milestone added');
    }

    setForm(initialFormState);
    setEditingMilestoneId(null);
  };

  const handleEdit = (milestone: Milestone) => {
    setEditingMilestoneId(milestone.id);
    setForm({
      title: milestone.title,
      date: toInputDate(milestone.date),
      description: milestone.description || '',
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteMilestone(deleteTarget.id);
    toast.success('Milestone deleted');
    setDeleteTarget(null);
    if (editingMilestoneId === deleteTarget.id) {
      setEditingMilestoneId(null);
      setForm(initialFormState);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Milestones" size="lg">
      <div className="space-y-5">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Manage key project milestones. Milestones are shown on the Gantt timeline.
        </p>

        {canEdit && (
          <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-slate-200 dark:border-white/10 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Title"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Design Sign-off"
                required
              />
              <Input
                label="Date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
            <Textarea
              label="Description (optional)"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              placeholder="Any context for this milestone"
            />
            <div className="flex items-center gap-2">
              <Button type="submit" variant="primary" size="sm">
                <Plus className="w-4 h-4 mr-1.5" />
                {editingMilestoneId ? 'Update Milestone' : 'Add Milestone'}
              </Button>
              {editingMilestoneId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingMilestoneId(null);
                    setForm(initialFormState);
                  }}
                >
                  Cancel edit
                </Button>
              )}
            </div>
          </form>
        )}

        <div className="space-y-2 max-h-[360px] overflow-y-auto">
          {sortedMilestones.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/15 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
              No milestones yet
            </div>
          ) : (
            sortedMilestones.map((milestone) => (
              <div
                key={milestone.id}
                className="rounded-xl border border-slate-200 dark:border-white/10 p-3 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-[#022943] dark:text-white truncate">{milestone.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(milestone.date)}
                  </p>
                  {milestone.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 whitespace-pre-wrap">
                      {milestone.description}
                    </p>
                  )}
                </div>
                {canEdit && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleEdit(milestone)}
                      title="Edit milestone"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => setDeleteTarget(milestone)}
                      title="Delete milestone"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete milestone?"
        message={deleteTarget ? `Delete "${deleteTarget.title}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
      />
    </Modal>
  );
}
