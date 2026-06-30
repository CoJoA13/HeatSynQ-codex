import { useMemo, useState } from 'react';
import { hasModulePermission } from '../domain/permissions';
import type { ModulePermission, User } from '../domain/types';
import { CustomerMaintenanceModule } from '../modules/customer-maintenance/CustomerMaintenanceModule';
import { OrderEntryModule } from '../modules/order-entry/OrderEntryModule';
import { PartMaintenanceModule } from '../modules/part-maintenance/PartMaintenanceModule';

interface AppShellProps {
  currentUser: User;
}

interface ModuleDefinition {
  label: string;
  permission: ModulePermission;
}

const modules: ModuleDefinition[] = [
  { label: 'Order Entry', permission: 'Order Entry' },
  { label: 'Customer Maintenance', permission: 'Customer Maintenance' },
  { label: 'Part Maintenance', permission: 'Part Maintenance' },
];

function renderModule(permission: ModulePermission, currentUser: User) {
  if (permission === 'Order Entry') return <OrderEntryModule currentUser={currentUser} />;
  if (permission === 'Customer Maintenance') return <CustomerMaintenanceModule currentUser={currentUser} />;
  if (permission === 'Part Maintenance') return <PartMaintenanceModule currentUser={currentUser} />;

  return null;
}

export function AppShell({ currentUser }: AppShellProps) {
  const defaultPermission = useMemo<ModulePermission | null>(() => {
    if (hasModulePermission(currentUser, 'Order Entry')) return 'Order Entry';

    return modules.find((module) => hasModulePermission(currentUser, module.permission))?.permission ?? null;
  }, [currentUser]);

  const [activePermission, setActivePermission] = useState<ModulePermission | null>(defaultPermission);
  const selectedPermission =
    activePermission && hasModulePermission(currentUser, activePermission) ? activePermission : defaultPermission;

  return (
    <main className="app-shell erp-shell">
      <nav className="module-nav" aria-label="HeatSynQ modules">
        <div className="module-nav-brand">HeatSynQ</div>
        <div className="module-nav-actions">
          {modules.map((module) => {
            const enabled = hasModulePermission(currentUser, module.permission);

            return (
              <button
                className="module-nav-button"
                type="button"
                key={module.permission}
                aria-pressed={selectedPermission === module.permission}
                disabled={!enabled}
                onClick={() => setActivePermission(module.permission)}
              >
                {module.label}
              </button>
            );
          })}
        </div>
      </nav>

      {selectedPermission ? (
        renderModule(selectedPermission, currentUser)
      ) : (
        <section className="module-blocked">
          <h1>No modules enabled</h1>
          <p>No HeatSynQ modules are enabled for {currentUser.name}.</p>
        </section>
      )}
    </main>
  );
}
