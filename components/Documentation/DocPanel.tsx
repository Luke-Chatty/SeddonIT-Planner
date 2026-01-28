'use client';

import { usePlanStore } from '@/lib/store';
import ReactMarkdown from 'react-markdown';
import { FileText, Search, Settings } from 'lucide-react';
import { Input } from '../UI/Input';
import { useState, useMemo } from 'react';

export function DocPanel() {
  const { plan, selectedTaskId, setSelectedTask } = usePlanStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'docs' | 'scope' | 'design'>('docs');

  const selectedTask = plan?.tasks.find(t => t.id === selectedTaskId);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !plan) return [];

    const query = searchQuery.toLowerCase();
    return plan.tasks.filter(task => {
      const titleMatch = task.title.toLowerCase().includes(query);
      const descMatch = task.description?.toLowerCase().includes(query);
      const docMatch = task.documentation?.toLowerCase().includes(query);
      return titleMatch || descMatch || docMatch;
    });
  }, [searchQuery, plan]);

  if (!selectedTask && !searchQuery) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-3 border-b border-gray-200/60 dark:border-gray-800/60 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks and documentation..."
          />
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-purple-500 dark:text-purple-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">No task selected</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Select a task to view documentation</p>
          </div>
        </div>
      </div>
    );
  }

  if (searchQuery && searchResults.length === 0) {
    return (
      <div className="h-full flex flex-col bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="p-5 border-b border-gray-200/60 dark:border-gray-800/60 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg">
              <Search className="w-5 h-5 text-white" />
            </div>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks and documentation..."
              className="flex-1"
            />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No results found</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Try a different search term</p>
          </div>
        </div>
      </div>
    );
  }

  if (searchQuery && searchResults.length > 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-3 border-b border-gray-200/60 dark:border-gray-800/60 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks and documentation..."
            className="mb-2"
          />
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {searchResults.map((task) => (
            <div
              key={task.id}
              className="border border-gray-200/60 dark:border-gray-700/60 rounded-lg p-3 cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
              onClick={() => {
                setSelectedTask(task.id);
                setSearchQuery('');
              }}
            >
              <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-2">
                {task.title}
              </h3>
              {task.documentation && (
                <div className="prose prose-xs dark:prose-invert max-w-none">
                  <ReactMarkdown>{task.documentation}</ReactMarkdown>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-200/60 dark:border-gray-800/60 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tasks and documentation..."
          className="mb-2"
        />
        {selectedTask && (
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
            {selectedTask.title}
          </h2>
        )}
      </div>
      <div className="p-3 border-b border-gray-200/60 dark:border-gray-800/60 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('docs')}
            className={`
              flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
              ${activeTab === 'docs'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }
            `}
          >
            Documentation
          </button>
          <button
            onClick={() => setActiveTab('scope')}
            className={`
              flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
              ${activeTab === 'scope'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }
            `}
          >
            Scope
          </button>
          <button
            onClick={() => setActiveTab('design')}
            className={`
              flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
              ${activeTab === 'design'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }
            `}
          >
            Design
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'docs' && (
          selectedTask?.documentation ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{selectedTask.documentation}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-purple-500 dark:text-purple-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">No documentation yet</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Use the editor to add documentation.</p>
            </div>
          )
        )}
        
        {activeTab === 'scope' && (
          selectedTask?.scopeOfWorks ? (
            <div 
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: selectedTask.scopeOfWorks }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-blue-500 dark:text-blue-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">No scope of works defined</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Use the editor to add scope details.</p>
            </div>
          )
        )}
        
        {activeTab === 'design' && (
          selectedTask?.designInformation ? (
            <div 
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: selectedTask.designInformation }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center mb-4">
                <Settings className="w-8 h-8 text-purple-500 dark:text-purple-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">No design information</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Use the editor to add design details.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}