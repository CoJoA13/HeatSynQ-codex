import { sampleOrder } from '../../data/seed';
import type { User } from '../../domain/types';
import { ModuleGate } from './components/ModuleGate';

interface OrderEntryModuleProps {
  currentUser: User;
}

export function OrderEntryModule({ currentUser }: OrderEntryModuleProps) {
  return (
    <ModuleGate user={currentUser}>
      <section className="order-entry-module">
        <header className="window-title">
          <h1>Order Entry</h1>
          <span>Order {sampleOrder.id}</span>
        </header>
      </section>
    </ModuleGate>
  );
}
