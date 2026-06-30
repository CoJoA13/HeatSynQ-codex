import { Plus, Trash2 } from 'lucide-react';
import { calculateContainerNetWeight, calculateOrderWeights } from '../../../domain/weights';
import type { Container, Order, PartLine } from '../../../domain/types';

interface PartsTabProps {
  order: Order;
  onOrderChange: (order: Order) => void;
}

function createContainer(): Container {
  return {
    id: crypto.randomUUID(),
    type: '',
    count: 1,
    quantity: 1,
    grossWeight: 0,
    tareWeight: 0,
    containerId: '',
  };
}

function createPart(): PartLine {
  return {
    id: crypto.randomUUID(),
    partNumber: '',
    customerPartNumber: '',
    description: '',
    quantity: 1,
    eachWeight: 0,
    material: '',
    thickness: 0,
    verified: false,
  };
}

function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatWeight(value: number): string {
  return `${value.toFixed(2)} lb`;
}

export function PartsTab({ order, onOrderChange }: PartsTabProps) {
  const totals = calculateOrderWeights(order);

  function updateContainer(containerId: string, patch: Partial<Container>) {
    onOrderChange({
      ...order,
      containers: order.containers.map((container) =>
        container.id === containerId ? { ...container, ...patch } : container,
      ),
    });
  }

  function removeContainer(containerId: string) {
    onOrderChange({
      ...order,
      containers: order.containers.filter((container) => container.id !== containerId),
    });
  }

  function updatePart(partId: string, patch: Partial<PartLine>) {
    onOrderChange({
      ...order,
      parts: order.parts.map((part) => (part.id === partId ? { ...part, ...patch } : part)),
    });
  }

  function removePart(partId: string) {
    onOrderChange({
      ...order,
      parts: order.parts.filter((part) => part.id !== partId),
    });
  }

  return (
    <div className="tab-content-stack parts-tab">
      <div className="panel-heading">
        <p className="panel-kicker">Containers and parts</p>
        <h2>Parts</h2>
      </div>

      <section className="parts-section" aria-labelledby="containers-title">
        <div className="section-toolbar">
          <h3 id="containers-title">Containers</h3>
          <button
            type="button"
            className="inline-action-button"
            onClick={() => onOrderChange({ ...order, containers: [...order.containers, createContainer()] })}
          >
            <Plus size={15} aria-hidden="true" />
            <span>Add Container</span>
          </button>
        </div>

        {order.containers.length === 0 ? (
          <div className="empty-state">Add a container to capture received quantity and weight.</div>
        ) : (
          <div className="table-scroll">
            <table className="data-table parts-table">
              <thead>
                <tr>
                  <th scope="col">Type</th>
                  <th scope="col">Count</th>
                  <th scope="col">Quantity</th>
                  <th scope="col">Gross</th>
                  <th scope="col">Tare</th>
                  <th scope="col">Net</th>
                  <th scope="col">Container ID</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {order.containers.map((container, index) => {
                  const rowNumber = index + 1;

                  return (
                    <tr key={container.id}>
                      <td>
                        <input
                          aria-label={`Container ${rowNumber} type`}
                          value={container.type}
                          onChange={(event) => updateContainer(container.id, { type: event.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          aria-label={`Container ${rowNumber} count`}
                          type="number"
                          min="0"
                          value={container.count}
                          onChange={(event) => updateContainer(container.id, { count: toNumber(event.target.value) })}
                        />
                      </td>
                      <td>
                        <input
                          aria-label={`Container ${rowNumber} quantity`}
                          type="number"
                          min="0"
                          value={container.quantity}
                          onChange={(event) => updateContainer(container.id, { quantity: toNumber(event.target.value) })}
                        />
                      </td>
                      <td>
                        <input
                          aria-label={`Container ${rowNumber} gross weight`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={container.grossWeight}
                          onChange={(event) =>
                            updateContainer(container.id, { grossWeight: toNumber(event.target.value) })
                          }
                        />
                      </td>
                      <td>
                        <input
                          aria-label={`Container ${rowNumber} tare weight`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={container.tareWeight}
                          onChange={(event) => updateContainer(container.id, { tareWeight: toNumber(event.target.value) })}
                        />
                      </td>
                      <td className="number-cell">Net weight {formatWeight(calculateContainerNetWeight(container))}</td>
                      <td>
                        <input
                          aria-label={`Container ${rowNumber} container ID`}
                          value={container.containerId}
                          onChange={(event) => updateContainer(container.id, { containerId: event.target.value })}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="row-action-button"
                          aria-label={`Remove container ${rowNumber}`}
                          onClick={() => removeContainer(container.id)}
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="parts-section" aria-labelledby="parts-title">
        <div className="section-toolbar">
          <h3 id="parts-title">Part Lines</h3>
          <button
            type="button"
            className="inline-action-button"
            onClick={() => onOrderChange({ ...order, parts: [...order.parts, createPart()] })}
          >
            <Plus size={15} aria-hidden="true" />
            <span>Add Part</span>
          </button>
        </div>

        {order.parts.length === 0 ? (
          <div className="empty-state">Add a part line to connect quantity, weight, and material details.</div>
        ) : (
          <div className="table-scroll">
            <table className="data-table parts-table">
              <thead>
                <tr>
                  <th scope="col">Part number</th>
                  <th scope="col">Customer part</th>
                  <th scope="col">Description</th>
                  <th scope="col">Quantity</th>
                  <th scope="col">Each weight</th>
                  <th scope="col">Line weight</th>
                  <th scope="col">Material</th>
                  <th scope="col">Thickness</th>
                  <th scope="col">Verified</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {order.parts.map((part, index) => {
                  const rowNumber = index + 1;

                  return (
                    <tr key={part.id}>
                      <td>
                        <input
                          aria-label={`Part ${rowNumber} part number`}
                          value={part.partNumber}
                          onChange={(event) => updatePart(part.id, { partNumber: event.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          aria-label={`Part ${rowNumber} customer part number`}
                          value={part.customerPartNumber}
                          onChange={(event) => updatePart(part.id, { customerPartNumber: event.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          aria-label={`Part ${rowNumber} description`}
                          value={part.description}
                          onChange={(event) => updatePart(part.id, { description: event.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          aria-label={`Part ${rowNumber} quantity`}
                          type="number"
                          min="0"
                          value={part.quantity}
                          onChange={(event) => updatePart(part.id, { quantity: toNumber(event.target.value) })}
                        />
                      </td>
                      <td>
                        <input
                          aria-label={`Part ${rowNumber} each weight`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={part.eachWeight}
                          onChange={(event) => updatePart(part.id, { eachWeight: toNumber(event.target.value) })}
                        />
                      </td>
                      <td className="number-cell">{formatWeight(part.quantity * part.eachWeight)}</td>
                      <td>
                        <input
                          aria-label={`Part ${rowNumber} material`}
                          value={part.material}
                          onChange={(event) => updatePart(part.id, { material: event.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          aria-label={`Part ${rowNumber} thickness`}
                          type="number"
                          min="0"
                          step="0.001"
                          value={part.thickness}
                          onChange={(event) => updatePart(part.id, { thickness: toNumber(event.target.value) })}
                        />
                      </td>
                      <td className="checkbox-cell">
                        <input
                          aria-label={`Part ${rowNumber} verified`}
                          type="checkbox"
                          checked={part.verified}
                          onChange={(event) => updatePart(part.id, { verified: event.target.checked })}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="row-action-button"
                          aria-label={`Remove part ${rowNumber}`}
                          onClick={() => removePart(part.id)}
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="parts-totals" aria-labelledby="container-totals-title">
        <div className="total-panel">
          <h3 id="container-totals-title">Container Totals</h3>
          <dl>
            <div>
              <dt>Quantity</dt>
              <dd>{totals.containerQuantity}</dd>
            </div>
            <div>
              <dt>Gross weight</dt>
              <dd>{formatWeight(totals.containerGrossWeight)}</dd>
            </div>
            <div>
              <dt>Tare weight</dt>
              <dd>{formatWeight(totals.containerTareWeight)}</dd>
            </div>
            <div>
              <dt>Net weight</dt>
              <dd>{formatWeight(totals.containerNetWeight)}</dd>
            </div>
          </dl>
        </div>

        <div className="total-panel">
          <h3>Part Totals</h3>
          <dl>
            <div>
              <dt>Quantity</dt>
              <dd>{totals.partQuantity}</dd>
            </div>
            <div>
              <dt>Weight</dt>
              <dd>{formatWeight(totals.partWeight)}</dd>
            </div>
          </dl>
        </div>
      </section>

      {totals.hasMismatch ? (
        <div className="parts-warning" role="alert">
          Container totals do not match part totals. Review quantity and net weight before release.
        </div>
      ) : null}
    </div>
  );
}
