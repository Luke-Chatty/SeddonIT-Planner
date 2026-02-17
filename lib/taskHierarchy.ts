import type { Task } from '@/lib/types';

const ROOT_ID = '__root__';

export type TaskRollup = {
  totalDescendants: number;
  completedDescendants: number;
  percentComplete: number;
};

export type TaskHierarchyNode = {
  task: Task;
  children: TaskHierarchyNode[];
};

export type FlattenedTaskRow = {
  task: Task;
  depth: number;
  hasChildren: boolean;
  isCollapsed: boolean;
  rollup: TaskRollup;
};

export type TaskHierarchy = {
  roots: TaskHierarchyNode[];
  nodeById: Map<string, TaskHierarchyNode>;
  depthById: Map<string, number>;
  descendantsById: Map<string, string[]>;
  rollupById: Map<string, TaskRollup>;
  parentById: Map<string, string | null>;
};

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const byOrder = (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);
    if (byOrder !== 0) return byOrder;
    const byCreated = a.createdAt.localeCompare(b.createdAt);
    if (byCreated !== 0) return byCreated;
    return a.id.localeCompare(b.id);
  });
}

function resolveParentId(task: Task, byId: Map<string, Task>): string | null {
  const rawParentId = task.parentId ?? null;
  if (!rawParentId) return null;
  if (!byId.has(rawParentId)) return null;
  if (rawParentId === task.id) return null;

  // Break cycles by forcing cyclical links to root.
  const seen = new Set<string>([task.id]);
  let cursor: string | null = rawParentId;
  while (cursor) {
    if (seen.has(cursor)) return null;
    seen.add(cursor);
    const parentTask = byId.get(cursor);
    const nextParentId: string | null = parentTask?.parentId ?? null;
    cursor = nextParentId;
  }

  return rawParentId;
}

export function buildTaskHierarchy(tasks: Task[]): TaskHierarchy {
  const sorted = sortTasks(tasks);
  const byId = new Map(sorted.map((task) => [task.id, task]));
  const parentById = new Map<string, string | null>();
  const childTasksByParent = new Map<string, Task[]>();
  childTasksByParent.set(ROOT_ID, []);

  for (const task of sorted) {
    const parentId = resolveParentId(task, byId);
    parentById.set(task.id, parentId);
    const parentKey = parentId ?? ROOT_ID;
    const siblings = childTasksByParent.get(parentKey) ?? [];
    siblings.push(task);
    childTasksByParent.set(parentKey, siblings);
  }

  const nodeById = new Map<string, TaskHierarchyNode>();

  const buildNode = (task: Task, ancestry: Set<string>): TaskHierarchyNode => {
    const cached = nodeById.get(task.id);
    if (cached) return cached;

    const nextAncestry = new Set(ancestry);
    nextAncestry.add(task.id);
    const childTasks = (childTasksByParent.get(task.id) ?? []).filter((child) => !nextAncestry.has(child.id));
    const node: TaskHierarchyNode = {
      task,
      children: childTasks.map((child) => buildNode(child, nextAncestry)),
    };
    nodeById.set(task.id, node);
    return node;
  };

  const roots = (childTasksByParent.get(ROOT_ID) ?? []).map((task) => buildNode(task, new Set<string>()));

  const depthById = new Map<string, number>();
  const descendantsById = new Map<string, string[]>();
  const rollupById = new Map<string, TaskRollup>();

  const visit = (node: TaskHierarchyNode, depth: number): { descendants: string[]; total: number; completed: number } => {
    depthById.set(node.task.id, depth);
    const descendants: string[] = [];
    let total = 0;
    let completed = 0;

    for (const child of node.children) {
      const childResult = visit(child, depth + 1);
      descendants.push(child.task.id, ...childResult.descendants);
      total += 1 + childResult.total;
      if (child.task.status === 'completed') completed += 1;
      completed += childResult.completed;
    }

    descendantsById.set(node.task.id, descendants);
    rollupById.set(node.task.id, {
      totalDescendants: total,
      completedDescendants: completed,
      percentComplete: total > 0 ? Math.round((completed / total) * 100) : 0,
    });

    return { descendants, total, completed };
  };

  for (const root of roots) visit(root, 0);

  return {
    roots,
    nodeById,
    depthById,
    descendantsById,
    rollupById,
    parentById,
  };
}

export function buildTaskNumberMap(tasks: Task[]): Map<string, string> {
  const hierarchy = buildTaskHierarchy(tasks);
  const numberById = new Map<string, string>();

  const numberNode = (node: TaskHierarchyNode, prefix: string): void => {
    numberById.set(node.task.id, prefix);
    node.children.forEach((child, index) => {
      numberNode(child, `${prefix}.${index + 1}`);
    });
  };

  hierarchy.roots.forEach((root, index) => {
    numberNode(root, `${index + 1}`);
  });

  return numberById;
}

export function getTaskNumberById(taskId: string, tasks: Task[]): string {
  return buildTaskNumberMap(tasks).get(taskId) ?? '';
}

export function getTaskAndAncestorIds(tasks: Task[], taskIds: Set<string>): Set<string> {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const included = new Set(taskIds);

  for (const id of taskIds) {
    let current = byId.get(id);
    const visited = new Set<string>();
    while (current?.parentId) {
      const parentId = current.parentId;
      if (!byId.has(parentId)) break;
      if (visited.has(parentId)) break;
      if (parentId === current.id) break;
      visited.add(parentId);
      included.add(parentId);
      current = byId.get(parentId);
    }
  }

  return included;
}

type FlattenOptions = {
  collapsedTaskIds?: Set<string>;
  includeTaskIds?: Set<string>;
  ignoreCollapse?: boolean;
};

export function flattenTaskHierarchy(tasks: Task[], options?: FlattenOptions): FlattenedTaskRow[] {
  const hierarchy = buildTaskHierarchy(tasks);
  const collapsedTaskIds = options?.collapsedTaskIds ?? new Set<string>();
  const includeTaskIds = options?.includeTaskIds;
  const ignoreCollapse = options?.ignoreCollapse ?? false;
  const rows: FlattenedTaskRow[] = [];

  const visit = (node: TaskHierarchyNode, depth: number) => {
    if (includeTaskIds && !includeTaskIds.has(node.task.id)) return;
    const hasChildren = node.children.length > 0;
    const isCollapsed = hasChildren && !ignoreCollapse && collapsedTaskIds.has(node.task.id);
    rows.push({
      task: node.task,
      depth,
      hasChildren,
      isCollapsed,
      rollup: hierarchy.rollupById.get(node.task.id) ?? {
        totalDescendants: 0,
        completedDescendants: 0,
        percentComplete: 0,
      },
    });
    if (isCollapsed) return;
    node.children.forEach((child) => visit(child, depth + 1));
  };

  hierarchy.roots.forEach((root) => visit(root, 0));
  return rows;
}

export function getDescendantIds(taskId: string, tasks: Task[]): string[] {
  return buildTaskHierarchy(tasks).descendantsById.get(taskId) ?? [];
}
