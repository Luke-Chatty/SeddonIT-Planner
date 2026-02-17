'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePlanStore } from '@/lib/store';
import { Task } from '@/lib/types';
import { TaskCard } from '@/components/TaskManager/TaskCard';
import { TaskForm } from '@/components/TaskManager/TaskForm';
import { Button } from '@/components/UI/Button';
import { Modal } from '@/components/UI/Modal';
import { Select } from '@/components/UI/Select';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Filter, GripVertical, Search } from 'lucide-react';
import { getTaskNumber } from '@/lib/utils';
import { AppHeader } from '@/components/AppHeader';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { toast } from 'sonner';
import { flattenTaskHierarchy, getTaskAndAncestorIds } from '@/lib/taskHierarchy';

const FILTER_STORAGE_KEY = 'seddon-planner-task-filters';
const COLLAPSE_STORAGE_KEY = 'seddon-planner-task-collapsed';

interface SortableTaskCardProps {
  task: Task;
  taskNumber: string;
  onSelect: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onDuplicate?: (taskId: string) => void;
  isSelected: boolean;
  readOnly?: boolean;
  disableDrag?: boolean;
  depth?: number;
  hasChildren?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  rollup?: { totalDescendants: number; completedDescendants: number; percentComplete: number };
}

function SortableTaskCard({
  task,
  taskNumber,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  isSelected,
  readOnly = false,
  disableDrag = false,
  depth = 0,
  hasChildren = false,
  isCollapsed = false,
  onToggleCollapse,
  rollup,
}: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: disableDrag });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {!disableDrag && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
          <GripVertical className="w-5 h-5" {...attributes} {...listeners} />
        </div>
      )}
      <div className={disableDrag ? '' : 'ml-8'}>
        <TaskCard
          task={task}
          taskNumber={taskNumber}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          isSelected={isSelected}
          readOnly={readOnly}
          depth={depth}
          hasChildren={hasChildren}
          isCollapsed={isCollapsed}
          onToggleCollapse={onToggleCollapse}
          rollup={rollup}
        />
      </div>
    </div>
  );
}

