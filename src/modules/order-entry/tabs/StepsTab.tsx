import {
  plantSupportDictionaryEntries as seededPlantSupportDictionaryEntries,
  processMasters as seededProcessMasters,
  processRevisions as seededProcessRevisions,
} from '../../../data/seed';
import { getActiveProcessRevision } from '../../../domain/processFoundation';
import type { Order, PlantSupportDictionaryEntry, ProcessMaster, ProcessRevision } from '../../../domain/types';

interface StepsTabProps {
  order: Order;
  processMasters?: ProcessMaster[];
  processRevisions?: ProcessRevision[];
  plantSupportDictionaryEntries?: PlantSupportDictionaryEntry[];
}

function getDictionaryName(entries: PlantSupportDictionaryEntry[], id: string): string {
  return entries.find((entry) => entry.id === id)?.name ?? id;
}

export function StepsTab({
  order,
  processMasters = seededProcessMasters,
  processRevisions = seededProcessRevisions,
  plantSupportDictionaryEntries = seededPlantSupportDictionaryEntries,
}: StepsTabProps) {
  const processMaster = processMasters.find((entry) => entry.id === order.processMasterId);
  const activeRevision = processMaster ? getActiveProcessRevision(processMaster, processRevisions) : undefined;

  return (
    <div className="tab-content-stack">
      <div className="panel-heading">
        <p className="panel-kicker">Process route</p>
        <h2>Steps</h2>
      </div>

      {activeRevision ? (
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
            {activeRevision.steps.map((step) => (
              <tr key={step.id}>
                <td>{step.sequence}</td>
                <td>{step.name}</td>
                <td>{getDictionaryName(plantSupportDictionaryEntries, step.equipmentId)}</td>
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
