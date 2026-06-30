import type { PropsWithChildren } from 'react';
import { ModuleGate as SharedModuleGate } from '../../../components/ModuleGate';
import type { User } from '../../../domain/types';

interface ModuleGateProps extends PropsWithChildren {
  user: User;
}

export function ModuleGate({ user, children }: ModuleGateProps) {
  return (
    <SharedModuleGate user={user} permission="Order Entry" moduleName="Order Entry">
      {children}
    </SharedModuleGate>
  );
}
