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
  FileText,
  List,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { AppHeader } from '@/components/AppHeader';
import { SharePlanModal } from '@/components/SharePlanModal';
import { exportPlanToFile, importPlanFromFile, exportGanttAsImage, exportGanttAsPDF } from '@/lib/storage';
import { Task } from '@/lib/types';


type PanelView = 'viewer' | 'editor' | 'details';

export default function PlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.planId as string;

  const { plan, planRole, loadPlan, setPlan, isLoading } = usePlanStore();
  const { getPlan } = usePlansStore();
  const canEdit = planRole === 'OWNER' || planRole === 'EDITOR';
  const canShare = planRole === 'OWNER';
  const [docPanelView, setDocPanelView] = useState<PanelView>('details');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
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
        toast.error('Gantt chart not found. Switch to Gantt or Split view first.');
        return;
      }

      await exportGanttAsImage('gantt-chart-container', `${plan?.name || 'plan'}-gantt.png`);
      setIsExportMenuOpen(false);
      toast.success('Image exported');
    } catch (error) {
      toast.error('Error exporting image: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleExportPDF = async () => {
    try {
      const ganttContainer = document.getElementById('gantt-chart-container');
      if (!ganttContainer) {
        toast.error('Gantt chart not found. Switch to Gantt or Split view first.');
        return;
      }

      await exportGanttAsPDF('gantt-chart-container', plan?.name || 'Infrastructure Plan', `${plan?.name || 'plan'}-gantt.pdf`);
      setIsExportMenuOpen(false);
      toast.success('PDF exported');
    } catch (error) {
      toast.error('Error exporting PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
      toast.success('Plan imported successfully');
    } catch (error) {
      toast.error('Error importing plan: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleUpdatePlanInfo = () => {
    if (plan) {
      setPlan({
        ...plan,
        name: planName,
        description: planDescription,
      });
      toast.success('Plan information updated');
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
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-[#001524] dark:via-[#022943]/20 dark:to-[#001524]">
        <div className="text-center">
          {isLoading ? (
            <>
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">Loading infrastructure plan...</p>
            </>
          ) : (
            <>
              <p className="text-lg font-medium text-foreground mb-2">Plan not found or access denied</p>
              <p className="text-muted-foreground mb-4">This plan does not exist or you don’t have permission to view it.</p>
              <Button variant="primary" onClick={() => router.push('/')}>
                Back to My Plans
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-[#001524] dark:via-[#022943]/20 dark:to-[#001524] text-foreground overflow-hidden relative">
      <div className="fixed inset-0 -z-10 bg-[url('/grain.png')] opacity-[0.03] pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#022943]/5 dark:bg-blue-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      <AppHeader
        backHref="/"
        title={plan.name}
        subtitle={plan.description ?? undefined}
        showLogo={false}
      >
        {canShare && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShareModalOpen(true)}
            className="gap-1.5"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        )}
        <QuickActions
          canEdit={canEdit}
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
              className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#022943] backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2"
              role="menu"
              aria-label="Export options"
            >
              <button
                onClick={handleExportJSON}
                className="w-full text-left px-4 py-3 text-sm font-medium text-[#022943] dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-150 flex items-center gap-2"
                role="menuitem"
              >
                <Download className="w-4 h-4 text-[#022943] dark:text-[#4ebec7]" />
                Export as JSON
              </button>
              <button
                onClick={handleExportImage}
                className="w-full text-left px-4 py-3 text-sm font-medium text-[#022943] dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-150 flex items-center gap-2 border-t border-slate-200 dark:border-white/10"
                role="menuitem"
              >
                <Download className="w-4 h-4 text-[#804097]" />
                Export Gantt as Image
              </button>
              <button
                onClick={handleExportPDF}
                className="w-full text-left px-4 py-3 text-sm font-medium text-[#022943] dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-150 flex items-center gap-2 border-t border-slate-200 dark:border-white/10"
                role="menuitem"
              >
                <Download className="w-4 h-4 text-[#ed1c24]" />
                Export Gantt as PDF
              </button>
            </div>
          )}
        </div>
      </AppHeader>

      <SharePlanModal
        planId={shareModalOpen ? planId : null}
        onClose={() => setShareModalOpen(false)}
      />

      {/* Stats Dashboard */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#022943]/80 backdrop-blur-xl shadow-sm">
        <PlanOverview />
      </div>

      {/* Main Content Area - Two Column Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Task List */}
        <div
          className={`
            flex-shrink-0 transition-all duration-300 ease-in-out border-r border-slate-200 dark:border-white/10
            ${leftSidebarOpen ? 'w-[400px]' : 'w-0 overflow-hidden'}
            bg-white/95 dark:bg-[#022943]/95 backdrop-blur-xl
          `}
        >
          {leftSidebarOpen && (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-[#022943] dark:text-white flex items-center gap-2">
                    <List className="w-5 h-5 text-[#022943] dark:text-[#4ebec7]" />
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
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/95 dark:bg-[#022943]/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-r-xl shadow-lg hover:bg-white dark:hover:bg-[#022943] transition-colors"
            aria-label="Open task list"
          >
            <ChevronRight className="w-4 h-4 text-[#022943] dark:text-slate-300" />
          </button>
        )}

        {/* Center - Gantt Chart (Primary Focus) */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="h-full p-4">
            <div className="h-full border border-slate-200 dark:border-white/10 rounded-[20px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.2)] bg-white dark:bg-[#022943]">
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

      {/* Import Modal (only reachable when canEdit) */}
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
          {canEdit && (
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
          )}
        </div>
      </Modal>
    </div>
  );
}