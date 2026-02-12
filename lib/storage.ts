import { InfrastructurePlan, Task, Milestone, PlansCollection } from './types';

const STORAGE_KEY = 'infrastructure-plans';
const PLAN_FILE_NAME = 'infrastructure-plan.json';

export function generatePlanId(): string {
  return `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function loadPlansFromStorage(): PlansCollection {
  if (typeof window === 'undefined') {
    return {
      plans: [],
      activePlanId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const collection = JSON.parse(stored) as PlansCollection;
      // Ensure all plans have IDs
      const plansWithIds = collection.plans.map(plan => ({
        ...plan,
        id: plan.id || generatePlanId(),
      }));
      return {
        ...collection,
        plans: plansWithIds,
      };
    }
  } catch (error) {
    console.error('Error loading plans from localStorage:', error);
  }
  
  return {
    plans: [],
    activePlanId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function savePlansToStorage(collection: PlansCollection): void {
  if (typeof window === 'undefined') return;
  
  try {
    const updated = {
      ...collection,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving plans to localStorage:', error);
  }
}

export function loadPlanFromStorage(planId: string): InfrastructurePlan | null {
  const collection = loadPlansFromStorage();
  return collection.plans.find(p => p.id === planId) || null;
}

export function savePlanToStorage(plan: InfrastructurePlan): void {
  const collection = loadPlansFromStorage();
  const existingIndex = collection.plans.findIndex(p => p.id === plan.id);
  
  const updatedPlan = {
    ...plan,
    updatedAt: new Date().toISOString(),
  };
  
  if (existingIndex >= 0) {
    collection.plans[existingIndex] = updatedPlan;
  } else {
    collection.plans.push(updatedPlan);
  }
  
  if (!collection.activePlanId) {
    collection.activePlanId = plan.id;
  }
  
  savePlansToStorage(collection);
}

export function deletePlanFromStorage(planId: string): void {
  const collection = loadPlansFromStorage();
  collection.plans = collection.plans.filter(p => p.id !== planId);
  
  if (collection.activePlanId === planId) {
    collection.activePlanId = collection.plans.length > 0 ? collection.plans[0].id : null;
  }
  
  savePlansToStorage(collection);
}

export function exportPlanToFile(plan: InfrastructurePlan): void {
  const dataStr = JSON.stringify(plan, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${plan.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function importPlanFromFile(file: File): Promise<InfrastructurePlan> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const raw = JSON.parse(content) as Record<string, unknown>;
        if (!raw || typeof raw !== 'object') throw new Error('Invalid plan file format');
        const name = typeof raw.name === 'string' ? raw.name.trim() : '';
        const startDate = raw.startDate;
        const endDate = raw.endDate;
        if (!name) throw new Error('Plan must have a name');
        if (!startDate || !endDate) throw new Error('Plan must have startDate and endDate');
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
          throw new Error('startDate and endDate must be valid dates');
        }
        const tasks = Array.isArray(raw.tasks) ? raw.tasks : [];
        const milestones = Array.isArray(raw.milestones) ? raw.milestones : [];
        const plan: InfrastructurePlan = {
          id: typeof raw.id === 'string' ? raw.id : generatePlanId(),
          name,
          description: typeof raw.description === 'string' ? raw.description : undefined,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          tasks: tasks as Task[],
          milestones: milestones as Milestone[],
          createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
          updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
        };
        resolve(plan);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function generateTaskId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getNextTaskOrder(tasks: Task[]): number {
  if (tasks.length === 0) return 1;
  const maxOrder = Math.max(...tasks.map(t => t.order ?? 0));
  return maxOrder + 1;
}

export function generateMilestoneId(): string {
  return `milestone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Legacy support - migrate old single plan to new multi-plan structure
export function migrateLegacyPlan(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const oldKey = 'infrastructure-plan';
    const oldPlan = localStorage.getItem(oldKey);
    
    if (oldPlan) {
      const plan = JSON.parse(oldPlan) as InfrastructurePlan;
      if (plan && !plan.id) {
        // Check if we already have plans (migration already done)
        const existingCollection = loadPlansFromStorage();
        if (existingCollection.plans.length > 0) {
          // Migration already done, just remove old key
          localStorage.removeItem(oldKey);
          return;
        }
        
        // Add ID to old plan
        const planWithId: InfrastructurePlan = {
          ...plan,
          id: generatePlanId(),
        };
        
        // Save to new structure
        const collection: PlansCollection = {
          plans: [planWithId],
          activePlanId: planWithId.id,
          createdAt: plan.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        savePlansToStorage(collection);
        
        // Remove old key
        localStorage.removeItem(oldKey);
      }
    }
  } catch (error) {
    console.error('Error migrating legacy plan:', error);
  }
}

export async function exportGanttAsImage(elementId: string, filename: string = 'gantt-chart.png'): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    const html2canvas = (await import('html2canvas')).default;
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    const canvas = await html2canvas(element, {
      backgroundColor: document.documentElement.classList.contains('dark') ? '#0a0a0a' : '#ffffff',
      scale: 2,
      logging: false,
    });

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  } catch (error) {
    console.error('Error exporting image:', error);
    throw error;
  }
}

export async function exportGanttAsPDF(elementId: string, planName: string, filename: string = 'infrastructure-plan.pdf'): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).jsPDF;
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    const canvas = await html2canvas(element, {
      backgroundColor: document.documentElement.classList.contains('dark') ? '#0a0a0a' : '#ffffff',
      scale: 2,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const imgWidth = 297; // A4 width in mm (landscape)
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.setFontSize(16);
    pdf.text(planName, 14, 20);
    pdf.addImage(imgData, 'PNG', 0, 30, imgWidth, imgHeight);
    
    pdf.save(filename);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw error;
  }
}