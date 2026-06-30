import type { PropsWithChildren } from 'react';
import { hasModulePermission } from '../domain/permissions';
import type { ModulePermission, User } from '../domain/types';

interface ModuleGateProps extends PropsWithChildren {
  user: User;
  permission: ModulePermission;
  moduleName: string;
}

export function ModuleGate({ user, permission, moduleName, children }: ModuleGateProps) {
  if (!hasModulePermission(user, permission)) {
    return (
      <section className="module-blocked">
        <h1>{moduleName} permission required</h1>
        <p>This module is not enabled for {user.name}.</p>
      </section>
    );
  }

  return <>{children}</>;
}
