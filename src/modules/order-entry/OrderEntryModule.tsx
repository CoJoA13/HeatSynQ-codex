import { useMemo, useState } from 'react';
import { customers, sampleOrder } from '../../data/seed';
import { validateOrderReadiness, type OrderEntryTab } from '../../domain/readiness';
import type { Order, User } from '../../domain/types';
import { ModuleGate } from './components/ModuleGate';
import { OrderHeaderStatus } from './components/OrderHeaderStatus';
import { OrderTabs } from './components/OrderTabs';
import { OrderToolbar } from './components/OrderToolbar';
import { ReadinessChecklist } from './components/ReadinessChecklist';

interface OrderEntryModuleProps {
  currentUser: User;
}

function cloneSampleOrder(): Order {
  return {
    ...sampleOrder,
    containers: sampleOrder.containers.map((container) => ({ ...container })),
    parts: sampleOrder.parts.map((part) => ({ ...part })),
    events: sampleOrder.events.map((event) => ({ ...event })),
    orderNotes: sampleOrder.orderNotes.map((note) => ({ ...note })),
    customerNotes: sampleOrder.customerNotes.map((note) => ({ ...note })),
    documents: sampleOrder.documents.map((document) => ({ ...document })),
  };
}

function createDraftOrder(): Order {
  return {
    ...cloneSampleOrder(),
    id: 'Draft',
    status: 'Draft',
    receivingStatus: 'Incomplete',
    customerId: '',
    poNumber: '',
    packingNumber: '',
    certificationRequired: false,
    requestDate: '',
    targetShipDate: '',
    carrierIn: '',
    inRouteId: '',
    orderLocation: 'Receiving',
    phone: '',
    receivedFrom: '',
    shipTo: '',
    freightOut: 0,
    processMasterId: '',
    containers: [],
    parts: [],
    events: [],
    orderNotes: [],
    customerNotes: [],
    documents: [],
  };
}

function createEventId(): string {
  return crypto.randomUUID();
}

function tabPanelId(tab: OrderEntryTab): string {
  return `order-panel-${tab.toLowerCase().replace(/\s+/g, '-')}`;
}

export function OrderEntryModule({ currentUser }: OrderEntryModuleProps) {
  const [order, setOrder] = useState<Order>(() => cloneSampleOrder());
  const [activeTab, setActiveTab] = useState<OrderEntryTab>('Order Top');
  const readiness = validateOrderReadiness(order, currentUser);
  const customer = useMemo(() => customers.find((entry) => entry.id === order.customerId), [order.customerId]);
  const customerName = customer?.name ?? 'Unassigned';

  function addEvent(code: string, description: string) {
    setOrder((current) => ({
      ...current,
      events: [
        {
          id: createEventId(),
          date: new Date().toLocaleString(),
          code,
          description,
        },
        ...current.events,
      ],
    }));
  }

  return (
    <ModuleGate user={currentUser}>
      <section className="order-entry-module" aria-labelledby="order-entry-title">
        <OrderToolbar
          orderId={order.id}
          readyToRelease={readiness.ready}
          onNew={() => {
            setOrder(createDraftOrder());
            setActiveTab('Order Top');
          }}
          onSearch={() => {
            setOrder(cloneSampleOrder());
            setActiveTab('Order Top');
          }}
          onCheck={() => {
            addEvent(
              readiness.ready ? 'Ready Check' : 'Blocked Check',
              readiness.ready
                ? 'Order is ready to release'
                : `Missing: ${readiness.missing.map((item) => item.label).join(', ')}`,
            );
          }}
          onSave={() => addEvent('Saved', 'Order saved from Order Entry')}
          onCancel={() => {
            setOrder(cloneSampleOrder());
            setActiveTab('Order Top');
          }}
          onErase={() => setOrder(createDraftOrder())}
          onAddNote={() => addEvent('Order Note', 'Order note action opened')}
          onAddComment={() => addEvent('Comments', 'Comments action opened')}
        />
        <OrderHeaderStatus order={order} customerName={customerName} readiness={readiness} />
        <OrderTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="order-entry-workspace">
          <section
            className="order-tab-panel"
            role="tabpanel"
            id={tabPanelId(activeTab)}
            aria-labelledby={`order-tab-${activeTab.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <div className="panel-heading">
              <p className="panel-kicker">Active tab</p>
              <h2>{activeTab}</h2>
            </div>

            <dl className="order-summary-grid">
              <div>
                <dt>PO Number</dt>
                <dd>{order.poNumber || 'Pending'}</dd>
              </div>
              <div>
                <dt>Packing Number</dt>
                <dd>{order.packingNumber || 'Pending'}</dd>
              </div>
              <div>
                <dt>Process Master</dt>
                <dd>{order.processMasterId || 'Pending'}</dd>
              </div>
              <div>
                <dt>Request Date</dt>
                <dd>{order.requestDate || 'Pending'}</dd>
              </div>
            </dl>
          </section>

          <ReadinessChecklist readiness={readiness} onSelectTab={setActiveTab} />
        </div>
      </section>
    </ModuleGate>
  );
}
