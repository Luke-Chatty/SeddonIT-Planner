'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/lib/types';
import { Input } from '../UI/Input';
import { Textarea } from '../UI/Textarea';
import { Select } from '../UI/Select';
import { Button } from '../UI/Button';
import { RichTextEditor } from '../UI/RichTextEditor';
import { usePlanStore } from '@/lib/store';
import { Calendar, CheckCircle2, AlertCircle, Clock, Save, X, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskFormProps {
  task?: Task | null;
  onClose: () => void;
  onSave: () => void;
  /** When true, show as view-only (viewer role). No save, all fields disabled. */
  readOnly?: boolean;
}

export function TaskForm({ task, onClose, onSave, readOnly = false }: TaskFormProps) {
  const { addTask, updateTask, plan } = usePlanStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'not-started' as Task['status'],
    priority: 'medium' as Task['priority'],
    assignedTo: '',
    dependencies: [] as string[],
    scopeOfWorks: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        startDate: task.startDate.split('T')[0],
        endDate: task.endDate.split('T')[0],
        status: task.status,
        priority: task.priority,
        assignedTo: task.assignedTo || '',
        dependencies: task.dependencies,
        scopeOfWorks: task.scopeOfWorks || '',
      });
    }
  }, [task]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    if (!validate()) return;

    // Calculate order if not provided
    const maxOrder = plan && plan.tasks.length > 0
      ? Math.max(...plan.tasks.map(t => t.order ?? 0))
      : 0;
    const order = task?.order ?? maxOrder + 1;

    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      status: formData.status,
      priority: formData.priority,
      assignedTo: formData.assignedTo.trim() || undefined,
      dependencies: formData.dependencies,
      scopeOfWorks: formData.scopeOfWorks,
      order,
    };

    if (task) {
      updateTask(task.id, taskData);
    } else {
      addTask(taskData);
    }

    onSave();
    onClose();
  };

  const availableTasks = plan?.tasks.filter(t => t.id !== task?.id) || [];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-6">

      {/* Top Bar: Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex-1">
          <Input
            label="Task Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            error={errors.title}
            required
            className="text-lg font-bold"
            placeholder="Enter task title..."
            disabled={readOnly}
          />
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          {readOnly ? (
            <Button type="button" variant="secondary" onClick={onClose} className="gap-2">
              <X className="w-4 h-4" /> Close
            </Button>
          ) : (
            <>
              <Button type="button" variant="secondary" onClick={onClose} className="gap-2">
                <X className="w-4 h-4" /> Cancel
              </Button>
              <Button type="submit" variant="primary" className="gap-2 bg-brand-navy hover:bg-brand-navy/90 text-white">
                <Save className="w-4 h-4" /> {task ? 'Save Changes' : 'Create Task'}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100%-80px)]">

        {/* LEFT COLUMN: Metadata (3 cols - slightly smaller) */}
        <div className="lg:col-span-3 space-y-6 lg:border-r lg:border-border lg:pr-6 h-full overflow-y-auto custom-scrollbar pb-10">

          <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-border/50">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-4 h-4" /> Schedule
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                error={errors.startDate}
                required
                disabled={readOnly}
              />
              <Input
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                error={errors.endDate}
                required
                disabled={readOnly}
              />
            </div>
          </div>

          <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-border/50">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Status & Priority
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <Select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
                options={[
                  { value: 'not-started', label: 'Not Started' },
                  { value: 'in-progress', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'blocked', label: 'Blocked' },
                ]}
                disabled={readOnly}
              />
              <Select
                label="Priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'critical', label: 'Critical' },
                ]}
                disabled={readOnly}
              />
            </div>
          </div>

          <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-border/50">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <User className="w-4 h-4" /> Assignment
            </h3>
            <Input
              label="Assigned To"
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              placeholder="Team or person name"
              disabled={readOnly}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Brief Description</h3>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              placeholder="Short summary of the task..."
              className="resize-none"
              disabled={readOnly}
            />
          </div>

          {availableTasks.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Dependencies</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-lg p-2 bg-muted/10 custom-scrollbar">
                {availableTasks.map((t) => (
                  <label key={t.id} className={cn('flex items-center gap-2 p-2 rounded transition-colors', !readOnly && 'cursor-pointer hover:bg-muted/50')}>
                    <input
                      type="checkbox"
                      checked={formData.dependencies.includes(t.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            dependencies: [...formData.dependencies, t.id],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            dependencies: formData.dependencies.filter(id => id !== t.id),
                          });
                        }
                      }}
                      className="rounded border-brand-cyan text-brand-navy focus:ring-brand-cyan h-4 w-4"
                      disabled={readOnly}
                    />
                    <span className="text-sm text-foreground font-medium">{t.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Scope of Works (9 cols) */}
        <div className="lg:col-span-9 flex flex-col h-full overflow-hidden">
          <label className="block text-sm font-bold text-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Detailed Scope of Works
          </label>
          <div className={cn('flex-1 border border-border rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm flex flex-col', readOnly && 'pointer-events-none opacity-90')}>
            <RichTextEditor
              content={formData.scopeOfWorks}
              onChange={(content) => setFormData({ ...formData, scopeOfWorks: content })}
              placeholder="Enter detailed scope, insert tables, images, or diagrams here..."
              className="flex-1 h-full overflow-y-auto border-0 focus-visible:ring-0 p-4"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-right">
            Supports rich text, tables, and images.
          </p>
        </div>

      </div>
    </form>
  );
}