'use client';

import { useState } from 'react';
import { Task } from '@/lib/types';
import { formatDate, getStatusColor, getPriorityColor, cn } from '@/lib/utils';
import { Calendar, User, AlertCircle, Edit2, Trash2, Copy, CheckCircle2, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '../UI/Button';
import { ConfirmModal } from '../UI/ConfirmModal';
import type { TaskRollup } from '@/lib/taskHierarchy';

interface TaskCardProps {
  task: Task;
  taskNumber?: string;
  onSelect: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onDuplicate?: (taskId: string) => void;
  isSelected?: boolean;
  /** When true, hide Edit/Delete (viewer role). */
  readOnly?: boolean;
  depth?: number;
  hasChildren?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  rollup?: TaskRollup;
}

export function TaskCard({
  task,
  taskNumber,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  isSelected = false,
  readOnly = false,
  depth = 0,
  hasChildren = false,
  isCollapsed = false,
  onToggleCollapse,
  rollup,
}: TaskCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getStatusGradient = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20';
      case 'in-progress':
        return 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20';
      case 'blocked':
        return 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20';
      default:
        return 'from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50';
    }
  };

  return (
    <div
      className={cn(
        'group relative border rounded-xl p-5 cursor-pointer transition-all duration-300',
        'bg-gradient-to-br backdrop-blur-sm',
        getStatusGradient(task.status),
        'border-gray-200/60 dark:border-gray-700/60',
        'hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-0.5',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        isSelected && 'ring-2 ring-blue-500 border-blue-500 shadow-lg shadow-blue-500/20 scale-[1.02]'
      )}
      style={{ marginLeft: `${Math.max(0, depth) * 14}px` }}
      onClick={() => onSelect(task)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(task);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Task: ${task.title}`}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-600 rounded-l-lg" />
      )}

      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {hasChildren && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCollapse?.();
                }}
                className="h-6 w-6 rounded-md border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-white/80 dark:hover:bg-gray-800/80"
                aria-label={isCollapsed ? 'Expand child tasks' : 'Collapse child tasks'}
                title={isCollapsed ? 'Expand child tasks' : 'Collapse child tasks'}
              >
                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
            {taskNumber && (
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                {taskNumber}
              </span>
            )}
            <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
              {task.title}
            </h3>
          </div>
          {task.description && (
            <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>
        {!readOnly && (
          <div className="flex gap-1 ml-2 flex-shrink-0">
            {onDuplicate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onDuplicate(task.id); }}
                className="h-9 w-9 p-0 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                title="Duplicate task"
              >
                <Copy className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onEdit(task); }}
              className="h-9 w-9 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
              title="Edit task"
            >
              <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
              className="h-9 w-9 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full shadow-sm',
            'backdrop-blur-sm border',
            getStatusColor(task.status),
            'border-gray-200/50 dark:border-gray-700/50'
          )}
        >
          {task.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />}
          {task.status.replace('-', ' ')}
        </span>
        <span
          className={cn(
            'px-3 py-1 text-xs font-semibold rounded-full shadow-sm',
            'backdrop-blur-sm border',
            getPriorityColor(task.priority),
            'border-gray-200/50 dark:border-gray-700/50'
          )}
        >
          {task.priority}
        </span>
        {task.dependencies.length > 0 && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50">
            <AlertCircle className="w-3.5 h-3.5" />
            {task.dependencies.length} {task.dependencies.length === 1 ? 'dependency' : 'dependencies'}
          </span>
        )}
        {hasChildren && rollup && rollup.totalDescendants > 0 && (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full border border-indigo-200/60 dark:border-indigo-700/50 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
            Roll-up {rollup.percentComplete}% ({rollup.completedDescendants}/{rollup.totalDescendants})
          </span>
        )}
      </div>

      {hasChildren && rollup && rollup.totalDescendants > 0 && (
        <div className="mb-3">
          <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500 dark:bg-indigo-400 transition-all"
              style={{ width: `${rollup.percentComplete}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
          <Calendar className="w-3 h-3 text-blue-500" />
          <span className="font-medium">{formatDate(task.startDate)}</span>
          <span className="mx-1">→</span>
          <span className="font-medium">{formatDate(task.endDate)}</span>
        </div>
        {task.assignedTo && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
            <User className="w-3 h-3 text-purple-500" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[80px]">{task.assignedTo}</span>
          </div>
        )}
      </div>

      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => onDelete(task.id)}
        title="Delete task?"
        message="Are you sure you want to delete this task? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
