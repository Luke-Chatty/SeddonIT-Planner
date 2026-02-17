import { describe, expect, test } from 'vitest';
import {
  formatDate,
  formatDateShort,
  getTaskNumber,
  getTaskDuration,
  getStatusColor,
  getPriorityColor,
  cn,
} from '@/lib/utils';
import type { Task } from '@/lib/types';

describe('formatDate', () => {
  test('formats ISO date string', () => {
    expect(formatDate('2026-01-15T00:00:00.000Z')).toBe('Jan 15, 2026');
  });
  test('returns empty string for invalid date', () => {
    expect(formatDate('not-a-date')).toBe('');
  });
});

describe('formatDateShort', () => {
  test('formats ISO date string short', () => {
    expect(formatDateShort('2026-06-01T00:00:00.000Z')).toBe('Jun 01');
  });
});

describe('getTaskNumber', () => {
  test('returns sequential number for top-level tasks', () => {
    const tasks: Task[] = [
      { id: 'a', title: 'A', startDate: '', endDate: '', status: 'not-started', priority: 'medium', order: 1 } as Task,
      { id: 'b', title: 'B', startDate: '', endDate: '', status: 'not-started', priority: 'medium', order: 2 } as Task,
    ];
    expect(getTaskNumber(tasks[0], tasks)).toBe('1');
    expect(getTaskNumber(tasks[1], tasks)).toBe('2');
  });
  test('returns hierarchical numbers for child tasks', () => {
    const tasks: Task[] = [
      { id: 'a', title: 'Parent A', startDate: '', endDate: '', status: 'not-started', priority: 'medium', order: 1 } as Task,
      { id: 'b', title: 'Child A1', startDate: '', endDate: '', status: 'not-started', priority: 'medium', order: 2, parentId: 'a' } as Task,
      { id: 'c', title: 'Child A2', startDate: '', endDate: '', status: 'not-started', priority: 'medium', order: 3, parentId: 'a' } as Task,
      { id: 'd', title: 'Parent B', startDate: '', endDate: '', status: 'not-started', priority: 'medium', order: 4 } as Task,
    ];
    expect(getTaskNumber(tasks[0], tasks)).toBe('1');
    expect(getTaskNumber(tasks[1], tasks)).toBe('1.1');
    expect(getTaskNumber(tasks[2], tasks)).toBe('1.2');
    expect(getTaskNumber(tasks[3], tasks)).toBe('2');
  });
  test('returns empty string when task not in list', () => {
    const tasks: Task[] = [
      { id: 'a', title: 'A', startDate: '', endDate: '', status: 'not-started', priority: 'medium', order: 1 } as Task,
    ];
    const notInList = { id: 'x', title: 'X', startDate: '', endDate: '', status: 'not-started', priority: 'medium' } as Task;
    expect(getTaskNumber(notInList, tasks)).toBe('');
  });
});

describe('getTaskDuration', () => {
  test('returns day count inclusive', () => {
    const task = {
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-01-05T00:00:00.000Z',
    } as Task;
    expect(getTaskDuration(task)).toBe(5);
  });
});

describe('getStatusColor', () => {
  test('returns class string for known statuses', () => {
    expect(getStatusColor('not-started')).toContain('gray');
    expect(getStatusColor('in-progress')).toContain('blue');
    expect(getStatusColor('completed')).toContain('green');
    expect(getStatusColor('blocked')).toContain('red');
  });
});

describe('getPriorityColor', () => {
  test('returns class string for known priorities', () => {
    expect(getPriorityColor('low')).toContain('gray');
    expect(getPriorityColor('high')).toContain('orange');
    expect(getPriorityColor('critical')).toContain('red');
  });
});

describe('cn', () => {
  test('joins class names and filters falsy', () => {
    expect(cn('a', 'b')).toBe('a b');
    expect(cn('a', undefined, 'b', null, false)).toBe('a b');
  });
});
