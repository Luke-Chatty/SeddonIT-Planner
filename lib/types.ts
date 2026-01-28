export type TaskStatus = 'not-started' | 'in-progress' | 'completed' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  title: string;
  description: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  status: TaskStatus;
  priority: TaskPriority;
  dependencies: string[]; // Task IDs
  assignedTo?: string;
  documentation?: string; // Markdown
  scopeOfWorks?: string; // HTML content from WYSIWYG editor
  designInformation?: string; // HTML content from WYSIWYG editor
  order: number; // Order for hierarchical numbering (1.0, 1.1, 1.2, etc.)
  parentId?: string; // Optional parent task ID for hierarchical structure
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  date: string; // ISO date string
  description?: string;
}

export interface InfrastructurePlan {
  id: string;
  name: string;
  description?: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  tasks: Task[];
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
}

export interface PlansCollection {
  plans: InfrastructurePlan[];
  activePlanId: string | null;
  createdAt: string;
  updatedAt: string;
}