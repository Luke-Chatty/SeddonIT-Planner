'use client';

import { Button } from '../UI/Button';
import { Plus, Download, Upload } from 'lucide-react';

interface QuickActionsProps {
  onAddTask: () => void;
  onExport: () => void;
  onImport: () => void;
  /** When false, only export is shown (viewer role). Default true. */
  canEdit?: boolean;
}

export function QuickActions({ onAddTask, onExport, onImport, canEdit = true }: QuickActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {canEdit && (
        <>
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
            className="h-9 w-9 p-0 min-w-[2.25rem]"
            title="Import plan"
            aria-label="Import plan"
          >
            <Upload className="w-5 h-5" />
          </Button>
        </>
      )}
      <Button
        onClick={onExport}
        variant="ghost"
        size="sm"
        className="h-9 w-9 p-0 min-w-[2.25rem]"
        title="Export"
        aria-label="Export"
      >
        <Download className="w-5 h-5" />
      </Button>
    </div>
  );
}