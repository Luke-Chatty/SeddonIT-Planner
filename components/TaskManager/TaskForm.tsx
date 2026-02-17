'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Task } from '@/lib/types';
import { Input } from '../UI/Input';
import { Textarea } from '../UI/Textarea';
import { Select } from '../UI/Select';
import { Button } from '../UI/Button';
import { RichTextEditor } from '../UI/RichTextEditor';
import { usePlanStore } from '@/lib/store';
import { searchDirectory, type DirectoryUser } from '@/lib/api';
import { Calendar, CheckCircle2, AlertCircle, Clock, Save, X, User } from 'lucide-react';
import { cn, getTaskNumber } from '@/lib/utils';
import { addDays, parseISO, format, isValid } from 'date-fns';
import { getDescendantIds } from '@/lib/taskHierarchy';

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
    parentId: '',
    scopeOfWorks: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [assignSearch, setAssignSearch] = useState('');
  const [assignResults, setAssignResults] = useState<DirectoryUser[]>([]);
  const [assignDropdownOpen, setAssignDropdownOpen] = useState(false);
  const assignDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const assignContainerRef = useRef<HTMLDivElement>(null);

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
        parentId: task.parentId || '',
        scopeOfWorks: task.scopeOfWorks || '',
      });
    } else if (plan) {
      const planStart = plan.startDate.split('T')[0];
      const start = new Date(planStart);
      const end = addDays(start, 14);
      setFormData((prev) => ({
        ...prev,
        startDate: planStart,
        endDate: format(end, 'yyyy-MM-dd'),
      }));
    }
  }, [task, plan]);

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
        parentId: formData.parentId.trim() || undefined,
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
  const disallowedParentIds = new Set<string>();
  if (task && plan) {
    disallowedParentIds.add(task.id);
    getDescendantIds(task.id, plan.tasks).forEach((id) => disallowedParentIds.add(id));
  }
  const parentOptions = [
    { value: '', label: 'No parent (top-level task)' },
    ...availableTasks
      .filter((t) => !disallowedParentIds.has(t.id))
      .map((t) => ({
        value: t.id,
        label: `${getTaskNumber(t, plan?.tasks ?? availableTasks)} ${t.title}`,
      })),
  ];
  const selectedDependencyTasks = availableTasks.filter((t) => formData.dependencies.includes(t.id));

  const runAssignSearch = useCallback((q: string) => {
    if (q.trim().length < 2) {
      setAssignResults([]);
      return;
    }
    searchDirectory(q).then(setAssignResults).catch(() => setAssignResults([]));
  }, []);
  useEffect(() => {
    if (assignDebounceRef.current) clearTimeout(assignDebounceRef.current);
    const q = assignSearch.trim();
    if (q.length < 2) {
      setAssignResults([]);
      setAssignDropdownOpen(false);
      return;
    }
    assignDebounceRef.current = setTimeout(() => {
      runAssignSearch(q);
      setAssignDropdownOpen(true);
    }, 300);
    return () => { if (assignDebounceRef.current) clearTimeout(assignDebounceRef.current); };
  }, [assignSearch, runAssignSearch]);
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (assignContainerRef.current && !assignContainerRef.current.contains(e.target as Node)) setAssignDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const setDurationWeeks = (weeks: number) => {
    if (!formData.startDate) return;
    const start = parseISO(formData.startDate);
    if (!isValid(start)) return;
    const end = addDays(start, weeks * 7);
    setFormData({ ...formData, endDate: format(end, 'yyyy-MM-dd') });
  };

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
              <div>
                <Input
                  label="End Date"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  error={errors.endDate}
                  required
                  disabled={readOnly}
                />
                {!readOnly && formData.startDate && (
                  <p className="text-xs text-muted-foreground mt-1 mb-2">Quick duration from start:</p>
                )}
                {!readOnly && formData.startDate && (
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4].map((w) => (
                      <Button
                        key={w}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => setDurationWeeks(w)}
                      >
                        {w} week{w > 1 ? 's' : ''}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
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
              <Select
                label="Parent Task (WBS)"
                value={formData.parentId}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                options={parentOptions}
                disabled={readOnly}
              />
            </div>
          </div>

          <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-border/50" ref={assignContainerRef}>
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <User className="w-4 h-4" /> Assignment
            </h3>
            <div className="relative">
              <Input
                label="Assigned To"
                value={assignDropdownOpen || assignResults.length ? assignSearch : (assignSearch || formData.assignedTo)}
                onChange={(e) => {
                  const v = e.target.value;
                  setAssignSearch(v);
                  if (!v) setFormData({ ...formData, assignedTo: '' });
                }}
                onFocus={() => { if (formData.assignedTo) setAssignSearch(formData.assignedTo); }}
                onBlur={() => {
                  if (assignSearch.trim()) setFormData((prev) => ({ ...prev, assignedTo: assignSearch.trim() }));
                }}
                placeholder="Search name or email, or type a name"
                disabled={readOnly}
              />
              {assignDropdownOpen && assignResults.length > 0 && !readOnly && (
                <ul
                  className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-lg border border-border bg-background shadow-lg py-1"
                  role="listbox"
                >
                  {assignResults.map((u) => (
                    <li
                      key={u.id}
                      role="option"
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-muted flex items-center gap-2"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setFormData((prev) => ({ ...prev, assignedTo: u.mail }));
                        setAssignSearch(u.displayName ? `${u.displayName} (${u.mail})` : u.mail);
                        setAssignDropdownOpen(false);
                        setAssignResults([]);
                      }}
                    >
                      <span className="flex h-8 w-8 rounded-full bg-muted items-center justify-center text-xs font-medium">
                        {(u.displayName || u.mail || '?').slice(0, 2).toUpperCase()}
                      </span>
                      <span className="truncate">{u.displayName || u.mail}</span>
                      {u.jobTitle && <span className="text-muted-foreground text-xs truncate">{u.jobTitle}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
              <p className="text-xs text-muted-foreground">
                Tasks that must be completed before this one can start. This task will wait for the selected tasks.
              </p>
              {selectedDependencyTasks.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedDependencyTasks.map((t) => (
                    <span
                      key={t.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 border border-amber-200 dark:border-amber-700"
                    >
                      {t.title}
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            dependencies: formData.dependencies.filter((id) => id !== t.id),
                          })}
                          className="hover:bg-amber-200 dark:hover:bg-amber-800 rounded-full p-0.5"
                          aria-label={`Remove ${t.title} from dependencies`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}
              <div className="space-y-2 max-h-40 overflow-y-auto border border-border rounded-lg p-2 bg-muted/10 custom-scrollbar">
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
                    <span className="text-sm text-foreground font-medium truncate">{t.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Scope of Works (9 cols) */}
        <div className="lg:col-span-9 flex flex-col h-full overflow-hidden">
          <div className="mb-3">
            <label className="block text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Detailed Scope of Works
            </label>
            <p className="text-xs text-muted-foreground mt-1">
              Describe deliverables, acceptance criteria, and any tables or diagrams. Use headings and lists to structure the content.
            </p>
          </div>
          <div className={cn('flex-1 min-h-[280px] flex flex-col', readOnly && 'pointer-events-none opacity-90')}>
            <RichTextEditor
              content={formData.scopeOfWorks}
              onChange={(content) => setFormData({ ...formData, scopeOfWorks: content })}
              placeholder="e.g. ## Deliverables — list items, ## Acceptance criteria — what must be met. Use the toolbar for bold, headings, and lists."
              className="flex-1 min-h-[260px] overflow-y-auto border border-border rounded-xl focus-within:ring-2 focus-within:ring-primary/20"
            />
          </div>
        </div>

      </div>
    </form>
  );
}
