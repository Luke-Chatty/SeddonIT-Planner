'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
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
  Moon,
  Sun,
  Layout,
  LogOut,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { exportPlanToFile, importPlanFromFile } from '@/lib/storage';
import { InfrastructurePlan } from '@/lib/types';

export default function PlansPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { collection, loadPlans, addPlan, deletePlan, updatePlan, setActivePlan } = usePlansStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<InfrastructurePlan | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
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

  const handleCreatePlan = async () => {
    if (!formData.name.trim() || !formData.startDate || !formData.endDate) {
      alert('Please fill in all required fields');
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
      alert('Please fill in all required fields');
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
    if (confirm(`Are you sure you want to delete "${planName}"? This action cannot be undone.`)) {
      deletePlan(planId);
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
      alert('Plan imported successfully!');
    } catch (error) {
      alert('Error importing plan: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Background Decoration */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/50 via-background to-background dark:from-blue-900/20 dark:via-background dark:to-background pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Layout className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 dark:to-blue-400">
                Seddon IT Plans
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
              className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Plan
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <span className="text-sm text-muted-foreground hidden sm:inline truncate max-w-[120px]">
              {session?.user?.email ?? session?.user?.name ?? ''}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-9 h-9 p-0 rounded-full"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight mb-2">My Plans</h2>
          <p className="text-muted-foreground text-lg">
            Manage and track your infrastructure milestones.
          </p>
        </div>

        {collection.plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center rounded-3xl border border-dashed border-border bg-card/50">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-in slide-in-from-bottom-4">
              <Calendar className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">
              No plans yet
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              Create your first infrastructure plan to get started with planning and visualization.
            </p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              variant="primary"
              size="lg"
              className="shadow-xl shadow-primary/20"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Plan
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collection.plans.map((plan, index) => {
              const taskCount = plan.tasks.length;
              const completedCount = plan.tasks.filter(t => t.status === 'completed').length;
              const completionRate = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

              return (
                <div
                  key={plan.id}
                  className="group relative bg-card text-card-foreground rounded-2xl border border-border/50 p-6 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 hover:-translate-y-1"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="text-xl font-bold mb-1 truncate group-hover:text-primary transition-colors">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                        {plan.description || "No description provided."}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPlan(plan)}
                        className="h-8 w-8 p-0 hover:text-primary hover:bg-primary/10"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePlan(plan.id, plan.name)}
                        className="h-8 w-8 p-0 hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-secondary h-2 rounded-full mb-4 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Tasks
                      </span>
                      <span className="font-medium">{taskCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Completed
                      </span>
                      <span className="font-medium">{completionRate}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        Timeline
                      </span>
                      <span className="font-medium text-xs">
                        {formatDate(plan.startDate)} - {formatDate(plan.endDate)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <Button
                      onClick={() => handleOpenPlan(plan.id)}
                      variant="primary"
                      className="flex-1 shadow-lg shadow-primary/20"
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
    </div>
  );
}