export default function PlanTasksPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.planId as string;

  const { plan, planRole, selectedTaskId, setSelectedTask, deleteTask, reorderTasks, duplicateTask, loadPlan, isLoading } = usePlanStore();
  const canEdit = planRole === 'OWNER' || planRole === 'EDITOR';
  const storageKey = `${FILTER_STORAGE_KEY}-${planId}`;

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedTaskIds, setCollapsedTaskIds] = useState<string[]>([]);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { status?: string; priority?: string; search?: string };
        if (parsed.status) setStatusFilter(parsed.status);
        if (parsed.priority) setPriorityFilter(parsed.priority);
        if (parsed.search) setSearchQuery(parsed.search || '');
      }
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined' || !planId) return;
    try {
      const raw = sessionStorage.getItem(`${COLLAPSE_STORAGE_KEY}-${planId}`);
      if (raw) {
        const parsed = JSON.parse(raw) as { ids?: string[] };
        if (Array.isArray(parsed.ids)) setCollapsedTaskIds(parsed.ids.filter((id) => typeof id === 'string'));
      }
    } catch {}
  }, [planId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({
        status: statusFilter,
        priority: priorityFilter,
        search: searchQuery,
      }));
    } catch {}
  }, [storageKey, statusFilter, priorityFilter, searchQuery]);

  useEffect(() => {
    if (typeof window === 'undefined' || !planId) return;
    try {
      sessionStorage.setItem(
        `${COLLAPSE_STORAGE_KEY}-${planId}`,
        JSON.stringify({ ids: collapsedTaskIds })
      );
    } catch {}
  }, [planId, collapsedTaskIds]);

  useEffect(() => {
    if (!plan) return;
    const taskIdSet = new Set(plan.tasks.map((task) => task.id));
    setCollapsedTaskIds((prev) => prev.filter((id) => taskIdSet.has(id)));
  }, [plan]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (typeof window !== 'undefined' && planId) {
      loadPlan(planId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  useEffect(() => {
    if (typeof window !== 'undefined' && plan) {
      // Initialize order for tasks that don't have it
      const tasksNeedingOrder = plan.tasks.filter(t => t.order === undefined);
      if (tasksNeedingOrder.length > 0) {
        const updatedTasks = plan.tasks.map((task, index) => ({
          ...task,
          order: task.order ?? index + 1,
        }));
        usePlanStore.getState().setPlan({
          ...plan,
          tasks: updatedTasks,
        });
      }
    }
  }, [plan]);

  if (!plan) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-[#001524] dark:via-[#022943]/20 dark:to-[#001524]">
        <div className="text-center">
          {isLoading ? (
            <>
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-lg text-gray-600 dark:text-gray-400">Loading tasks...</p>
            </>
          ) : (
            <>
              <p className="text-lg font-medium text-foreground mb-2">Plan not found or access denied</p>
              <p className="text-muted-foreground mb-4">This plan does not exist or you don’t have permission to view it.</p>
              <Button variant="primary" onClick={() => router.push('/')}>
                Back to My Plan
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  };

  const handleAdd = () => {
    setEditingTask(null);
    setIsTaskFormOpen(true);
  };

  const handleClose = () => {
    setIsTaskFormOpen(false);
    setEditingTask(null);
  };

  const searchLower = searchQuery.trim().toLowerCase();
  const filteredTasks = plan.tasks.filter((task) => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    if (searchLower) {
      const titleMatch = task.title.toLowerCase().includes(searchLower);
      const descMatch = (task.description || '').toLowerCase().includes(searchLower);
      if (!titleMatch && !descMatch) return false;
    }
    return true;
  });

  const includeTaskIds = getTaskAndAncestorIds(
    plan.tasks,
    new Set(filteredTasks.map((task) => task.id))
  );
  const hierarchyRows = flattenTaskHierarchy(plan.tasks, {
    collapsedTaskIds: new Set(collapsedTaskIds),
    includeTaskIds: includeTaskIds.size > 0 ? includeTaskIds : undefined,
    ignoreCollapse: searchLower.length > 0 || statusFilter !== 'all' || priorityFilter !== 'all',
  });

  const canReorder =
    canEdit &&
    statusFilter === 'all' &&
    priorityFilter === 'all' &&
    searchLower.length === 0 &&
    collapsedTaskIds.length === 0;

  const reorderDisabledReason = !canEdit
    ? 'You do not have edit permissions.'
    : searchLower.length > 0 || statusFilter !== 'all' || priorityFilter !== 'all'
      ? 'Clear search and filters to reorder tasks.'
      : collapsedTaskIds.length > 0
        ? 'Expand all parent tasks to reorder tasks.'
        : null;

  const toggleCollapse = (taskId: string) => {
    setCollapsedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!canReorder) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const orderedVisibleTasks = hierarchyRows.map((row) => row.task);
    const oldIndex = orderedVisibleTasks.findIndex((t) => t.id === active.id);
    const newIndex = orderedVisibleTasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(orderedVisibleTasks, oldIndex, newIndex);
    const taskIds = newOrder.map((t) => t.id);
    reorderTasks(taskIds);
    toast.success('Task order saved. Order is used in the list and task numbers; Gantt shows by date.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-[#001524] dark:via-[#022943]/20 dark:to-[#001524] text-foreground relative transition-colors duration-300">
      <div className="fixed inset-0 -z-10 bg-[url('/grain.png')] opacity-[0.03] pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#022943]/5 dark:bg-blue-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="px-6 pt-4 pb-2">
        <Breadcrumbs
          items={[
            { label: 'My Plans', href: '/' },
            { label: plan.name, href: `/plans/${planId}` },
            { label: 'Tasks' },
          ]}
        />
      </div>
      <AppHeader
        backHref={`/plans/${planId}`}
        title="Task Management"
        subtitle={`${plan.name} • Drag to reorder (saved automatically)`}
        showLogo={false}
      >
        {canEdit && (
          <Button
            onClick={handleAdd}
            variant="primary"
            size="sm"
            className="rounded-xl shadow-lg shadow-[#022943]/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        )}
      </AppHeader>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Filters - sticky bar */}
        <div className="sticky top-0 z-10 mb-4 py-3 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#022943]/95 backdrop-blur-xl shadow-sm flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#022943]/80"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#022943] dark:text-[#4ebec7]" />
            <span className="text-sm font-medium text-[#022943] dark:text-white">Filters</span>
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All status' },
              { value: 'not-started', label: 'Not started' },
              { value: 'in-progress', label: 'In progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'blocked', label: 'Blocked' },
            ]}
            className="w-40"
          />
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All priority' },
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'critical', label: 'Critical' },
            ]}
            className="w-40"
          />
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {filteredTasks.length} of {plan.tasks.length} tasks
          </span>
          {canEdit && reorderDisabledReason && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {reorderDisabledReason}
            </span>
          )}
        </div>

        {/* Task List */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={hierarchyRows.map((row) => row.task.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center rounded-[20px] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#022943] shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
                  <div className="w-20 h-20 rounded-full bg-[#022943]/10 dark:bg-[#4ebec7]/20 flex items-center justify-center mb-4">
                    <Filter className="w-10 h-10 text-[#022943] dark:text-[#4ebec7]" />
                  </div>
                  <p className="text-lg font-semibold text-[#022943] dark:text-white mb-2">
                    {plan.tasks.length === 0 ? 'No tasks yet' : 'No matching tasks'}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {plan.tasks.length === 0
                      ? 'Click "New Task" to create your first task.'
                      : 'Try adjusting your filters.'}
                  </p>
                </div>
              ) : (
                hierarchyRows.map((row) => (
                  <SortableTaskCard
                    key={row.task.id}
                    task={row.task}
                    taskNumber={getTaskNumber(row.task, plan.tasks)}
                    onSelect={(task) => {
                      setSelectedTask(task.id);
                      router.push(`/plans/${planId}/tasks/${task.id}`);
                    }}
                    onEdit={(task) => {
                      router.push(`/plans/${planId}/tasks/${task.id}`);
                    }}
                    onDelete={deleteTask}
                    onDuplicate={canEdit ? (id) => { duplicateTask(id); toast.success('Task duplicated'); } : undefined}
                    isSelected={row.task.id === selectedTaskId}
                    readOnly={!canEdit}
                    disableDrag={!canReorder}
                    depth={row.depth}
                    hasChildren={row.hasChildren}
                    isCollapsed={row.isCollapsed}
                    onToggleCollapse={() => toggleCollapse(row.task.id)}
                    rollup={row.rollup}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </DndContext>
      </main>

      {/* Task Form Modal */}
      <Modal
        isOpen={isTaskFormOpen}
        onClose={handleClose}
        title={editingTask ? 'Edit Task' : 'Create New Task'}
        size="full"
      >
        <TaskForm
          task={editingTask}
          onClose={handleClose}
          onSave={() => { }}
        />
      </Modal>
    </div>
  );
}
