import { useMemo, useState } from 'react';
import {
  customers,
  plantSupportDictionaryEntries as seededPlantSupportDictionaryEntries,
  processMasters as seededProcessMasters,
  processRevisions as seededProcessRevisions,
  sampleOrder,
} from '../../data/seed';
import { validateOrderReadiness, type OrderEntryTab } from '../../domain/readiness';
import type { Order, PlantSupportDictionaryEntry, ProcessMaster, ProcessRevision, User } from '../../domain/types';
import { ModuleGate } from './components/ModuleGate';
import { ActivityPanels } from './components/ActivityPanels';
import { OrderHeaderStatus } from './components/OrderHeaderStatus';
import { OrderTabs } from './components/OrderTabs';
import { OrderToolbar } from './components/OrderToolbar';
import { ReadinessChecklist } from './components/ReadinessChecklist';
import { DetailTab } from './tabs/DetailTab';
import { OrderTopTab } from './tabs/OrderTopTab';
import { PartsTab } from './tabs/PartsTab';
import { ProcessTab } from './tabs/ProcessTab';
import { StepsTab } from './tabs/StepsTab';

interface OrderEntryModuleProps {
  currentUser: User;
  processMasters?: ProcessMaster[];
  processRevisions?: ProcessRevision[];
  plantSupportDictionaryEntries?: PlantSupportDictionaryEntry[];
}

function cloneSampleOrder(): Order {
  return cloneOrder(sampleOrder);
}

function cloneOrder(order: Order): Order {
  return {
    ...order,
    containers: order.containers.map((container) => ({ ...container })),
    parts: order.parts.map((part) => ({ ...part })),
    events: order.events.map((event) => ({ ...event })),
    orderNotes: order.orderNotes.map((note) => ({ ...note })),
    customerNotes: order.customerNotes.map((note) => ({ ...note })),
    documents: order.documents.map((document) => ({ ...document })),
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

function createOrderEvent(code: string, description: string) {
  return {
    id: createEventId(),
    date: new Date().toLocaleString(),
    code,
    description,
  };
}

function withEvent(order: Order, code: string, description: string): Order {
  return {
    ...order,
    events: [createOrderEvent(code, description), ...order.events],
  };
}

function tabPanelId(tab: OrderEntryTab): string {
  return `order-panel-${tab.toLowerCase().replace(/\s+/g, '-')}`;
}

export function OrderEntryModule({
  currentUser,
  processMasters,
  processRevisions,
  plantSupportDictionaryEntries,
}: OrderEntryModuleProps) {
  const [order, setOrder] = useState<Order>(() => cloneSampleOrder());
  const [savedOrder, setSavedOrder] = useState<Order>(() => cloneSampleOrder());
  const [activeTab, setActiveTab] = useState<OrderEntryTab>('Order Top');
  const readiness = validateOrderReadiness(order, currentUser);
  const customer = useMemo(() => customers.find((entry) => entry.id === order.customerId), [order.customerId]);
  const customerName = customer?.name ?? 'Unassigned';
  const effectiveProcessMasters = processMasters ?? seededProcessMasters;
  const effectiveProcessRevisions = processRevisions ?? seededProcessRevisions;
  const effectiveDictionaries = plantSupportDictionaryEntries ?? seededPlantSupportDictionaryEntries;

  function addEvent(code: string, description: string) {
    setOrder((current) => withEvent(current, code, description));
  }

  function readinessDescription() {
    return `Release blocked. Missing: ${readiness.missing.map((item) => item.label).join(', ')}`;
  }

  function saveOrder() {
    setOrder((current) => {
      const nextOrder = withEvent(current, 'Saved', 'Order saved from Order Entry');
      setSavedOrder(cloneOrder(nextOrder));
      return nextOrder;
    });
  }

  function releaseOrder() {
    if (!readiness.ready) {
      addEvent('Blocked Release', readinessDescription());
      return;
    }

    setOrder((current) => {
      const releasedOrder = withEvent(
        {
          ...current,
          status: 'Released',
          receivingStatus: 'Order Released',
        },
        'Order Released',
        `Released order ${current.id}`,
      );
      setSavedOrder(cloneOrder(releasedOrder));
      return releasedOrder;
    });
  }

  function renderActiveTab() {
    if (activeTab === 'Order Top') return <OrderTopTab order={order} onOrderChange={setOrder} />;
    if (activeTab === 'Detail') return <DetailTab order={order} />;
    if (activeTab === 'Parts') return <PartsTab order={order} onOrderChange={setOrder} />;
    if (activeTab === 'Process') {
      return (
        <ProcessTab
          order={order}
          onOrderChange={setOrder}
          processMasters={effectiveProcessMasters}
          processRevisions={effectiveProcessRevisions}
          plantSupportDictionaryEntries={effectiveDictionaries}
        />
      );
    }
    if (activeTab === 'Steps') {
      return (
        <StepsTab
          order={order}
          processMasters={effectiveProcessMasters}
          processRevisions={effectiveProcessRevisions}
          plantSupportDictionaryEntries={effectiveDictionaries}
        />
      );
    }

    return null;
  }

  return (
    <ModuleGate user={currentUser}>
      <section className="order-entry-module" aria-labelledby="order-entry-title">
        <OrderToolbar
          orderId={order.id}
          readyToRelease={readiness.ready}
          onNew={() => {
            const draftOrder = createDraftOrder();
            setOrder(draftOrder);
            setSavedOrder(cloneOrder(draftOrder));
            setActiveTab('Order Top');
          }}
          onSearch={() => {
            const sample = cloneSampleOrder();
            setOrder(sample);
            setSavedOrder(cloneOrder(sample));
            setActiveTab('Order Top');
          }}
          onCheck={() => {
            addEvent(
              readiness.ready ? 'Ready Check' : 'Blocked Check',
              readiness.ready ? 'Order is ready to release' : readinessDescription(),
            );
          }}
          onRelease={releaseOrder}
          onSave={saveOrder}
          onCancel={() => {
            setOrder(cloneOrder(savedOrder));
            setActiveTab('Order Top');
          }}
          onErase={() => {
            const draftOrder = createDraftOrder();
            setOrder(draftOrder);
            setSavedOrder(cloneOrder(draftOrder));
          }}
          onAddNote={() => addEvent('Order Note', 'Order note action opened')}
          onAddComment={() => addEvent('Comments', 'Comments action opened')}
          onPrint={() => addEvent('Ord Printed', `Traveler printed for order ${order.id}`)}
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
            {renderActiveTab()}
          </section>

          <div className="right-column">
            <ReadinessChecklist readiness={readiness} onSelectTab={setActiveTab} />
            <ActivityPanels order={order} />
          </div>
        </div>
      </section>
    </ModuleGate>
  );
}
