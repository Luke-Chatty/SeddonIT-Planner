import { create } from 'zustand';
import { PlansCollection, InfrastructurePlan } from './types';
import {
  loadPlansFromStorage,
  savePlansToStorage,
  deletePlanFromStorage,
} from './storage';
import {
  isDatabaseAvailable,
  setUseDatabase,
  getUseDatabase,
  fetchPlans,
  createPlan as createPlanApi,
  updatePlan as updatePlanApi,
  deletePlanApi,
} from './api';

function generatePlanId(): string {
  return `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

interface PlansStore {
  collection: PlansCollection | null;
  isLoading: boolean;

  // Actions
  loadPlans: () => Promise<void>;
  savePlans: () => void;
  addPlan: (plan: Omit<InfrastructurePlan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updatePlan: (planId: string, updates: Partial<InfrastructurePlan>) => void;
  deletePlan: (planId: string) => void;
  setActivePlan: (planId: string | null) => void;
  getActivePlan: () => InfrastructurePlan | null;
  getPlan: (planId: string) => InfrastructurePlan | null;
}

export const usePlansStore = create<PlansStore>((set, get) => ({
  collection: null,
  isLoading: true,

  loadPlans: async () => {
    if (typeof window === 'undefined') {
      set({
        collection: {
          plans: [],
          activePlanId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        isLoading: false,
      });
      return;
    }

    const { migrateLegacyPlan } = await import('./storage');
    migrateLegacyPlan();

    const useDb = await isDatabaseAvailable();
    setUseDatabase(useDb);

    if (useDb) {
      try {
        const collection = await fetchPlans();
        set({ collection, isLoading: false });
      } catch (err) {
        console.error('Failed to load plans from database, falling back to local storage:', err);
        setUseDatabase(false);
        const collection = loadPlansFromStorage();
        set({ collection, isLoading: false });
      }
    } else {
      const collection = loadPlansFromStorage();
      set({ collection, isLoading: false });
    }
  },

  savePlans: () => {
    if (getUseDatabase()) return;
    const { collection } = get();
    if (collection) savePlansToStorage(collection);
  },

  addPlan: async (planData) => {
    const { collection } = get();
    if (!collection) return '';

    if (getUseDatabase()) {
      try {
        const newPlan = await createPlanApi(planData);
        const updatedCollection = {
          ...collection,
          plans: [newPlan, ...collection.plans],
          activePlanId: newPlan.id,
          updatedAt: new Date().toISOString(),
        };
        set({ collection: updatedCollection });
        return newPlan.id;
      } catch (err) {
        console.error('Failed to create plan:', err);
        const fallbackId = generatePlanId();
        const newPlan: InfrastructurePlan = {
          ...planData,
          id: fallbackId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set({
          collection: {
            ...collection,
            plans: [...collection.plans, newPlan],
            activePlanId: newPlan.id,
            updatedAt: new Date().toISOString(),
          },
        });
        return fallbackId;
      }
    }

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

    const plan = collection.plans.find((p) => p.id === planId);
    if (!plan) return;

    const updatedPlan = { ...plan, ...updates, updatedAt: new Date().toISOString() };

    if (getUseDatabase()) {
      (async () => {
        try {
          const saved = await updatePlanApi(updatedPlan);
          set({
            collection: {
              ...collection,
              plans: collection.plans.map((p) => (p.id === planId ? saved : p)),
              updatedAt: new Date().toISOString(),
            },
          });
        } catch (err) {
          console.error('Failed to update plan:', err);
          set({
            collection: {
              ...collection,
              plans: collection.plans.map((p) => (p.id === planId ? updatedPlan : p)),
              updatedAt: new Date().toISOString(),
            },
          });
        }
      })();
      return;
    }

    set({
      collection: {
        ...collection,
        plans: collection.plans.map((p) => (p.id === planId ? updatedPlan : p)),
        updatedAt: new Date().toISOString(),
      },
    });
    get().savePlans();
  },

  deletePlan: (planId) => {
    const { collection } = get();
    if (!collection) return;

    if (getUseDatabase()) {
      (async () => {
        try {
          await deletePlanApi(planId);
          const updatedCollection = {
            ...collection,
            plans: collection.plans.filter((p) => p.id !== planId),
            activePlanId:
              collection.activePlanId === planId
                ? collection.plans.find((p) => p.id !== planId)?.id ?? null
                : collection.activePlanId,
            updatedAt: new Date().toISOString(),
          };
          set({ collection: updatedCollection });
        } catch (err) {
          console.error('Failed to delete plan:', err);
        }
      })();
      return;
    }

    const updatedCollection = {
      ...collection,
      plans: collection.plans.filter((p) => p.id !== planId),
      activePlanId:
        collection.activePlanId === planId
          ? (collection.plans.find((p) => p.id !== planId)?.id ?? null)
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
    set({
      collection: {
        ...collection,
        activePlanId: planId,
        updatedAt: new Date().toISOString(),
      },
    });
    if (!getUseDatabase()) get().savePlans();
  },

  getActivePlan: () => {
    const { collection } = get();
    if (!collection || !collection.activePlanId) return null;
    return collection.plans.find((p) => p.id === collection.activePlanId) ?? null;
  },

  getPlan: (planId) => {
    const { collection } = get();
    if (!collection) return null;
    return collection.plans.find((p) => p.id === planId) ?? null;
  },
}));