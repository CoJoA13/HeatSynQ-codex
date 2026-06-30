import { customers, sampleOrder } from '../../data/seed';
import { validateOrderReadiness } from '../../domain/readiness';
import type { User } from '../../domain/types';
import { ModuleGate } from './components/ModuleGate';
import { OrderHeaderStatus } from './components/OrderHeaderStatus';
import { OrderTabs } from './components/OrderTabs';
import { OrderToolbar } from './components/OrderToolbar';
import { ReadinessChecklist } from './components/ReadinessChecklist';

interface OrderEntryModuleProps {
  currentUser: User;
}

export function OrderEntryModule({ currentUser }: OrderEntryModuleProps) {
  const readiness = validateOrderReadiness(sampleOrder, currentUser);
  const customer = customers.find((entry) => entry.id === sampleOrder.customerId);

  return (
    <ModuleGate user={currentUser}>
      <section className="order-entry-module" aria-labelledby="order-entry-title">
        <OrderToolbar orderId={sampleOrder.id} readyToRelease={readiness.ready} />
        <OrderHeaderStatus order={sampleOrder} customerName={customer?.name ?? sampleOrder.customerId} readiness={readiness} />
        <OrderTabs activeTab="Order Top" />

        <div className="order-entry-workspace">
          <section
            className="order-tab-panel"
            role="tabpanel"
            id="order-panel-order-top"
            aria-labelledby="order-tab-order-top"
          >
            <div className="panel-heading">
              <p className="panel-kicker">Active order</p>
              <h2>{customer?.name ?? 'Customer pending'}</h2>
            </div>

            <dl className="order-summary-grid">
              <div>
                <dt>PO Number</dt>
                <dd>{sampleOrder.poNumber}</dd>
              </div>
              <div>
                <dt>Packing Number</dt>
                <dd>{sampleOrder.packingNumber}</dd>
              </div>
              <div>
                <dt>Process Master</dt>
                <dd>{sampleOrder.processMasterId}</dd>
              </div>
              <div>
                <dt>Request Date</dt>
                <dd>{sampleOrder.requestDate}</dd>
              </div>
            </dl>
          </section>

          <ReadinessChecklist readiness={readiness} />
        </div>
      </section>
    </ModuleGate>
  );
}
