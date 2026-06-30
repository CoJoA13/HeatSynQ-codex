import { FilePlus2, Printer, RefreshCw, Save, Send } from 'lucide-react';

interface OrderToolbarProps {
  orderId: string;
  readyToRelease: boolean;
}

export function OrderToolbar({ orderId, readyToRelease }: OrderToolbarProps) {
  return (
    <div className="order-toolbar" aria-label="Order Entry toolbar">
      <div className="toolbar-group">
        <button type="button" className="toolbar-button toolbar-button-primary">
          <FilePlus2 size={16} aria-hidden="true" />
          <span>New Order</span>
        </button>
        <button type="button" className="toolbar-icon-button" aria-label={`Save order ${orderId}`} title="Save order">
          <Save size={16} aria-hidden="true" />
        </button>
        <button type="button" className="toolbar-icon-button" aria-label={`Print traveler for order ${orderId}`} title="Print traveler">
          <Printer size={16} aria-hidden="true" />
        </button>
        <button type="button" className="toolbar-icon-button" aria-label={`Refresh order ${orderId}`} title="Refresh order">
          <RefreshCw size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="toolbar-group">
        <button type="button" className="toolbar-button toolbar-button-release" disabled={!readyToRelease}>
          <Send size={16} aria-hidden="true" />
          <span>Release Order</span>
        </button>
      </div>
    </div>
  );
}
