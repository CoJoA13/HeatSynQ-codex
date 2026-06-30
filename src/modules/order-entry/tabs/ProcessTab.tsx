import {
  plantSupportDictionaryEntries as seededPlantSupportDictionaryEntries,
  processMasters as seededProcessMasters,
  processRevisions as seededProcessRevisions,
} from '../../../data/seed';
import { getActiveProcessRevision, getProcessDisplaySummary } from '../../../domain/processFoundation';
import type { Order, PlantSupportDictionaryEntry, ProcessMaster, ProcessRevision } from '../../../domain/types';

interface ProcessTabProps {
  order: Order;
  onOrderChange: (order: Order) => void;
  processMasters?: ProcessMaster[];
  processRevisions?: ProcessRevision[];
  plantSupportDictionaryEntries?: PlantSupportDictionaryEntry[];
}

export function ProcessTab({
  order,
  onOrderChange,
  processMasters = seededProcessMasters,
  processRevisions = seededProcessRevisions,
  plantSupportDictionaryEntries = seededPlantSupportDictionaryEntries,
}: ProcessTabProps) {
  const processMaster = processMasters.find((entry) => entry.id === order.processMasterId);
  const activeRevision = processMaster ? getActiveProcessRevision(processMaster, processRevisions) : undefined;
  const processSummary = processMaster
    ? getProcessDisplaySummary(processMaster, activeRevision, plantSupportDictionaryEntries)
    : undefined;

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
                {entry.id} - {entry.name}
              </option>
            ))}
          </select>
        </label>

        {processSummary ? (
          <dl className="definition-grid">
            <div>
              <dt>Process code</dt>
              <dd>{processSummary.processCode || 'Unassigned'}</dd>
            </div>
            <div>
              <dt>Revision</dt>
              <dd>{processSummary.revisionLabel}</dd>
            </div>
            <div>
              <dt>Material</dt>
              <dd>{processSummary.material || 'None'}</dd>
            </div>
            <div>
              <dt>Cert format</dt>
              <dd>{processSummary.certFormat || 'None'}</dd>
            </div>
            <div>
              <dt>Specification</dt>
              <dd>{processSummary.specification || 'None'}</dd>
            </div>
            <div>
              <dt>Process notes</dt>
              <dd>{activeRevision?.notes || 'None'}</dd>
            </div>
            <div>
              <dt>Step count</dt>
              <dd>{processSummary.stepCount}</dd>
            </div>
            <div>
              <dt>Required inspections</dt>
              <dd>{processSummary.requiredInspectionCount}</dd>
            </div>
          </dl>
        ) : (
          <div className="empty-state">Select a process master to review the route details.</div>
        )}
      </section>
    </div>
  );
}
