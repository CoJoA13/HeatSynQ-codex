import { processMasters } from '../../../data/seed';
import type { Order } from '../../../domain/types';

interface ProcessTabProps {
  order: Order;
  onOrderChange: (order: Order) => void;
}

export function ProcessTab({ order, onOrderChange }: ProcessTabProps) {
  const process = processMasters.find((entry) => entry.id === order.processMasterId);

  return (
    <div className="tab-content-stack">
      <div className="panel-heading">
        <p className="panel-kicker">Existing master route</p>
        <h2>Process</h2>
      </div>

      <section className="process-panel" aria-label="Process master fields">
        <label>
          <span>Process master</span>
          <select
            value={order.processMasterId}
            onChange={(event) => onOrderChange({ ...order, processMasterId: event.target.value })}
          >
            <option value="">Select process master</option>
            {processMasters.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.id} - {entry.processCode}
              </option>
            ))}
          </select>
        </label>

        {process ? (
          <dl className="definition-grid">
            <div>
              <dt>Process code</dt>
              <dd>{process.processCode}</dd>
            </div>
            <div>
              <dt>Revision</dt>
              <dd>{process.revision}</dd>
            </div>
            <div>
              <dt>Material</dt>
              <dd>{process.material}</dd>
            </div>
            <div>
              <dt>Certification ID</dt>
              <dd>{process.certificationId || 'None'}</dd>
            </div>
            <div>
              <dt>Spec</dt>
              <dd>{process.spec}</dd>
            </div>
            <div>
              <dt>Comments</dt>
              <dd>{process.comments}</dd>
            </div>
          </dl>
        ) : (
          <div className="empty-state">Select a process master to review the route details.</div>
        )}
      </section>
    </div>
  );
}
