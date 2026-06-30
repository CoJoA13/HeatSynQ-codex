import type { PropsWithChildren } from 'react';
import { hasModulePermission } from '../../../domain/permissions';
import type { User } from '../../../domain/types';

interface ModuleGateProps extends PropsWithChildren {
  user: User;
}

export function ModuleGate({ user, children }: ModuleGateProps) {
  if (!hasModulePermission(user, 'Order Entry')) {
    return (
      <section className="module-blocked">
        <h1>Order Entry permission required</h1>
        <p>This module is not enabled for {user.name}.</p>
      </section>
    );
  }

  return <>{children}</>;
}
