'use client';

import { useState } from 'react';
import { usePlanStore } from '@/lib/store';
import { Task } from '@/lib/types';
import { TaskCard } from './TaskCard';
import { Filter } from 'lucide-react';
import { Select } from '../UI/Select';
import { getTaskNumber } from '@/lib/utils';

interface TaskListProps {
  onEditTask?: (task: Task) => void;
}

export function TaskList({ onEditTask }: TaskListProps) {
  const { plan, planRole, selectedTaskId, setSelectedTask, deleteTask } = usePlanStore();
  const readOnly = planRole === 'VIEWER';
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  if (!plan) return null;

  const handleEdit = (task: Task) => {
    if (onEditTask) {
      onEditTask(task);
    }
  };

  const filteredTasks = plan.tasks.filter((task) => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    return true;
  });

  // Sort by order
  const sortedTasks = [...filteredTasks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200/60 dark:border-gray-800/60 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
            {filteredTasks.length} of {plan.tasks.length} tasks
          </p>
          <div className="grid grid-cols-2 gap-2">
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
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/60 dark:border-gray-700/60 text-xs"
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
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/60 dark:border-gray-700/60 text-xs"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center mb-3">
              <Filter className="w-8 h-8 text-blue-500 dark:text-blue-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {plan.tasks.length === 0 ? 'No tasks yet' : 'No matching tasks'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {plan.tasks.length === 0
                ? 'Create your first task to get started.'
                : 'Adjust filters to see more tasks.'}
            </p>
          </div>
        ) : (
          sortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              taskNumber={getTaskNumber(task, plan.tasks)}
              onSelect={(task) => setSelectedTask(task.id)}
              onEdit={handleEdit}
              onDelete={deleteTask}
              isSelected={task.id === selectedTaskId}
              readOnly={readOnly}
            />
          ))
        )}
      </div>
    </div>
  );
}