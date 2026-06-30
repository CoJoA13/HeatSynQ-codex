import { CheckCircle2, Clock3 } from 'lucide-react';
import type { ReadinessResult } from '../../../domain/readiness';
import type { Order } from '../../../domain/types';

interface OrderHeaderStatusProps {
  order: Order;
  customerName: string;
  readiness: ReadinessResult;
}

export function OrderHeaderStatus({ order, customerName, readiness }: OrderHeaderStatusProps) {
  const statusClass = readiness.ready ? 'status-pill status-pill-ready' : 'status-pill status-pill-hold';

  return (
    <header className="order-status-header">
      <div>
        <p className="module-label">Active order</p>
        <h1 id="order-entry-title">Order Entry</h1>
        <p className="order-customer-line">Order {order.id} / {customerName}</p>
      </div>

      <div className="order-status-stack" aria-label="Order status and release readiness">
        <span className={statusClass}>
          {readiness.ready ? <CheckCircle2 size={16} aria-hidden="true" /> : <Clock3 size={16} aria-hidden="true" />}
          <span>{readiness.ready ? 'Ready to Release' : 'Release Hold'}</span>
        </span>
        <dl className="status-metrics">
          <div>
            <dt>Status</dt>
            <dd>{order.status}</dd>
          </div>
          <div>
            <dt>Receiving</dt>
            <dd>{order.receivingStatus}</dd>
          </div>
        </dl>
      </div>
    </header>
  );
}
