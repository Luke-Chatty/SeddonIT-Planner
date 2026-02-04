'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePlansStore } from '@/lib/plansStore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/UI/Button';
import { Modal } from '@/components/UI/Modal';
import { Input } from '@/components/UI/Input';
import { Textarea } from '@/components/UI/Textarea';
import {
  Plus,
  Calendar,
  Trash2,
  Edit2,
  ArrowRight,
  Download,
  Upload,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { exportPlanToFile, importPlanFromFile } from '@/lib/storage';
import { InfrastructurePlan, type PlanWithRole } from '@/lib/types';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { AppHeader } from '@/components/AppHeader';
import { SharePlanModal } from '@/components/SharePlanModal';
import { ConfirmModal } from '@/components/UI/ConfirmModal';

export default function PlansPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { collection, loadPlans, addPlan, deletePlan, updatePlan, setActivePlan, storageMode } = usePlansStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [sharePlanId, setSharePlanId] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<InfrastructurePlan | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ planId: string; planName: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadPlans();
    }
  }, [loadPlans]);

  const handleCreatePlan = async () => {
    if (!formData.name.trim() || !formData.startDate || !formData.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const planId = await addPlan({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      tasks: [],
      milestones: [],
    });

    setFormData({ name: '', description: '', startDate: '', endDate: '' });
    setIsCreateModalOpen(false);
    router.push(`/plans/${planId}`);
  };

  const handleEditPlan = (plan: InfrastructurePlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      startDate: plan.startDate.split('T')[0],
      endDate: plan.endDate.split('T')[0],
    });
    setIsEditModalOpen(true);
  };

  const handleUpdatePlan = () => {
    if (!editingPlan || !formData.name.trim() || !formData.startDate || !formData.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    updatePlan(editingPlan.id, {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
    });

    setFormData({ name: '', description: '', startDate: '', endDate: '' });
    setEditingPlan(null);
    setIsEditModalOpen(false);
  };

  const handleDeletePlan = (planId: string, planName: string) => {
    setDeleteConfirm({ planId, planName });
  };

  const handleConfirmDeletePlan = () => {
    if (deleteConfirm) {
      deletePlan(deleteConfirm.planId);
      setDeleteConfirm(null);
      toast.success('Plan deleted');
    }
  };

  const handleOpenPlan = (planId: string) => {
    setActivePlan(planId);
    router.push(`/plans/${planId}`);
  };

  const handleExportPlan = (plan: InfrastructurePlan) => {
    exportPlanToFile(plan);
  };

  const handleImportPlan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedPlan = await importPlanFromFile(file);
      // Ensure plan has an ID
      const planWithId: InfrastructurePlan = {
        ...importedPlan,
        id: importedPlan.id || `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
      addPlan(planWithId);
      setIsImportModalOpen(false);
      toast.success('Plan imported successfully');
    } catch (error) {
      toast.error('Error importing plan: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  if (status === 'loading' || !collection) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">{status === 'loading' ? 'Signing in…' : 'Loading plans...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-[#001524] dark:via-[#022943]/20 dark:to-[#001524] text-foreground transition-colors duration-300">
      {/* Background grain / subtle glow - matches login */}
      <div className="fixed inset-0 -z-10 bg-[url('/grain.png')] opacity-[0.03] pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#022943]/5 dark:bg-blue-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      <AppHeader
        title="Seddon IT Planner"
        showLogo={true}
        brandTitle={true}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsImportModalOpen(true)}
          className="hidden sm:flex"
        >
          <Upload className="w-4 h-4 mr-2" />
          Import
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          className="rounded-xl shadow-lg shadow-[#022943]/20 hover:shadow-[#022943]/30 transition-shadow"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Plan
        </Button>
      </AppHeader>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[#ed1c24] text-3xl font-extrabold">|</span>
            <h2 className="text-3xl font-extrabold text-[#022943] dark:text-white tracking-tight">
              My Plans
            </h2>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Manage and track your infrastructure milestones.
          </p>
          {storageMode === 'local' && (
            <p className="mt-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 inline-block">
              Saved to this device only. Set <code className="text-xs bg-amber-100 dark:bg-amber-900/40 px-1 rounded">DATABASE_URL</code> and run migrations to persist plans across reboots and share with others.{' '}
              <a href="/api/health" target="_blank" rel="noopener noreferrer" className="underline font-medium">Check connection</a>
            </p>
          )}
          {storageMode === 'database' && (
            <p className="mt-2 text-sm text-green-600 dark:text-green-400">
              Plans are saved to the database and persist across devices.
            </p>
          )}
        </div>

        {collection.plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center rounded-[20px] border border-dashed border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#022943]/50 shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
            <div className="w-20 h-20 rounded-full bg-[#022943]/10 dark:bg-[#4ebec7]/20 flex items-center justify-center mb-6 animate-in slide-in-from-bottom-4">
              <Calendar className="w-10 h-10 text-[#022943] dark:text-[#4ebec7]" />
            </div>
            <h2 className="text-2xl font-extrabold text-[#022943] dark:text-white mb-2">
              No plans yet
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md">
              Create your first infrastructure plan to get started with planning and visualization.
            </p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              variant="primary"
              size="lg"
              className="rounded-xl shadow-lg shadow-[#022943]/20 hover:shadow-[#022943]/30 transition-shadow"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Plan
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collection.plans.map((plan, index) => {
              const planWithRole = plan as PlanWithRole;
              // When using localStorage there is no currentUserRole; treat as owner (only user on this device)
              const role = planWithRole.currentUserRole ?? (storageMode === 'local' ? 'OWNER' : undefined);
              const canEdit = role === 'OWNER' || role === 'EDITOR';
              const canDelete = role === 'OWNER';
              const canShare = role === 'OWNER';
              const taskCount = plan.tasks.length;
              const completedCount = plan.tasks.filter(t => t.status === 'completed').length;
              const completionRate = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

              return (
                <div
                  key={plan.id}
                  className="group relative bg-white dark:bg-[#022943] text-[#022943] dark:text-white rounded-[20px] border border-slate-200 dark:border-white/10 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:shadow-[0_24px_60px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_24px_60px_rgba(0,0,0,0.35)] hover:border-[#ed1c24]/20 transition-all duration-300 hover:-translate-y-1"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="text-xl font-bold mb-1 truncate text-[#022943] dark:text-white group-hover:text-[#ed1c24] dark:group-hover:text-[#4ebec7] transition-colors">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 min-h-[2.5rem]">
                        {plan.description || "No description provided."}
                      </p>
                    </div>
                    <div className="flex gap-1 items-center">
                      {canShare && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSharePlanId(plan.id)}
                          className="h-8 px-2 rounded-xl hover:text-[#ed1c24] dark:hover:text-[#4ebec7] hover:bg-[#ed1c24]/10 dark:hover:bg-[#4ebec7]/10 gap-1.5"
                          title="Share this plan with others"
                        >
                          <Share2 className="w-4 h-4" />
                          <span className="text-xs font-medium hidden sm:inline">Share</span>
                        </Button>
                      )}
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPlan(plan)}
                          className="h-8 w-8 p-0 rounded-xl hover:text-[#ed1c24] dark:hover:text-[#4ebec7] hover:bg-[#ed1c24]/10 dark:hover:bg-[#4ebec7]/10"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePlan(plan.id, plan.name)}
                          className="h-8 w-8 p-0 hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full mb-4 overflow-hidden">
                    <div
                      className="bg-[#ed1c24] dark:bg-[#4ebec7] h-full rounded-full transition-all duration-500"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#022943] dark:bg-[#4ebec7]"></span>
                        Tasks
                      </span>
                      <span className="font-medium text-[#022943] dark:text-white">{taskCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#30b996]"></span>
                        Completed
                      </span>
                      <span className="font-medium text-[#022943] dark:text-white">{completionRate}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#804097]"></span>
                        Timeline
                      </span>
                      <span className="font-medium text-[#022943] dark:text-white text-xs">
                        {formatDate(plan.startDate)} - {formatDate(plan.endDate)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
                    <Button
                      onClick={() => handleOpenPlan(plan.id)}
                      variant="primary"
                      className="flex-1 rounded-xl shadow-lg shadow-[#022943]/20 hover:shadow-[#022943]/30 transition-shadow"
                    >
                      Open Plan
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button
                      onClick={() => handleExportPlan(plan)}
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      title="Export Plan"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Plan Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setFormData({ name: '', description: '', startDate: '', endDate: '' });
        }}
        title="Create New Plan"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Plan Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Q4 Engineering Roadmap"
            required
          />
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of this plan..."
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date *"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
            <Input
              label="End Date *"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setIsCreateModalOpen(false);
                setFormData({ name: '', description: '', startDate: '', endDate: '' });
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreatePlan}>
              Create Plan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Plan Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPlan(null);
          setFormData({ name: '', description: '', startDate: '', endDate: '' });
        }}
        title="Edit Plan"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Plan Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date *"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
            <Input
              label="End Date *"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingPlan(null);
                setFormData({ name: '', description: '', startDate: '', endDate: '' });
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdatePlan}>
              Update Plan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Import Plan Modal */}
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
                onChange={handleImportPlan}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </Modal>

      <SharePlanModal planId={sharePlanId} onClose={() => setSharePlanId(null)} />

      <ConfirmModal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleConfirmDeletePlan}
        title="Delete plan?"
        message={deleteConfirm ? `Are you sure you want to delete "${deleteConfirm.planName}"? This action cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}