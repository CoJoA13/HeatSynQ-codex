import type { ModulePermission, User } from './types';

export function hasModulePermission(user: User, permission: ModulePermission): boolean {
  return user.permissions.includes(permission);
}
