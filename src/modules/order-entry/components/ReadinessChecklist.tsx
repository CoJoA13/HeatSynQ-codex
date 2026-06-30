import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { OrderEntryTab, ReadinessKey, ReadinessResult } from '../../../domain/readiness';

interface ChecklistItem {
  key: ReadinessKey;
  label: string;
  tab: OrderEntryTab;
}

const checklistItems: ChecklistItem[] = [
  { key: 'customer', label: 'Assigned customer', tab: 'Order Top' },
  { key: 'container', label: 'At least one container', tab: 'Parts' },
  { key: 'part', label: 'At least one part', tab: 'Parts' },
  { key: 'quantityOrWeight', label: 'Quantity or weight', tab: 'Parts' },
  { key: 'processMaster', label: 'Existing process master', tab: 'Process' },
  { key: 'clearance', label: 'Order Entry permission', tab: 'Order Top' },
];

interface ReadinessChecklistProps {
  readiness: ReadinessResult;
}

export function ReadinessChecklist({ readiness }: ReadinessChecklistProps) {
  const missingKeys = new Set(readiness.missing.map((item) => item.key));

  return (
    <aside className="readiness-checklist" aria-labelledby="readiness-title">
      <div className="readiness-heading">
        <div>
          <p className="panel-kicker">Release gate</p>
          <h2 id="readiness-title">Readiness Checklist</h2>
        </div>
        <span className="readiness-count">{readiness.ready ? 'Complete' : `${readiness.missing.length} open`}</span>
      </div>

      <ul className="readiness-list">
        {checklistItems.map((item) => {
          const missing = missingKeys.has(item.key);

          return (
            <li key={item.key} className={missing ? 'readiness-item readiness-item-open' : 'readiness-item'}>
              {missing ? <AlertCircle size={17} aria-hidden="true" /> : <CheckCircle2 size={17} aria-hidden="true" />}
              <span className="readiness-item-label">{item.label}</span>
              <span className="readiness-item-tab">{item.tab}</span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
