import type { OrderEntryTab } from '../../../domain/readiness';

const orderEntryTabs: OrderEntryTab[] = ['Order Top', 'Detail', 'Parts', 'Process', 'Steps'];

function tabId(tab: OrderEntryTab): string {
  return `order-tab-${tab.toLowerCase().replace(/\s+/g, '-')}`;
}

export interface OrderTabsProps {
  activeTab: OrderEntryTab;
}

export function OrderTabs({ activeTab }: OrderTabsProps) {
  return (
    <nav className="order-tabs" role="tablist" aria-label="Order Entry sections">
      {orderEntryTabs.map((tab) => {
        const selected = tab === activeTab;

        return (
          <button
            key={tab}
            type="button"
            role="tab"
            id={tabId(tab)}
            className="order-tab"
            aria-selected={selected}
            aria-controls={selected ? 'order-panel-order-top' : undefined}
            tabIndex={selected ? 0 : -1}
          >
            {tab}
          </button>
        );
      })}
    </nav>
  );
}
