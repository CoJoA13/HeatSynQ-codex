import { customers } from '../../../data/seed';
import type { Order } from '../../../domain/types';

interface OrderTopTabProps {
  order: Order;
  onOrderChange: (order: Order) => void;
}

export function OrderTopTab({ order, onOrderChange }: OrderTopTabProps) {
  const selectedCustomer = customers.find((customer) => customer.id === order.customerId);

  function update<K extends keyof Order>(key: K, value: Order[K]) {
    onOrderChange({ ...order, [key]: value });
  }

  function updateCustomer(customerId: string) {
    const customer = customers.find((entry) => entry.id === customerId);

    onOrderChange({
      ...order,
      customerId,
      phone: customer?.phone ?? '',
      receivedFrom: customer?.receivedFrom ?? '',
      shipTo: customer?.shipTo ?? '',
    });
  }

  return (
    <div className="tab-content-stack">
      <div className="panel-heading">
        <p className="panel-kicker">Order header</p>
        <h2>Order Top</h2>
      </div>

      <section className="form-grid" aria-label="Order top fields">
        <label>
          <span>Customer</span>
          <select value={order.customerId} onChange={(event) => updateCustomer(event.target.value)}>
            <option value="">Select customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </label>

        <div className="field-readout">
          <span>Customer name</span>
          <strong>{selectedCustomer?.name ?? 'Unassigned'}</strong>
        </div>

        <label>
          <span>PO number</span>
          <input value={order.poNumber} onChange={(event) => update('poNumber', event.target.value)} />
        </label>

        <label>
          <span>Packing number</span>
          <input value={order.packingNumber} onChange={(event) => update('packingNumber', event.target.value)} />
        </label>

        <label>
          <span>Status</span>
          <input value={order.status} onChange={(event) => update('status', event.target.value)} />
        </label>

        <label>
          <span>Receiving status</span>
          <input value={order.receivingStatus} onChange={(event) => update('receivingStatus', event.target.value)} />
        </label>

        <label>
          <span>Certification</span>
          <select
            value={order.certificationRequired ? 'yes' : 'no'}
            onChange={(event) => update('certificationRequired', event.target.value === 'yes')}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </label>

        <label>
          <span>Request date</span>
          <input type="date" value={order.requestDate} onChange={(event) => update('requestDate', event.target.value)} />
        </label>

        <label>
          <span>Target ship date</span>
          <input type="date" value={order.targetShipDate} onChange={(event) => update('targetShipDate', event.target.value)} />
        </label>

        <label>
          <span>Carrier in</span>
          <input value={order.carrierIn} onChange={(event) => update('carrierIn', event.target.value)} />
        </label>

        <label>
          <span>In route ID</span>
          <input value={order.inRouteId} onChange={(event) => update('inRouteId', event.target.value)} />
        </label>

        <label>
          <span>Order location</span>
          <input value={order.orderLocation} onChange={(event) => update('orderLocation', event.target.value)} />
        </label>

        <label>
          <span>Phone</span>
          <input value={order.phone} onChange={(event) => update('phone', event.target.value)} />
        </label>

        <label>
          <span>Received from</span>
          <input value={order.receivedFrom} onChange={(event) => update('receivedFrom', event.target.value)} />
        </label>

        <label className="form-field-wide">
          <span>Ship to</span>
          <input value={order.shipTo} onChange={(event) => update('shipTo', event.target.value)} />
        </label>
      </section>
    </div>
  );
}
