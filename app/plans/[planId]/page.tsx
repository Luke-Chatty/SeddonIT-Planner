'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePlanStore } from '@/lib/store';
import { usePlansStore } from '@/lib/plansStore';
import { GanttChart } from '@/components/GanttChart/GanttChart';
import { TaskList } from '@/components/TaskManager/TaskList';
import { DocPanel } from '@/components/Documentation/DocPanel';
import { DocEditor } from '@/components/Documentation/DocEditor';
import { TaskDetailsEditor } from '@/components/Documentation/TaskDetailsEditor';
import { PlanOverview } from '@/components/Dashboard/PlanOverview';
import { QuickActions } from '@/components/Dashboard/QuickActions';
import { TaskForm } from '@/components/TaskManager/TaskForm';
import { Button } from '@/components/UI/Button';
import { Modal } from '@/components/UI/Modal';
import { Input } from '@/components/UI/Input';
import { Textarea } from '@/components/UI/Textarea';
import {
  Download,
  Upload,
  Moon,
  Sun,
  FileText,
  Calendar,
  List,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { exportPlanToFile, importPlanFromFile, exportGanttAsImage, exportGanttAsPDF } from '@/lib/storage';
import { Task } from '@/lib/types';


type PanelView = 'viewer' | 'editor' | 'details';

export default function PlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.planId as string;

  const { plan, loadPlan, setPlan } = usePlanStore();
  const { getPlan } = usePlansStore();
  const [docPanelView, setDocPanelView] = useState<PanelView>('details');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && planId) {
      loadPlan(planId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  useEffect(() => {
    if (plan) {
      setPlanName(plan.name);
      setPlanDescription(plan.description || '');
    }
  }, [plan]);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        setIsExportMenuOpen(false);
      }
    };
    if (isExportMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isExportMenuOpen]);

  const handleExportJSON = () => {
    if (plan) {
      exportPlanToFile(plan);
      setIsExportMenuOpen(false);
    }
  };

  const handleExportImage = async () => {
    try {
      const ganttContainer = document.getElementById('gantt-chart-container');
      if (!ganttContainer) {
        alert('Gantt chart not found. Please switch to Gantt or Split view first.');
        return;
      }

      await exportGanttAsImage('gantt-chart-container', `${plan?.name || 'plan'}-gantt.png`);
      setIsExportMenuOpen(false);
    } catch (error) {
      alert('Error exporting image: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleExportPDF = async () => {
    try {
      const ganttContainer = document.getElementById('gantt-chart-container');
      if (!ganttContainer) {
        alert('Gantt chart not found. Please switch to Gantt or Split view first.');
        return;
      }

      await exportGanttAsPDF('gantt-chart-container', plan?.name || 'Infrastructure Plan', `${plan?.name || 'plan'}-gantt.pdf`);
      setIsExportMenuOpen(false);
    } catch (error) {
      alert('Error exporting PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedPlan = await importPlanFromFile(file);
      setPlan({
        ...importedPlan,
        id: planId, // Preserve the current plan ID
      });
      setIsImportModalOpen(false);
      alert('Plan imported successfully!');
    } catch (error) {
      alert('Error importing plan: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleUpdatePlanInfo = () => {
    if (plan) {
      setPlan({
        ...plan,
        name: planName,
        description: planDescription,
      });
      alert('Plan information updated!');
    }
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setIsTaskFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  };

  if (!plan) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading infrastructure plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden relative">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/50 via-background to-background dark:from-blue-900/20 dark:via-background dark:to-background pointer-events-none" />

      {/* Compact Top Bar */}
      <header className="flex-shrink-0 glass border-b border-border/40 px-6 py-3 shadow-sm z-10">
        <div className="flex items-center justify-between">
          {/* Left: Plan Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 dark:to-blue-400 bg-clip-text text-transparent truncate">
                {plan.name}
              </h1>
              {plan.description && (
                <p className="text-xs text-muted-foreground truncate max-w-md">
                  {plan.description}
                </p>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <QuickActions
              onAddTask={handleAddTask}
              onExport={() => setIsExportMenuOpen(!isExportMenuOpen)}
              onImport={() => setIsImportModalOpen(true)}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/plans/${planId}/documentation`)}
              className="hidden sm:flex"
            >
              <FileText className="w-4 h-4 mr-2" />
              Docs
            </Button>
            <div className="relative">
              {isExportMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-popover/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2"
                  role="menu"
                  aria-label="Export options"
                >
                  <button
                    onClick={handleExportJSON}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-all duration-150 flex items-center gap-2"
                    role="menuitem"
                  >
                    <Download className="w-4 h-4 text-primary" />
                    Export as JSON
                  </button>
                  <button
                    onClick={handleExportImage}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-all duration-150 flex items-center gap-2 border-t border-border"
                    role="menuitem"
                  >
                    <Download className="w-4 h-4 text-purple-500" />
                    Export Gantt as Image
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-all duration-150 flex items-center gap-2 border-t border-border"
                    role="menuitem"
                  >
                    <Download className="w-4 h-4 text-destructive" />
                    Export Gantt as PDF
                  </button>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDarkMode(!isDarkMode)}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 h-9 w-9 rounded-full"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Stats Dashboard */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border/40 bg-card/40 backdrop-blur-sm">
        <PlanOverview />
      </div>

      {/* Main Content Area - Two Column Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Task List */}
        <div
          className={`
            flex-shrink-0 transition-all duration-300 ease-in-out border-r border-gray-200/60 dark:border-gray-800/60
            ${leftSidebarOpen ? 'w-[400px]' : 'w-0 overflow-hidden'}
            bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl
          `}
        >
          {leftSidebarOpen && (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-200/60 dark:border-gray-800/60">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <List className="w-5 h-5 text-blue-500" />
                    Tasks
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs px-2 py-1"
                    onClick={() => router.push(`/plans/${planId}/tasks`)}
                  >
                    Manage Tasks
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLeftSidebarOpen(false)}
                  className="p-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
                <TaskList onEditTask={(task) => router.push(`/plans/${planId}/tasks/${task.id}`)} />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Toggle Button */}
        {!leftSidebarOpen && (
          <button
            onClick={() => setLeftSidebarOpen(true)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/60 dark:border-gray-800/60 rounded-r-lg shadow-lg hover:bg-white dark:hover:bg-gray-900 transition-colors"
            aria-label="Open task list"
          >
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        )}

        {/* Center - Gantt Chart (Primary Focus) */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="h-full p-4">
            <div className="h-full border border-gray-200/60 dark:border-gray-800/60 rounded-xl overflow-hidden shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
              <GanttChart />
            </div>
          </div>
        </div>
      </main>

      {/* Task Form Modal */}
      <Modal
        isOpen={isTaskFormOpen}
        onClose={() => {
          setIsTaskFormOpen(false);
          setEditingTask(null);
        }}
        title={editingTask ? 'Edit Task' : 'Create New Task'}
        size="full"
      >
        <TaskForm
          task={editingTask}
          onClose={() => {
            setIsTaskFormOpen(false);
            setEditingTask(null);
          }}
          onSave={() => { }}
        />
      </Modal>

      {/* Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Plan"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Select JSON file to import
            </label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors relative">
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Click to select file</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>
          <div className="pt-4 border-t border-border">
            <h3 className="text-sm font-medium text-foreground mb-2">
              Update Plan Information
            </h3>
            <Input
              label="Plan Name"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="mb-3"
            />
            <Textarea
              label="Description"
              value={planDescription}
              onChange={(e) => setPlanDescription(e.target.value)}
              rows={3}
            />
            <div className="mt-4 flex justify-end">
              <Button onClick={handleUpdatePlanInfo} variant="primary">
                Update Plan Info
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}