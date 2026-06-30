import { describe, expect, it } from 'vitest';
import { hasModulePermission } from './permissions';
import type { User } from './types';

describe('hasModulePermission', () => {
  it('allows a user with the Order Entry permission', () => {
    const user: User = { id: 'user-1', name: 'Receiver', permissions: ['Order Entry'] };
    expect(hasModulePermission(user, 'Order Entry')).toBe(true);
  });

  it('blocks a user without the Order Entry permission', () => {
    const user: User = { id: 'user-2', name: 'Viewer', permissions: [] };
    expect(hasModulePermission(user, 'Order Entry')).toBe(false);
  });
});
