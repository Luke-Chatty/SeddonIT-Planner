import { describe, expect, test, vi, beforeEach } from 'vitest';
import { usePlansStore } from '@/lib/plansStore';

vi.mock('@/lib/api', () => ({
  getUseDatabase: () => false,
  setUseDatabase: () => {},
  isDatabaseAvailable: () => Promise.resolve(false),
  fetchPlans: () => Promise.resolve({ plans: [], activePlanId: null, updatedAt: new Date().toISOString() }),
  createPlan: () => Promise.resolve({}),
  fetchPlan: () => Promise.resolve(null),
  updatePlan: () => Promise.resolve(),
  deletePlanApi: () => Promise.resolve(),
}));

vi.mock('@/lib/storage', () => ({
  loadPlansFromStorage: () => ({
    plans: [],
    activePlanId: null,
    updatedAt: new Date().toISOString(),
  }),
  savePlansToStorage: () => {},
  deletePlanFromStorage: () => {},
}));

describe('plansStore', () => {
  beforeEach(() => {
    usePlansStore.setState({
      collection: {
        plans: [],
        activePlanId: null,
        updatedAt: new Date().toISOString(),
      },
    });
  });

  test('addPlan returns a non-empty string id when using local storage', async () => {
    const id = await usePlansStore.getState().addPlan({
      name: 'Test Plan',
      description: 'Desc',
      startDate: new Date(2026, 0, 1).toISOString(),
      endDate: new Date(2026, 11, 31).toISOString(),
      tasks: [],
      milestones: [],
    });
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
    expect(usePlansStore.getState().collection?.plans).toHaveLength(1);
    expect(usePlansStore.getState().collection?.plans[0].name).toBe('Test Plan');
  });

  test('updatePlan updates plan in collection', async () => {
    const { addPlan, updatePlan } = usePlansStore.getState();
    const id = await addPlan({
      name: 'Original',
      startDate: new Date(2026, 0, 1).toISOString(),
      endDate: new Date(2026, 11, 31).toISOString(),
      tasks: [],
      milestones: [],
    });
    updatePlan(id, { name: 'Updated' });
    const plan = usePlansStore.getState().collection?.plans.find((p) => p.id === id);
    expect(plan?.name).toBe('Updated');
  });
});
