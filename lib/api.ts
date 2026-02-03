import type { InfrastructurePlan, PlansCollection } from './types';

let useDatabase = false;

export function setUseDatabase(value: boolean): void {
  useDatabase = value;
}

export function getUseDatabase(): boolean {
  return useDatabase;
}

export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    return data.database === true;
  } catch {
    return false;
  }
}

export async function fetchPlans(): Promise<PlansCollection> {
  const res = await fetch('/api/plans');
  if (!res.ok) throw new Error('Failed to load plans');
  return res.json();
}

export async function createPlan(
  plan: Omit<InfrastructurePlan, 'id' | 'createdAt' | 'updatedAt'>
): Promise<InfrastructurePlan> {
  const res = await fetch('/api/plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(plan),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create plan');
  }
  return res.json();
}

export async function fetchPlan(planId: string): Promise<InfrastructurePlan | null> {
  const res = await fetch(`/api/plans/${planId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to load plan');
  return res.json();
}

export async function updatePlan(plan: InfrastructurePlan): Promise<InfrastructurePlan> {
  const res = await fetch(`/api/plans/${plan.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(plan),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update plan');
  }
  return res.json();
}

export async function deletePlanApi(planId: string): Promise<void> {
  const res = await fetch(`/api/plans/${planId}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error('Failed to delete plan');
}
