import type { Order } from '../../../domain/types';

interface DetailTabProps {
  order: Order;
}

export function DetailTab({ order }: DetailTabProps) {
  return (
    <div className="tab-content-stack">
      <div className="panel-heading">
        <p className="panel-kicker">Supplemental order data</p>
        <h2>Detail</h2>
      </div>

      <section className="detail-panel" aria-label="Order detail fields">
        <dl className="definition-grid">
          <div>
            <dt>Order type</dt>
            <dd>{order.orderType}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{order.phone || 'None entered'}</dd>
          </div>
          <div>
            <dt>Freight out</dt>
            <dd>${order.freightOut.toFixed(2)}</dd>
          </div>
          <div>
            <dt>In route ID</dt>
            <dd>{order.inRouteId || 'None entered'}</dd>
          </div>
          <div>
            <dt>Order is at</dt>
            <dd>{order.orderLocation || 'Receiving'}</dd>
          </div>
          <div>
            <dt>Certification</dt>
            <dd>{order.certificationRequired ? 'Required' : 'Not required'}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
