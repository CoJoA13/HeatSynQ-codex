import { processMasters } from '../../../data/seed';
import type { Order } from '../../../domain/types';

interface StepsTabProps {
  order: Order;
}

export function StepsTab({ order }: StepsTabProps) {
  const process = processMasters.find((entry) => entry.id === order.processMasterId);

  return (
    <div className="tab-content-stack">
      <div className="panel-heading">
        <p className="panel-kicker">Process route</p>
        <h2>Steps</h2>
      </div>

      {process ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Seq</th>
              <th>Step</th>
              <th>Furnace</th>
              <th>Temp F</th>
              <th>Minutes</th>
            </tr>
          </thead>
          <tbody>
            {process.steps.map((step) => (
              <tr key={step.id}>
                <td>{step.sequence}</td>
                <td>{step.name}</td>
                <td>{step.furnace}</td>
                <td>{step.temperatureF}</td>
                <td>{step.minutes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty-state">Select a process master to view steps.</div>
      )}
    </div>
  );
}
