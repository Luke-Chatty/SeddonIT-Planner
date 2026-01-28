'use client';

import { useState, useEffect } from 'react';
import { usePlanStore } from '@/lib/store';
import { RichTextEditor } from '../UI/RichTextEditor';
import { Button } from '../UI/Button';
import { Save, FileText, Settings } from 'lucide-react';

export function TaskDetailsEditor() {
  const { plan, selectedTaskId, updateTask } = usePlanStore();
  const [scopeOfWorks, setScopeOfWorks] = useState('');
  const [designInformation, setDesignInformation] = useState('');
  const [activeTab, setActiveTab] = useState<'scope' | 'design'>('scope');
  const [hasChanges, setHasChanges] = useState(false);

  const selectedTask = plan?.tasks.find(t => t.id === selectedTaskId);

  useEffect(() => {
    if (selectedTask) {
      setScopeOfWorks(selectedTask.scopeOfWorks || '');
      setDesignInformation(selectedTask.designInformation || '');
      setHasChanges(false);
    } else {
      setScopeOfWorks('');
      setDesignInformation('');
      setHasChanges(false);
    }
  }, [selectedTask]);

  const handleSave = () => {
    if (selectedTaskId) {
      updateTask(selectedTaskId, {
        scopeOfWorks,
        designInformation,
      });
      setHasChanges(false);
    }
  };

  const handleScopeChange = (content: string) => {
    setScopeOfWorks(content);
    setHasChanges(true);
  };

  const handleDesignChange = (content: string) => {
    setDesignInformation(content);
    setHasChanges(true);
  };

  if (!selectedTask) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 p-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-purple-500 dark:text-purple-400" />
          </div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">No task selected</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Select a task to edit details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-200/60 dark:border-gray-800/60 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Task Details</h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{selectedTask.title}</p>
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
        
        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('scope')}
            className={`
              flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors
              ${activeTab === 'scope'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }
            `}
          >
            <FileText className="w-3.5 h-3.5 inline mr-1.5" />
            Scope of Works
          </button>
          <button
            onClick={() => setActiveTab('design')}
            className={`
              flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors
              ${activeTab === 'design'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }
            `}
          >
            <Settings className="w-3.5 h-3.5 inline mr-1.5" />
            Design Information
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-3">
        {activeTab === 'scope' ? (
          <RichTextEditor
            content={scopeOfWorks}
            onChange={handleScopeChange}
            placeholder="Define the scope of works for this task. Include deliverables, requirements, and boundaries..."
            className="h-full"
          />
        ) : (
          <RichTextEditor
            content={designInformation}
            onChange={handleDesignChange}
            placeholder="Add design information, technical specifications, architecture details, and implementation notes..."
            className="h-full"
          />
        )}
      </div>
    </div>
  );
}