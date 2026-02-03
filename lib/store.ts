import { create } from 'zustand';
import { InfrastructurePlan, Task, Milestone } from './types';
import { savePlanToStorage, loadPlanFromStorage, generateTaskId, generateMilestoneId } from './storage';
import { getUseDatabase, fetchPlan, updatePlan as updatePlanApi } from './api';

interface PlanStore {
  plan: InfrastructurePlan | null;
  planId: string | null;
  selectedTaskId: string | null;
  isLoading: boolean;
  
  // Actions
  loadPlan: (planId: string) => void;
  savePlan: () => void;
  setPlan: (plan: InfrastructurePlan) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'> & { order?: number }) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  reorderTasks: (taskIds: string[]) => void;
  addMilestone: (milestone: Omit<Milestone, 'id'>) => void;
  updateMilestone: (id: string, updates: Partial<Milestone>) => void;
  deleteMilestone: (id: string) => void;
  setSelectedTask: (id: string | null) => void;
}

const defaultPlan = (planId: string): InfrastructurePlan => ({
  id: planId,
  name: "IT Infrastructure Plan 2026",
  description: "Comprehensive infrastructure planning for the next year",
  startDate: new Date(2026, 0, 1).toISOString(),
  endDate: new Date(2026, 11, 31, 23, 59, 59).toISOString(),
  tasks: [],
  milestones: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const usePlanStore = create<PlanStore>((set, get) => ({
  plan: null,
  planId: null,
  selectedTaskId: null,
  isLoading: true,

  loadPlan: (planId: string) => {
    if (typeof window === 'undefined') {
      set({
        plan: defaultPlan(planId),
        planId,
        isLoading: false,
      });
      return;
    }

    const normalizePlan = (plan: InfrastructurePlan): InfrastructurePlan => {
      let p = plan;
      if (!p.id) p = { ...p, id: planId };
      if (p.tasks.some((t) => t.order === undefined)) {
        p = {
          ...p,
          tasks: p.tasks.map((task, index) => ({
            ...task,
            order: task.order ?? index + 1,
          })),
        };
      }
      return p;
    };

    if (getUseDatabase()) {
      fetchPlan(planId)
        .then((fetched) => {
          const plan = fetched ? normalizePlan(fetched) : defaultPlan(planId);
          set({ plan, planId, isLoading: false });
        })
        .catch(() => {
          const stored = loadPlanFromStorage(planId);
          const plan = stored ? normalizePlan(stored) : defaultPlan(planId);
          set({ plan, planId, isLoading: false });
        });
      return;
    }

    const stored = loadPlanFromStorage(planId);
    const plan = stored ? normalizePlan(stored) : defaultPlan(planId);
    set({ plan, planId, isLoading: false });
  },

  savePlan: () => {
    const { plan } = get();
    if (!plan) return;

    if (getUseDatabase()) {
      updatePlanApi(plan).catch((err) => console.error('Failed to save plan:', err));
      return;
    }
    savePlanToStorage(plan);
  },

  setPlan: (plan: InfrastructurePlan) => {
    set({ plan, planId: plan.id });
    get().savePlan();
  },

  addTask: (taskData) => {
    const { plan } = get();
    if (!plan) return;

    // Calculate order if not provided
    const maxOrder = plan.tasks.length > 0 
      ? Math.max(...plan.tasks.map(t => t.order ?? 0))
      : 0;
    const order = taskData.order ?? maxOrder + 1;

    const newTask: Task = {
      ...taskData,
      order,
      id: generateTaskId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedPlan = {
      ...plan,
      tasks: [...plan.tasks, newTask],
      updatedAt: new Date().toISOString(),
    };

    set({ plan: updatedPlan });
    get().savePlan();
  },

  updateTask: (id, updates) => {
    const { plan } = get();
    if (!plan) return;

    const updatedPlan = {
      ...plan,
      tasks: plan.tasks.map(task =>
        task.id === id
          ? { ...task, ...updates, updatedAt: new Date().toISOString() }
          : task
      ),
      updatedAt: new Date().toISOString(),
    };

    set({ plan: updatedPlan });
    get().savePlan();
  },

  deleteTask: (id) => {
    const { plan } = get();
    if (!plan) return;

    // Remove task and clean up dependencies
    const updatedPlan = {
      ...plan,
      tasks: plan.tasks
        .filter(task => task.id !== id)
        .map(task => ({
          ...task,
          dependencies: task.dependencies.filter(depId => depId !== id),
        })),
      updatedAt: new Date().toISOString(),
    };

    set({ plan: updatedPlan, selectedTaskId: get().selectedTaskId === id ? null : get().selectedTaskId });
    get().savePlan();
  },

  reorderTasks: (taskIds) => {
    const { plan } = get();
    if (!plan) return;

    // Create a map of task IDs to their new order
    const taskMap = new Map(taskIds.map((id, index) => [id, index + 1]));
    
    const updatedPlan = {
      ...plan,
      tasks: plan.tasks.map(task => ({
        ...task,
        order: taskMap.get(task.id) ?? task.order,
        updatedAt: new Date().toISOString(),
      })),
      updatedAt: new Date().toISOString(),
    };

    set({ plan: updatedPlan });
    get().savePlan();
  },

  addMilestone: (milestoneData) => {
    const { plan } = get();
    if (!plan) return;

    const newMilestone: Milestone = {
      ...milestoneData,
      id: generateMilestoneId(),
    };

    const updatedPlan = {
      ...plan,
      milestones: [...plan.milestones, newMilestone],
      updatedAt: new Date().toISOString(),
    };

    set({ plan: updatedPlan });
    get().savePlan();
  },

  updateMilestone: (id, updates) => {
    const { plan } = get();
    if (!plan) return;

    const updatedPlan = {
      ...plan,
      milestones: plan.milestones.map(milestone =>
        milestone.id === id ? { ...milestone, ...updates } : milestone
      ),
      updatedAt: new Date().toISOString(),
    };

    set({ plan: updatedPlan });
    get().savePlan();
  },

  deleteMilestone: (id) => {
    const { plan } = get();
    if (!plan) return;

    const updatedPlan = {
      ...plan,
      milestones: plan.milestones.filter(milestone => milestone.id !== id),
      updatedAt: new Date().toISOString(),
    };

    set({ plan: updatedPlan });
    get().savePlan();
  },

  setSelectedTask: (id) => {
    set({ selectedTaskId: id });
  },
}));