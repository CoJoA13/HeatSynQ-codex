import { useMemo, useState } from 'react';
import { hasModulePermission } from '../domain/permissions';
import type { ModulePermission, User } from '../domain/types';
import { CustomerMaintenanceModule } from '../modules/customer-maintenance/CustomerMaintenanceModule';
import { OrderEntryModule } from '../modules/order-entry/OrderEntryModule';
import { PartMaintenanceModule } from '../modules/part-maintenance/PartMaintenanceModule';
import { ProcessMaintenanceModule } from '../modules/process-maintenance/ProcessMaintenanceModule';
import { createInitialHeatSynQDataState } from '../state/heatSynQData';

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
  { label: 'Process Maintenance', permission: 'Process Maintenance' },
];

export function AppShell({ currentUser }: AppShellProps) {
  const [heatSynQData, setHeatSynQData] = useState(createInitialHeatSynQDataState);
  const defaultPermission = useMemo<ModulePermission | null>(() => {
    if (hasModulePermission(currentUser, 'Order Entry')) return 'Order Entry';

    return modules.find((module) => hasModulePermission(currentUser, module.permission))?.permission ?? null;
  }, [currentUser]);

  const [activePermission, setActivePermission] = useState<ModulePermission | null>(defaultPermission);
  const selectedPermission =
    activePermission && hasModulePermission(currentUser, activePermission) ? activePermission : defaultPermission;

  function renderModule(permission: ModulePermission) {
    if (permission === 'Order Entry') {
      return (
        <OrderEntryModule
          currentUser={currentUser}
          processMasters={heatSynQData.processMasters}
          processRevisions={heatSynQData.processRevisions}
          plantSupportDictionaryEntries={heatSynQData.plantSupportDictionaryEntries}
        />
      );
    }
    if (permission === 'Customer Maintenance') return <CustomerMaintenanceModule currentUser={currentUser} />;
    if (permission === 'Part Maintenance') {
      return (
        <PartMaintenanceModule
          currentUser={currentUser}
          parts={heatSynQData.customerParts}
          onPartsChange={(customerParts) => setHeatSynQData((current) => ({ ...current, customerParts }))}
          processMasters={heatSynQData.processMasters}
          processRevisions={heatSynQData.processRevisions}
          plantSupportDictionaryEntries={heatSynQData.plantSupportDictionaryEntries}
        />
      );
    }
    if (permission === 'Process Maintenance') {
      return (
        <ProcessMaintenanceModule
          currentUser={currentUser}
          processMasters={heatSynQData.processMasters}
          processRevisions={heatSynQData.processRevisions}
          plantSupportDictionaryEntries={heatSynQData.plantSupportDictionaryEntries}
          customerParts={heatSynQData.customerParts}
          onProcessMastersChange={(processMasters) => setHeatSynQData((current) => ({ ...current, processMasters }))}
          onProcessRevisionsChange={(processRevisions) =>
            setHeatSynQData((current) => ({ ...current, processRevisions }))
          }
          onPlantSupportDictionaryEntriesChange={(plantSupportDictionaryEntries) =>
            setHeatSynQData((current) => ({ ...current, plantSupportDictionaryEntries }))
          }
          onCustomerPartsChange={(customerParts) => setHeatSynQData((current) => ({ ...current, customerParts }))}
        />
      );
    }

    return null;
  }

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
        renderModule(selectedPermission)
      ) : (
        <section className="module-blocked">
          <h1>No modules enabled</h1>
          <p>No HeatSynQ modules are enabled for {currentUser.name}.</p>
        </section>
      )}
    </main>
  );
}
