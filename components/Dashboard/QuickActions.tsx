'use client';

import { Button } from '../UI/Button';
import { Plus, Download, Upload, Settings } from 'lucide-react';

interface QuickActionsProps {
  onAddTask: () => void;
  onExport: () => void;
  onImport: () => void;
}

export function QuickActions({ onAddTask, onExport, onImport }: QuickActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={onAddTask}
        variant="primary"
        size="sm"
        className="shadow-md shadow-blue-500/30"
      >
        <Plus className="w-4 h-4 mr-1.5" />
        <span className="hidden sm:inline">New Task</span>
      </Button>
      <Button
        onClick={onImport}
        variant="ghost"
        size="sm"
        className="p-2"
      >
        <Upload className="w-4 h-4" />
      </Button>
      <Button
        onClick={onExport}
        variant="ghost"
        size="sm"
        className="p-2"
      >
        <Download className="w-4 h-4" />
      </Button>
    </div>
  );
}