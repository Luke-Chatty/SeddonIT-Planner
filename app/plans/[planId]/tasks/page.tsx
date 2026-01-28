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
import { ArrowLeft, Plus, Filter, GripVertical } from 'lucide-react';
import { getTaskNumber } from '@/lib/utils';

interface SortableTaskCardProps {
  task: Task;
  taskNumber: string;
  allTasks: Task[];
  onSelect: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  isSelected: boolean;
}

function SortableTaskCard({
  task,
  taskNumber,
  allTasks,
  onSelect,
  onEdit,
  onDelete,
  isSelected,
}: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
        <GripVertical className="w-5 h-5" {...attributes} {...listeners} />
      </div>
      <div className="ml-8">
        <TaskCard
          task={task}
          taskNumber={taskNumber}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
          isSelected={isSelected}
        />
      </div>
    </div>
  );
}

export default function PlanTasksPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.planId as string;

  const { plan, selectedTaskId, setSelectedTask, deleteTask, reorderTasks, loadPlan } = usePlanStore();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

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
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/10 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading tasks...</p>
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

  const filteredTasks = plan.tasks.filter((task) => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    return true;
  });

  // Sort by order
  const sortedTasks = [...filteredTasks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedTasks.findIndex((task) => task.id === active.id);
      const newIndex = sortedTasks.findIndex((task) => task.id === over.id);

      const newOrder = arrayMove(sortedTasks, oldIndex, newIndex);
      const taskIds = newOrder.map((task) => task.id);
      reorderTasks(taskIds);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative transition-colors duration-300">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/50 via-background to-background dark:from-blue-900/20 dark:via-background dark:to-background pointer-events-none" />

      {/* Header */}
      <header className="glass border-b border-border/40 px-6 py-4 shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="p-2"
              onClick={() => router.push(`/plans/${planId}`)}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 dark:to-blue-400 bg-clip-text text-transparent">
                Task Management
              </h1>
              <p className="text-sm text-muted-foreground">
                {plan.name} • Drag and drop to reorder tasks
              </p>
            </div>
          </div>
          <Button
            onClick={handleAdd}
            variant="primary"
            size="sm"
            className="shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Filters */}
        <div className="mb-6 p-4 glass-card rounded-xl border border-border/60 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Filters:</span>
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'not-started', label: 'Not Started' },
                { value: 'in-progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'blocked', label: 'Blocked' },
              ]}
              className="w-48"
            />
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Priority' },
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'critical', label: 'Critical' },
              ]}
              className="w-48"
            />
            <div className="ml-auto text-sm text-muted-foreground">
              {sortedTasks.length} of {plan.tasks.length} tasks
            </div>
          </div>
        </div>

        {/* Task List */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedTasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {sortedTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl border border-gray-200/60 dark:border-gray-700/60">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center mb-4">
                    <Filter className="w-10 h-10 text-blue-500 dark:text-blue-400" />
                  </div>
                  <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {plan.tasks.length === 0 ? 'No tasks yet' : 'No matching tasks'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {plan.tasks.length === 0
                      ? 'Click "New Task" to create your first task.'
                      : 'Try adjusting your filters.'}
                  </p>
                </div>
              ) : (
                sortedTasks.map((task) => (
                  <SortableTaskCard
                    key={task.id}
                    task={task}
                    taskNumber={getTaskNumber(task, plan.tasks)}
                    allTasks={plan.tasks}
                    onSelect={(task) => {
                      setSelectedTask(task.id);
                      router.push(`/plans/${planId}/tasks/${task.id}`);
                    }}
                    onEdit={(task) => {
                      router.push(`/plans/${planId}/tasks/${task.id}`);
                    }}
                    onDelete={deleteTask}
                    isSelected={task.id === selectedTaskId}
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