import { describe, expect, test } from 'vitest';
import { config } from '@/middleware';

describe('middleware config', () => {
  test('protects routes with matcher', () => {
    expect(config.matcher).toBeDefined();
    expect(Array.isArray(config.matcher)).toBe(true);
    expect(config.matcher).toContain('/');
    expect(config.matcher).toContain('/plans/:path*');
  });
});
