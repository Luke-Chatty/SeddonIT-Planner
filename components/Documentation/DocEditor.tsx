'use client';

import { useState, useEffect } from 'react';
import { usePlanStore } from '@/lib/store';
import { Textarea } from '../UI/Textarea';
import { Button } from '../UI/Button';
import { Save } from 'lucide-react';

export function DocEditor() {
  const { plan, selectedTaskId, updateTask } = usePlanStore();
  const [content, setContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const selectedTask = plan?.tasks.find(t => t.id === selectedTaskId);

  useEffect(() => {
    if (selectedTask) {
      setContent(selectedTask.documentation || '');
      setHasChanges(false);
    } else {
      setContent('');
      setHasChanges(false);
    }
  }, [selectedTask]);

  const handleSave = () => {
    if (selectedTaskId) {
      updateTask(selectedTaskId, { documentation: content });
      setHasChanges(false);
    }
  };

  const handleChange = (value: string) => {
    setContent(value);
    setHasChanges(true);
  };

  if (!selectedTask) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 p-8">
        <div className="text-center">
          <p className="text-lg mb-2">No task selected</p>
          <p className="text-sm">Select a task from the list or Gantt chart to view and edit its documentation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-200/60 dark:border-gray-800/60 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              Editor
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
              {selectedTask.title}
            </p>
          </div>
          {hasChanges && (
            <Button 
              onClick={handleSave} 
              size="sm"
              className="shadow-md shadow-green-500/30"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              Save
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-3">
        <Textarea
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Add documentation, notes, or details about this task. Markdown is supported."
          className="h-full min-h-[300px] font-mono text-sm"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Markdown supported: **bold**, *italic*, `code`
        </p>
      </div>
    </div>
  );
}