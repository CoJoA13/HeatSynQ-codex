import { Ban, Eraser, FilePlus2, FileSearch, MessageSquare, Printer, RefreshCw, Save, Send } from 'lucide-react';

interface OrderToolbarProps {
  orderId: string;
  readyToRelease: boolean;
  onNew: () => void;
  onSearch: () => void;
  onCheck: () => void;
  onRelease: () => void;
  onSave: () => void;
  onCancel: () => void;
  onErase: () => void;
  onAddNote: () => void;
  onAddComment: () => void;
  onPrint: () => void;
}

export function OrderToolbar({
  orderId,
  readyToRelease,
  onNew,
  onSearch,
  onCheck,
  onRelease,
  onSave,
  onCancel,
  onErase,
  onAddNote,
  onAddComment,
  onPrint,
}: OrderToolbarProps) {
  return (
    <div className="order-toolbar" aria-label="Order Entry toolbar">
      <div className="toolbar-group">
        <button type="button" className="toolbar-button toolbar-button-primary" onClick={onNew}>
          <FilePlus2 size={16} aria-hidden="true" />
          <span>New Order</span>
        </button>
        <button type="button" className="toolbar-icon-button" aria-label="Search orders" title="Search orders" onClick={onSearch}>
          <FileSearch size={16} aria-hidden="true" />
        </button>
        <button type="button" className="toolbar-icon-button" aria-label="Check readiness" title="Check readiness" onClick={onCheck}>
          <RefreshCw size={16} aria-hidden="true" />
        </button>
        <button type="button" className="toolbar-icon-button" aria-label={`Save order ${orderId}`} title="Save order" onClick={onSave}>
          <Save size={16} aria-hidden="true" />
        </button>
        <button type="button" className="toolbar-icon-button" aria-label="Cancel edits" title="Cancel edits" onClick={onCancel}>
          <Ban size={16} aria-hidden="true" />
        </button>
        <button type="button" className="toolbar-icon-button" aria-label="Erase draft" title="Erase draft" onClick={onErase}>
          <Eraser size={16} aria-hidden="true" />
        </button>
        <button type="button" className="toolbar-icon-button" aria-label="Order note" title="Order note" onClick={onAddNote}>
          <MessageSquare size={16} aria-hidden="true" />
        </button>
        <button type="button" className="toolbar-icon-button" aria-label="Comments" title="Comments" onClick={onAddComment}>
          <MessageSquare size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="toolbar-icon-button"
          aria-label={`Print traveler for order ${orderId}`}
          title="Print traveler"
          disabled={!readyToRelease}
          onClick={onPrint}
        >
          <Printer size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="toolbar-group">
        <button
          type="button"
          className="toolbar-button toolbar-button-release"
          aria-disabled={!readyToRelease}
          onClick={onRelease}
        >
          <Send size={16} aria-hidden="true" />
          <span>Release Order</span>
        </button>
      </div>
    </div>
  );
}
