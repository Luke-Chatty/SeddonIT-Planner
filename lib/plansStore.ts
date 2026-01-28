import { create } from 'zustand';
import { PlansCollection, InfrastructurePlan } from './types';
import { 
  loadPlansFromStorage, 
  savePlansToStorage, 
  deletePlanFromStorage,
} from './storage';

function generatePlanId(): string {
  return `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

interface PlansStore {
  collection: PlansCollection | null;
  isLoading: boolean;
  
  // Actions
  loadPlans: () => void;
  savePlans: () => void;
  addPlan: (plan: Omit<InfrastructurePlan, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updatePlan: (planId: string, updates: Partial<InfrastructurePlan>) => void;
  deletePlan: (planId: string) => void;
  setActivePlan: (planId: string | null) => void;
  getActivePlan: () => InfrastructurePlan | null;
  getPlan: (planId: string) => InfrastructurePlan | null;
}

export const usePlansStore = create<PlansStore>((set, get) => ({
  collection: null,
  isLoading: true,

  loadPlans: () => {
    if (typeof window === 'undefined') {
      set({ 
        collection: {
          plans: [],
          activePlanId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        isLoading: false 
      });
      return;
    }
    
    // Migrate legacy single plan if it exists
    if (typeof window !== 'undefined') {
      import('./storage').then(({ migrateLegacyPlan }) => {
        migrateLegacyPlan();
        const collection = loadPlansFromStorage();
        set({ 
          collection,
          isLoading: false 
        });
      });
    }
  },

  savePlans: () => {
    const { collection } = get();
    if (collection) {
      savePlansToStorage(collection);
    }
  },

  addPlan: (planData) => {
    const { collection } = get();
    if (!collection) return '';
    
    const newPlan: InfrastructurePlan = {
      ...planData,
      id: generatePlanId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedCollection = {
      ...collection,
      plans: [...collection.plans, newPlan],
      activePlanId: newPlan.id,
      updatedAt: new Date().toISOString(),
    };

    set({ collection: updatedCollection });
    get().savePlans();
    return newPlan.id;
  },

  updatePlan: (planId, updates) => {
    const { collection } = get();
    if (!collection) return;

    const updatedCollection = {
      ...collection,
      plans: collection.plans.map(plan =>
        plan.id === planId
          ? { ...plan, ...updates, updatedAt: new Date().toISOString() }
          : plan
      ),
      updatedAt: new Date().toISOString(),
    };

    set({ collection: updatedCollection });
    get().savePlans();
  },

  deletePlan: (planId) => {
    const { collection } = get();
    if (!collection) return;

    const updatedCollection = {
      ...collection,
      plans: collection.plans.filter(plan => plan.id !== planId),
      activePlanId: collection.activePlanId === planId 
        ? (collection.plans.length > 1 ? collection.plans.find(p => p.id !== planId)?.id || null : null)
        : collection.activePlanId,
      updatedAt: new Date().toISOString(),
    };

    set({ collection: updatedCollection });
    get().savePlans();
    deletePlanFromStorage(planId);
  },

  setActivePlan: (planId) => {
    const { collection } = get();
    if (!collection) return;

    const updatedCollection = {
      ...collection,
      activePlanId: planId,
      updatedAt: new Date().toISOString(),
    };

    set({ collection: updatedCollection });
    get().savePlans();
  },

  getActivePlan: () => {
    const { collection } = get();
    if (!collection || !collection.activePlanId) return null;
    return collection.plans.find(p => p.id === collection.activePlanId) || null;
  },

  getPlan: (planId) => {
    const { collection } = get();
    if (!collection) return null;
    return collection.plans.find(p => p.id === planId) || null;
  },
}));