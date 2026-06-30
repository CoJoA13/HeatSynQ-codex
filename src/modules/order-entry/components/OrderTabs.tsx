import type { OrderEntryTab } from '../../../domain/readiness';

const orderEntryTabs: OrderEntryTab[] = ['Order Top', 'Detail', 'Parts', 'Process', 'Steps'];

function tabId(tab: OrderEntryTab): string {
  return `order-tab-${tab.toLowerCase().replace(/\s+/g, '-')}`;
}

export interface OrderTabsProps {
  activeTab: OrderEntryTab;
  onTabChange: (tab: OrderEntryTab) => void;
}

function panelId(tab: OrderEntryTab): string {
  return `order-panel-${tab.toLowerCase().replace(/\s+/g, '-')}`;
}

export function OrderTabs({ activeTab, onTabChange }: OrderTabsProps) {
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
            aria-controls={panelId(tab)}
            onClick={() => onTabChange(tab)}
          >
            {tab}
          </button>
        );
      })}
    </nav>
  );
}
