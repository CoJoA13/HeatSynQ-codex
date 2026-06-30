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

  it('does not grant Order Entry when a user only has maintenance permissions', () => {
    const user: User = {
      id: 'user-3',
      name: 'Master Data Clerk',
      permissions: ['Customer Maintenance', 'Part Maintenance'],
    };

    expect(hasModulePermission(user, 'Customer Maintenance')).toBe(true);
    expect(hasModulePermission(user, 'Part Maintenance')).toBe(true);
    expect(hasModulePermission(user, 'Order Entry')).toBe(false);
  });

  it('allows Process Maintenance independently from other module permissions', () => {
    const user: User = {
      id: 'user-process',
      name: 'Process Engineer',
      permissions: ['Process Maintenance'],
    };

    expect(hasModulePermission(user, 'Process Maintenance')).toBe(true);
    expect(hasModulePermission(user, 'Order Entry')).toBe(false);
    expect(hasModulePermission(user, 'Customer Maintenance')).toBe(false);
    expect(hasModulePermission(user, 'Part Maintenance')).toBe(false);
  });
});
