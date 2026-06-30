# Process Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `Process Maintenance` prototype module with editable active/draft process revisions, recipe steps, inspection requirements, lightweight dictionaries, part assignment, and shared active process display in Part Maintenance and Order Entry.

**Architecture:** Extend the current React/Vite seeded prototype with process foundation domain types, pure validation/assignment helpers, seeded process revisions and plant support dictionaries, and a new `Process Maintenance` module. `AppShell` owns shared in-browser process and customer-part state for cross-module integration; modules keep seed-data defaults when rendered directly in isolated tests. No backend persistence, authentication, live tracking, or full revision history is added in this slice.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, jsdom, lucide-react.

---

## Scope Check

The approved spec covers one bounded prototype slice: editable process recipe setup, active/draft revisions, inspection requirements, lightweight plant support dictionaries, active revision assignment to customer parts, and shared active process display/readiness in existing modules.

This plan does not implement backend persistence, on-prem database setup, authentication, audit history, multi-user conflict handling, live tracking/operator actuals, measured inspection result entry, full revision history/compare/restore, deep Plant Support setup, deep Order Entry auto-selection, process compatibility across multiple order parts, certification generation, or pricing/reporting.

## File Structure

- Modify: `src/domain/types.ts` - extend permissions and replace the shallow process reference model with process foundation types.
- Create: `src/domain/processFoundation.ts` - pure process readiness, dictionary, revision lookup, and assignment helpers.
- Create: `src/domain/processFoundation.test.ts` - tests for process domain rules.
- Modify: `src/domain/masterData.ts` - keep customer-part validation compatible with active process references.
- Modify: `src/domain/masterData.test.ts` - update process fixtures for the new process model.
- Modify: `src/domain/permissions.test.ts` - cover `Process Maintenance`.
- Modify: `src/data/seed.ts` - seed process masters, active/draft revisions, dictionaries, and process revision references on parts.
- Create: `src/state/heatSynQData.ts` - cloneable seeded state for AppShell-owned in-browser data.
- Modify: `src/components/AppShell.tsx` - add `Process Maintenance` navigation and shared state ownership.
- Modify: `src/components/AppShell.test.tsx` - cover new module navigation and shared assignment path.
- Create: `src/modules/process-maintenance/ProcessMaintenanceModule.tsx` - process recipe editor module.
- Create: `src/modules/process-maintenance/ProcessMaintenanceModule.test.tsx` - module interaction tests.
- Modify: `src/modules/part-maintenance/PartMaintenanceModule.tsx` - accept shared parts/process props and show active process revision summary.
- Modify: `src/modules/part-maintenance/PartMaintenanceModule.test.tsx` - cover process revision summary and assignment display.
- Modify: `src/modules/order-entry/OrderEntryModule.tsx` - accept shared process props and pass them to process tabs.
- Modify: `src/modules/order-entry/OrderEntryModule.test.tsx` - cover active revision display.
- Modify: `src/modules/order-entry/tabs/ProcessTab.tsx` - read active revision details through process helpers.
- Modify: `src/modules/order-entry/tabs/StepsTab.tsx` - read active revision steps through process helpers.
- Modify: `src/styles.css` - add process module, dictionary, step table, inspection table, and assignment panel styles.

## Task 1: Extend Process Foundation Domain Types And Seed Data

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/domain/permissions.test.ts`
- Modify: `src/data/seed.ts`
- Modify: `src/domain/masterData.test.ts`

- [ ] **Step 1: Update permission tests first**

Modify `src/domain/permissions.test.ts` to include this test:

```ts
it('allows Process Maintenance independently from other module permissions', () => {
  const user: User = {
    id: 'user-process',
    name: 'Process Engineer',
    permissions: ['Process Maintenance'],
  };

  expect(hasModulePermission(user, 'Process Maintenance')).toBe(true);
  expect(hasModulePermission(user, 'Order Entry')).toBe(false);
  expect(hasModulePermission(user, 'Customer Maintenance')).toBe(false);
  expect(hasModulePermission(user, 'Part Maintenance')).toBe(false);
});
```

- [ ] **Step 2: Run permission tests and verify they fail**

Run:

```bash
npm test src/domain/permissions.test.ts
```

Expected: FAIL because `Process Maintenance` is not part of `ModulePermission`.

- [ ] **Step 3: Extend the core process types**

Modify `src/domain/types.ts` so the permission union and process types include these exact shapes. Keep the existing customer, part, order, note, and document interfaces unless fields are explicitly added here.

```ts
export type ModulePermission = 'Order Entry' | 'Customer Maintenance' | 'Part Maintenance' | 'Process Maintenance';

export type ProcessRevisionStatus = 'Active' | 'Draft';

export type PlantSupportDictionaryKind =
  | 'Process Code'
  | 'Equipment'
  | 'Group'
  | 'Cost Center'
  | 'Inspection Code'
  | 'Inspection Scale'
  | 'Table Key'
  | 'Standard Step Template';

export interface PlantSupportDictionaryEntry {
  id: string;
  kind: PlantSupportDictionaryKind;
  code: string;
  name: string;
  description: string;
  active: boolean;
  category: string;
}

export interface ProcessStep {
  id: string;
  sequence: number;
  name: string;
  tableKeyId: string;
  processCodeId: string;
  equipmentId: string;
  groupId: string;
  costCenterId: string;
  temperatureF: number;
  minutes: number;
  tolerance: string;
  atmosphere: string;
  quenchMedia: string;
  hardnessTarget: string;
  caseDepthTarget: string;
  instructions: string;
}

export interface ProcessInspectionRequirement {
  id: string;
  inspectionCodeId: string;
  inspectionScaleId: string;
  timing: string;
  frequency: string;
  required: boolean;
  targetValue: string;
  minimumValue: string;
  maximumValue: string;
  certVisible: boolean;
  notes: string;
}

export interface ProcessRevision {
  id: string;
  processMasterId: string;
  revision: number;
  status: ProcessRevisionStatus;
  effectiveDate: string;
  processCodeId: string;
  material: string;
  specification: string;
  certificationId: string;
  certFormat: string;
  notes: string;
  steps: ProcessStep[];
  inspections: ProcessInspectionRequirement[];
}

export interface ProcessMaster {
  id: string;
  name: string;
  activeRevisionId: string;
  draftRevisionId: string;
}
```

Add `processRevisionId: string` to `CustomerPart` immediately after `processMasterId`.

- [ ] **Step 4: Update seeded process and part data**

Modify `src/data/seed.ts` imports to include `PlantSupportDictionaryEntry` and `ProcessRevision`.

Update `users[0]`:

```ts
{
  id: 'user-colton',
  name: 'Colton',
  permissions: ['Order Entry', 'Customer Maintenance', 'Part Maintenance', 'Process Maintenance'],
}
```

Replace the current `processMasters` seed with:

```ts
export const processMasters: ProcessMaster[] = [
  {
    id: '15-29900-003',
    name: 'Ductile Iron Austemper Route',
    activeRevisionId: 'proc-rev-austemper-16',
    draftRevisionId: 'proc-rev-austemper-draft',
  },
  {
    id: '12-496783-HT',
    name: '8620 Steel Carburize Route',
    activeRevisionId: 'proc-rev-carburize-4',
    draftRevisionId: '',
  },
];
```

Add `plantSupportDictionaryEntries` with these minimum entries:

```ts
export const plantSupportDictionaryEntries: PlantSupportDictionaryEntry[] = [
  { id: 'dict-process-austemper', kind: 'Process Code', code: 'AUST', name: 'Austemper', description: 'Austemper heat treat process.', active: true, category: 'Heat Treat' },
  { id: 'dict-process-carburize', kind: 'Process Code', code: 'CARB', name: 'Carburize', description: 'Carburizing heat treat process.', active: true, category: 'Heat Treat' },
  { id: 'dict-equipment-furnace-2', kind: 'Equipment', code: 'FURN-2', name: 'Furnace 2', description: 'Batch furnace used for austemper routes.', active: true, category: 'Furnace' },
  { id: 'dict-equipment-salt-1', kind: 'Equipment', code: 'SALT-1', name: 'Salt Bath 1', description: 'Salt quench bath.', active: true, category: 'Quench' },
  { id: 'dict-equipment-furnace-5', kind: 'Equipment', code: 'FURN-5', name: 'Furnace 5', description: 'Carburizing furnace.', active: true, category: 'Furnace' },
  { id: 'dict-equipment-quench-2', kind: 'Equipment', code: 'QUENCH-2', name: 'Quench 2', description: 'Oil quench tank.', active: true, category: 'Quench' },
  { id: 'dict-group-heat-treat', kind: 'Group', code: 'HT', name: 'Heat Treat', description: 'Heat treat production group.', active: true, category: 'Production' },
  { id: 'dict-cost-center-furnace', kind: 'Cost Center', code: 'CC-FURN', name: 'Furnace Operations', description: 'Furnace operations cost center.', active: true, category: 'Production' },
  { id: 'dict-cost-center-inspection', kind: 'Cost Center', code: 'CC-INSP', name: 'Inspection', description: 'Inspection cost center.', active: true, category: 'Quality' },
  { id: 'dict-inspection-hardness', kind: 'Inspection Code', code: 'HARD', name: 'Hardness', description: 'Hardness inspection requirement.', active: true, category: 'Mechanical' },
  { id: 'dict-inspection-case-depth', kind: 'Inspection Code', code: 'CASE', name: 'Case Depth', description: 'Case depth inspection requirement.', active: true, category: 'Metallurgical' },
  { id: 'dict-scale-hrc', kind: 'Inspection Scale', code: 'HRC', name: 'Rockwell C', description: 'Rockwell C hardness scale.', active: true, category: 'Hardness' },
  { id: 'dict-scale-inch', kind: 'Inspection Scale', code: 'IN', name: 'Inch', description: 'Inch-based dimensional scale.', active: true, category: 'Dimensional' },
  { id: 'dict-table-austemper-furnace', kind: 'Table Key', code: 'AUST-FURN', name: 'Austemper Furnace', description: 'Austemper furnace table key.', active: true, category: 'Austemper' },
  { id: 'dict-table-carburize-furnace', kind: 'Table Key', code: 'CARB-FURN', name: 'Carburize Furnace', description: 'Carburize furnace table key.', active: true, category: 'Carburize' },
  { id: 'dict-step-preheat', kind: 'Standard Step Template', code: 'PREHEAT', name: 'Preheat load', description: 'Standard preheat instruction.', active: true, category: 'Route Step' },
];
```

Add `processRevisions` with these minimum active/draft revisions:

```ts
export const processRevisions: ProcessRevision[] = [
  {
    id: 'proc-rev-austemper-16',
    processMasterId: '15-29900-003',
    revision: 16,
    status: 'Active',
    effectiveDate: '2026-06-01',
    processCodeId: 'dict-process-austemper',
    material: 'Ductile Iron',
    specification: 'Eq: 180; Gr: IQ',
    certificationId: '',
    certFormat: 'Generic - AM',
    notes: 'Standard austemper process for ductile iron tow components.',
    steps: [
      { id: 'step-austemper-preheat', sequence: 10, name: 'Preheat load', tableKeyId: 'dict-table-austemper-furnace', processCodeId: 'dict-process-austemper', equipmentId: 'dict-equipment-furnace-2', groupId: 'dict-group-heat-treat', costCenterId: 'dict-cost-center-furnace', temperatureF: 700, minutes: 45, tolerance: '+/- 25 F', atmosphere: 'Air', quenchMedia: '', hardnessTarget: '', caseDepthTarget: '', instructions: 'Bring load up evenly before austenitize.' },
      { id: 'step-austemper-austenitize', sequence: 20, name: 'Austenitize', tableKeyId: 'dict-table-austemper-furnace', processCodeId: 'dict-process-austemper', equipmentId: 'dict-equipment-furnace-2', groupId: 'dict-group-heat-treat', costCenterId: 'dict-cost-center-furnace', temperatureF: 1625, minutes: 90, tolerance: '+/- 15 F', atmosphere: 'Controlled', quenchMedia: '', hardnessTarget: '', caseDepthTarget: '', instructions: 'Verify furnace chart before transfer.' },
      { id: 'step-austemper-quench', sequence: 30, name: 'Quench', tableKeyId: 'dict-table-austemper-furnace', processCodeId: 'dict-process-austemper', equipmentId: 'dict-equipment-salt-1', groupId: 'dict-group-heat-treat', costCenterId: 'dict-cost-center-furnace', temperatureF: 725, minutes: 60, tolerance: '+/- 10 F', atmosphere: 'Salt', quenchMedia: 'Salt bath', hardnessTarget: '302-363 BHN', caseDepthTarget: '', instructions: 'Transfer quickly and maintain bath agitation.' },
      { id: 'step-austemper-inspection', sequence: 40, name: 'Final inspection', tableKeyId: 'dict-table-austemper-furnace', processCodeId: 'dict-process-austemper', equipmentId: 'dict-equipment-furnace-2', groupId: 'dict-group-heat-treat', costCenterId: 'dict-cost-center-inspection', temperatureF: 70, minutes: 20, tolerance: '', atmosphere: 'Ambient', quenchMedia: '', hardnessTarget: '302-363 BHN', caseDepthTarget: '', instructions: 'Inspect hardness and document certification notes.' },
    ],
    inspections: [
      { id: 'insp-austemper-hardness', inspectionCodeId: 'dict-inspection-hardness', inspectionScaleId: 'dict-scale-hrc', timing: 'Final', frequency: 'Each lot', required: true, targetValue: '302-363 BHN', minimumValue: '302 BHN', maximumValue: '363 BHN', certVisible: true, notes: 'Record hardness summary on certification package.' },
    ],
  },
  {
    id: 'proc-rev-austemper-draft',
    processMasterId: '15-29900-003',
    revision: 17,
    status: 'Draft',
    effectiveDate: '',
    processCodeId: 'dict-process-austemper',
    material: 'Ductile Iron',
    specification: '',
    certificationId: '',
    certFormat: 'Generic - AM',
    notes: 'Draft revision waiting on updated specification.',
    steps: [],
    inspections: [],
  },
  {
    id: 'proc-rev-carburize-4',
    processMasterId: '12-496783-HT',
    revision: 4,
    status: 'Active',
    effectiveDate: '2026-05-15',
    processCodeId: 'dict-process-carburize',
    material: '8620 Steel',
    specification: 'Case depth 0.030-0.040',
    certificationId: 'CERT-8620',
    certFormat: 'CERT-8620',
    notes: 'Reference process seeded from part maintenance context.',
    steps: [
      { id: 'step-carburize', sequence: 10, name: 'Carburize', tableKeyId: 'dict-table-carburize-furnace', processCodeId: 'dict-process-carburize', equipmentId: 'dict-equipment-furnace-5', groupId: 'dict-group-heat-treat', costCenterId: 'dict-cost-center-furnace', temperatureF: 1700, minutes: 180, tolerance: '+/- 20 F', atmosphere: 'Carbon enriched', quenchMedia: '', hardnessTarget: '58-62 HRC', caseDepthTarget: '0.030-0.040', instructions: 'Run carburize cycle per customer cert package.' },
      { id: 'step-oil-quench', sequence: 20, name: 'Oil quench', tableKeyId: 'dict-table-carburize-furnace', processCodeId: 'dict-process-carburize', equipmentId: 'dict-equipment-quench-2', groupId: 'dict-group-heat-treat', costCenterId: 'dict-cost-center-furnace', temperatureF: 150, minutes: 30, tolerance: '+/- 10 F', atmosphere: 'Oil', quenchMedia: 'Oil', hardnessTarget: '58-62 HRC', caseDepthTarget: '0.030-0.040', instructions: 'Agitate load during quench.' },
    ],
    inspections: [
      { id: 'insp-carburize-case', inspectionCodeId: 'dict-inspection-case-depth', inspectionScaleId: 'dict-scale-inch', timing: 'Final', frequency: 'Each lot', required: true, targetValue: '0.035 in', minimumValue: '0.030 in', maximumValue: '0.040 in', certVisible: true, notes: 'Case depth must appear on customer cert.' },
    ],
  },
];
```

Add `processRevisionId` to each seeded customer part:

```ts
processRevisionId: 'proc-rev-austemper-16',
processRevisionId: 'proc-rev-carburize-4',
processRevisionId: '',
```

- [ ] **Step 5: Update existing process fixtures in master-data tests**

Modify `src/domain/masterData.test.ts` helper process masters to use the new `ProcessMaster` shape:

```ts
const processMasters: ProcessMaster[] = [
  {
    id: '15-29900-003',
    name: 'Ductile Iron Austemper Route',
    activeRevisionId: 'proc-rev-austemper-16',
    draftRevisionId: '',
  },
];
```

Add `processRevisionId: 'proc-rev-austemper-16'` to the `part()` test helper.

- [ ] **Step 6: Run domain tests and verify they pass**

Run:

```bash
npm test src/domain/permissions.test.ts src/domain/masterData.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit process types and seed data**

Run:

```bash
git add src/domain/types.ts src/domain/permissions.test.ts src/domain/masterData.test.ts src/data/seed.ts
git commit -m "feat: add process foundation domain seeds"
```

## Task 2: Add Process Foundation Domain Helpers

**Files:**
- Create: `src/domain/processFoundation.ts`
- Create: `src/domain/processFoundation.test.ts`
- Modify: `src/domain/masterData.ts`

- [ ] **Step 1: Write failing process foundation tests**

Create `src/domain/processFoundation.test.ts` with:

```ts
import { describe, expect, it } from 'vitest';
import {
  assignProcessRevisionToParts,
  filterActiveDictionaryEntries,
  getActiveProcessRevision,
  getProcessDisplaySummary,
  getProcessRevisionReadiness,
  validateProcessRevisionForPromotion,
} from './processFoundation';
import type {
  CustomerPart,
  PlantSupportDictionaryEntry,
  ProcessMaster,
  ProcessRevision,
} from './types';

const dictionaries: PlantSupportDictionaryEntry[] = [
  { id: 'dict-process-austemper', kind: 'Process Code', code: 'AUST', name: 'Austemper', description: '', active: true, category: 'Heat Treat' },
  { id: 'dict-equipment-furnace-2', kind: 'Equipment', code: 'FURN-2', name: 'Furnace 2', description: '', active: true, category: 'Furnace' },
  { id: 'dict-equipment-old', kind: 'Equipment', code: 'OLD', name: 'Old Furnace', description: '', active: false, category: 'Furnace' },
  { id: 'dict-group-heat-treat', kind: 'Group', code: 'HT', name: 'Heat Treat', description: '', active: true, category: 'Production' },
  { id: 'dict-cost-center-furnace', kind: 'Cost Center', code: 'CC-FURN', name: 'Furnace Operations', description: '', active: true, category: 'Production' },
  { id: 'dict-inspection-hardness', kind: 'Inspection Code', code: 'HARD', name: 'Hardness', description: '', active: true, category: 'Mechanical' },
  { id: 'dict-scale-hrc', kind: 'Inspection Scale', code: 'HRC', name: 'Rockwell C', description: '', active: true, category: 'Hardness' },
  { id: 'dict-table-austemper-furnace', kind: 'Table Key', code: 'AUST-FURN', name: 'Austemper Furnace', description: '', active: true, category: 'Austemper' },
];

const processMaster: ProcessMaster = {
  id: '15-29900-003',
  name: 'Ductile Iron Austemper Route',
  activeRevisionId: 'proc-rev-active',
  draftRevisionId: 'proc-rev-draft',
};

function revision(overrides: Partial<ProcessRevision> = {}): ProcessRevision {
  return {
    id: 'proc-rev-active',
    processMasterId: processMaster.id,
    revision: 16,
    status: 'Active',
    effectiveDate: '2026-06-01',
    processCodeId: 'dict-process-austemper',
    material: 'Ductile Iron',
    specification: 'Eq: 180; Gr: IQ',
    certificationId: '',
    certFormat: 'Generic - AM',
    notes: 'Standard austemper process.',
    steps: [
      {
        id: 'step-1',
        sequence: 10,
        name: 'Austenitize',
        tableKeyId: 'dict-table-austemper-furnace',
        processCodeId: 'dict-process-austemper',
        equipmentId: 'dict-equipment-furnace-2',
        groupId: 'dict-group-heat-treat',
        costCenterId: 'dict-cost-center-furnace',
        temperatureF: 1625,
        minutes: 90,
        tolerance: '+/- 15 F',
        atmosphere: 'Controlled',
        quenchMedia: '',
        hardnessTarget: '302-363 BHN',
        caseDepthTarget: '',
        instructions: 'Verify furnace chart.',
      },
    ],
    inspections: [
      {
        id: 'insp-1',
        inspectionCodeId: 'dict-inspection-hardness',
        inspectionScaleId: 'dict-scale-hrc',
        timing: 'Final',
        frequency: 'Each lot',
        required: true,
        targetValue: '302-363 BHN',
        minimumValue: '302 BHN',
        maximumValue: '363 BHN',
        certVisible: true,
        notes: 'Record hardness.',
      },
    ],
    ...overrides,
  };
}

function part(overrides: Partial<CustomerPart> = {}): CustomerPart {
  return {
    id: 'part-1',
    partId: '15-29900-010',
    customerId: 'cust-gfmco',
    processMasterId: '',
    processRevisionId: '',
    partName: 'CNTR TOW',
    description: '',
    outgoingPartNumber: '',
    blanketPo: '',
    revision: '',
    material: '',
    specification: '',
    customerSpecification: '',
    certFormat: '',
    certRequired: false,
    eachWeight: 1,
    thickness: 0,
    inactive: false,
    partHold: false,
    shippingHold: false,
    price: { setup: 0, amount: 0, pricePer: 'Lb', minimum: 0 },
    quote: { quoteId: '', quotedQuantity: 0, effectiveDate: '', expirationDate: '', contact: '', salesPerson: '' },
    notes: '',
    ...overrides,
  };
}

describe('getProcessRevisionReadiness', () => {
  it('reports a complete active revision as ready for promotion and assignment', () => {
    expect(getProcessRevisionReadiness(revision(), dictionaries)).toEqual({
      promotable: true,
      assignable: true,
      blockers: [],
      warnings: [],
    });
  });

  it('allows saving incomplete drafts but blocks promotion and assignment', () => {
    const result = getProcessRevisionReadiness(
      revision({ status: 'Draft', specification: '', steps: [], inspections: [] }),
      dictionaries,
    );

    expect(result.promotable).toBe(false);
    expect(result.assignable).toBe(false);
    expect(result.blockers).toEqual([
      'Specification is required before promotion.',
      'At least one process step is required before promotion.',
      'At least one required inspection is required before promotion.',
      'Draft revisions cannot be assigned to parts.',
    ]);
  });
});

describe('validateProcessRevisionForPromotion', () => {
  it('blocks promotion when dictionary references are inactive or missing', () => {
    const result = validateProcessRevisionForPromotion(
      revision({
        processCodeId: 'missing-process-code',
        steps: [revision().steps[0] ? { ...revision().steps[0], equipmentId: 'dict-equipment-old' } : revision().steps[0]],
      }),
      dictionaries,
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      'Process code reference is invalid.',
      'Step 10 equipment is inactive.',
    ]);
  });
});

describe('dictionary and display helpers', () => {
  it('filters active dictionary entries by kind', () => {
    expect(filterActiveDictionaryEntries(dictionaries, 'Equipment').map((entry) => entry.id)).toEqual([
      'dict-equipment-furnace-2',
    ]);
  });

  it('finds the active revision and renders a display summary', () => {
    const active = getActiveProcessRevision(processMaster, [revision()]);

    expect(active?.id).toBe('proc-rev-active');
    expect(getProcessDisplaySummary(processMaster, active, dictionaries)).toEqual({
      processMasterId: '15-29900-003',
      name: 'Ductile Iron Austemper Route',
      revisionLabel: 'Rev 16 Active',
      processCode: 'Austemper',
      material: 'Ductile Iron',
      specification: 'Eq: 180; Gr: IQ',
      certFormat: 'Generic - AM',
      stepCount: 1,
      requiredInspectionCount: 1,
    });
  });
});

describe('assignProcessRevisionToParts', () => {
  it('assigns one active process revision to multiple selected customer parts', () => {
    const result = assignProcessRevisionToParts({
      parts: [part(), part({ id: 'part-2', partId: '15-29900-011' })],
      processMaster,
      revision: revision(),
      selectedPartIds: ['part-1', 'part-2'],
      dictionaries,
    });

    expect(result.errors).toEqual([]);
    expect(result.updatedParts.map((entry) => entry.processRevisionId)).toEqual(['proc-rev-active', 'proc-rev-active']);
    expect(result.updatedParts.map((entry) => entry.processMasterId)).toEqual(['15-29900-003', '15-29900-003']);
  });

  it('blocks assignment for draft revisions and warns before overwriting existing references', () => {
    const result = assignProcessRevisionToParts({
      parts: [part({ processMasterId: '12-496783-HT', processRevisionId: 'proc-rev-other' })],
      processMaster,
      revision: revision({ status: 'Draft' }),
      selectedPartIds: ['part-1'],
      dictionaries,
    });

    expect(result.errors).toEqual(['Draft revisions cannot be assigned to parts.']);
    expect(result.warnings).toEqual(['15-29900-010 already references another process revision.']);
  });
});
```

- [ ] **Step 2: Run process foundation tests and verify they fail**

Run:

```bash
npm test src/domain/processFoundation.test.ts
```

Expected: FAIL because `src/domain/processFoundation.ts` does not exist.

- [ ] **Step 3: Implement process foundation helpers**

Create `src/domain/processFoundation.ts` with exports matching the test imports:

```ts
import type {
  CustomerPart,
  PlantSupportDictionaryEntry,
  PlantSupportDictionaryKind,
  ProcessMaster,
  ProcessRevision,
} from './types';
import type { ValidationResult } from './masterData';

export interface ProcessRevisionReadiness {
  promotable: boolean;
  assignable: boolean;
  blockers: string[];
  warnings: string[];
}

export interface ProcessDisplaySummary {
  processMasterId: string;
  name: string;
  revisionLabel: string;
  processCode: string;
  material: string;
  specification: string;
  certFormat: string;
  stepCount: number;
  requiredInspectionCount: number;
}

export interface AssignProcessRevisionInput {
  parts: CustomerPart[];
  processMaster: ProcessMaster;
  revision: ProcessRevision;
  selectedPartIds: string[];
  dictionaries: PlantSupportDictionaryEntry[];
}

export interface AssignProcessRevisionResult {
  updatedParts: CustomerPart[];
  errors: string[];
  warnings: string[];
}

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

function findDictionaryEntry(
  dictionaries: PlantSupportDictionaryEntry[],
  id: string,
): PlantSupportDictionaryEntry | undefined {
  return dictionaries.find((entry) => entry.id === id);
}

function dictionaryName(dictionaries: PlantSupportDictionaryEntry[], id: string): string {
  return findDictionaryEntry(dictionaries, id)?.name ?? 'Unassigned';
}

function dictionaryReferenceState(dictionaries: PlantSupportDictionaryEntry[], id: string): 'valid' | 'inactive' | 'missing' {
  const entry = findDictionaryEntry(dictionaries, id);
  if (!entry) return 'missing';
  return entry.active ? 'valid' : 'inactive';
}

function pushDictionaryError(
  errors: string[],
  dictionaries: PlantSupportDictionaryEntry[],
  id: string,
  missingMessage: string,
  inactiveMessage: string,
) {
  const state = dictionaryReferenceState(dictionaries, id);
  if (state === 'missing') errors.push(missingMessage);
  if (state === 'inactive') errors.push(inactiveMessage);
}

export function filterActiveDictionaryEntries(
  dictionaries: PlantSupportDictionaryEntry[],
  kind: PlantSupportDictionaryKind,
): PlantSupportDictionaryEntry[] {
  return dictionaries.filter((entry) => entry.kind === kind && entry.active);
}

export function getActiveProcessRevision(
  processMaster: ProcessMaster,
  revisions: ProcessRevision[],
): ProcessRevision | undefined {
  return revisions.find((revision) => revision.id === processMaster.activeRevisionId);
}

export function getDraftProcessRevision(
  processMaster: ProcessMaster,
  revisions: ProcessRevision[],
): ProcessRevision | undefined {
  return revisions.find((revision) => revision.id === processMaster.draftRevisionId);
}

export function validateProcessRevisionForPromotion(
  revision: ProcessRevision,
  dictionaries: PlantSupportDictionaryEntry[],
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (isBlank(revision.processCodeId)) errors.push('Process code is required before promotion.');
  if (isBlank(revision.material)) errors.push('Material is required before promotion.');
  if (isBlank(revision.specification)) errors.push('Specification is required before promotion.');
  if (revision.steps.length === 0) errors.push('At least one process step is required before promotion.');
  if (!revision.inspections.some((inspection) => inspection.required)) {
    errors.push('At least one required inspection is required before promotion.');
  }

  if (!isBlank(revision.processCodeId)) {
    pushDictionaryError(
      errors,
      dictionaries,
      revision.processCodeId,
      'Process code reference is invalid.',
      'Process code reference is inactive.',
    );
  }

  revision.steps.forEach((step) => {
    pushDictionaryError(
      errors,
      dictionaries,
      step.equipmentId,
      `Step ${step.sequence} equipment is invalid.`,
      `Step ${step.sequence} equipment is inactive.`,
    );
    pushDictionaryError(
      errors,
      dictionaries,
      step.tableKeyId,
      `Step ${step.sequence} table key is invalid.`,
      `Step ${step.sequence} table key is inactive.`,
    );
  });

  return { valid: errors.length === 0, errors, warnings };
}

export function getProcessRevisionReadiness(
  revision: ProcessRevision,
  dictionaries: PlantSupportDictionaryEntry[],
): ProcessRevisionReadiness {
  const promotion = validateProcessRevisionForPromotion(revision, dictionaries);
  const blockers = [...promotion.errors];
  const warnings = [...promotion.warnings];

  if (revision.status === 'Draft') blockers.push('Draft revisions cannot be assigned to parts.');

  return {
    promotable: promotion.valid,
    assignable: promotion.valid && revision.status === 'Active',
    blockers,
    warnings,
  };
}

export function getProcessDisplaySummary(
  processMaster: ProcessMaster,
  revision: ProcessRevision | undefined,
  dictionaries: PlantSupportDictionaryEntry[],
): ProcessDisplaySummary {
  return {
    processMasterId: processMaster.id,
    name: processMaster.name,
    revisionLabel: revision ? `Rev ${revision.revision} ${revision.status}` : 'No active revision',
    processCode: revision ? dictionaryName(dictionaries, revision.processCodeId) : 'Unassigned',
    material: revision?.material ?? '',
    specification: revision?.specification ?? '',
    certFormat: revision?.certFormat ?? '',
    stepCount: revision?.steps.length ?? 0,
    requiredInspectionCount: revision?.inspections.filter((inspection) => inspection.required).length ?? 0,
  };
}

export function assignProcessRevisionToParts({
  parts,
  processMaster,
  revision,
  selectedPartIds,
  dictionaries,
}: AssignProcessRevisionInput): AssignProcessRevisionResult {
  const readiness = getProcessRevisionReadiness(revision, dictionaries);
  const errors = readiness.assignable ? [] : readiness.blockers;
  const selectedParts = parts.filter((part) => selectedPartIds.includes(part.id));
  const warnings = selectedParts
    .filter((part) => part.processRevisionId && part.processRevisionId !== revision.id)
    .map((part) => `${part.partId} already references another process revision.`);

  if (selectedPartIds.length === 0) errors.push('Select at least one customer part.');

  if (errors.length > 0) {
    return { updatedParts: parts, errors, warnings };
  }

  const updatedParts = parts.map((part) => {
    if (!selectedPartIds.includes(part.id)) return part;

    return {
      ...part,
      processMasterId: processMaster.id,
      processRevisionId: revision.id,
      material: revision.material || part.material,
      specification: revision.specification || part.specification,
      certFormat: revision.certFormat || part.certFormat,
    };
  });

  return { updatedParts, errors: [], warnings };
}
```

- [ ] **Step 4: Keep master-data process checks compatible**

Open `src/domain/masterData.ts` and confirm `hasProcessMaster` still checks only `process.id`. The final helper must keep this behavior:

```ts
export function hasProcessMaster(processes: ProcessMaster[], processMasterId?: string): boolean {
  if (!processMasterId) return true;
  return processes.some((process) => process.id === processMasterId);
}
```

Do not add checks against legacy process fields that were removed from `ProcessMaster`.

- [ ] **Step 5: Run process and master-data tests**

Run:

```bash
npm test src/domain/processFoundation.test.ts src/domain/masterData.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit process helpers**

Run:

```bash
git add src/domain/processFoundation.ts src/domain/processFoundation.test.ts src/domain/masterData.ts
git commit -m "feat: add process foundation rules"
```

## Task 3: Add Shared In-Browser State To AppShell

**Files:**
- Create: `src/state/heatSynQData.ts`
- Modify: `src/components/AppShell.tsx`
- Modify: `src/components/AppShell.test.tsx`
- Modify: `src/modules/part-maintenance/PartMaintenanceModule.tsx`
- Modify: `src/modules/order-entry/OrderEntryModule.tsx`

- [ ] **Step 1: Create cloneable seed state helper**

Create `src/state/heatSynQData.ts`:

```ts
import {
  customerParts,
  plantSupportDictionaryEntries,
  processMasters,
  processRevisions,
} from '../data/seed';
import type {
  CustomerPart,
  PlantSupportDictionaryEntry,
  ProcessMaster,
  ProcessRevision,
} from '../domain/types';

export interface HeatSynQDataState {
  customerParts: CustomerPart[];
  processMasters: ProcessMaster[];
  processRevisions: ProcessRevision[];
  plantSupportDictionaryEntries: PlantSupportDictionaryEntry[];
}

export function createInitialHeatSynQDataState(): HeatSynQDataState {
  return {
    customerParts: structuredClone(customerParts),
    processMasters: structuredClone(processMasters),
    processRevisions: structuredClone(processRevisions),
    plantSupportDictionaryEntries: structuredClone(plantSupportDictionaryEntries),
  };
}
```

- [ ] **Step 2: Update AppShell tests for the new module**

Modify `src/components/AppShell.test.tsx`:

- In the first test, assert the Process Maintenance button is enabled for `users[0]`.
- In the switching test, click `Process Maintenance` and assert the `Process Maintenance` heading is visible.
- In the part-only test, assert Process Maintenance is disabled.
- Add a process-only user test:

```tsx
it('defaults to Process Maintenance for a process-only user', () => {
  const processOnlyUser: User = {
    id: 'process-only',
    name: 'Process Engineer',
    permissions: ['Process Maintenance'],
  };

  render(<AppShell currentUser={processOnlyUser} />);

  expect(screen.getByRole('button', { name: 'Order Entry' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Process Maintenance' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('heading', { name: 'Process Maintenance' })).toBeInTheDocument();
});
```

- [ ] **Step 3: Run AppShell tests and verify they fail**

Run:

```bash
npm test src/components/AppShell.test.tsx
```

Expected: FAIL because AppShell does not include Process Maintenance.

- [ ] **Step 4: Make Part and Order modules accept shared process props without changing behavior**

Modify `PartMaintenanceModuleProps` in `src/modules/part-maintenance/PartMaintenanceModule.tsx`:

```ts
interface PartMaintenanceModuleProps {
  currentUser: User;
  parts?: CustomerPart[];
  onPartsChange?: (parts: CustomerPart[]) => void;
  processMasters?: ProcessMaster[];
  processRevisions?: ProcessRevision[];
  plantSupportDictionaryEntries?: PlantSupportDictionaryEntry[];
}
```

Use defaults from seed data when props are omitted:

```ts
const effectiveParts = parts ?? localParts;
const updateParts = onPartsChange ?? setLocalParts;
const effectiveProcessMasters = processMasters ?? seededProcessMasters;
const effectiveProcessRevisions = processRevisions ?? seededProcessRevisions;
const effectiveDictionaries = plantSupportDictionaryEntries ?? seededPlantSupportDictionaryEntries;
```

Replace current reads of `parts`, `setParts`, and `processMasters` with the effective variables. Keep the existing tests passing. The `effectiveProcessRevisions` and `effectiveDictionaries` names are introduced in this task even if richer display lands in Task 6.

Modify `OrderEntryModuleProps` in `src/modules/order-entry/OrderEntryModule.tsx`:

```ts
interface OrderEntryModuleProps {
  currentUser: User;
  processMasters?: ProcessMaster[];
  processRevisions?: ProcessRevision[];
  plantSupportDictionaryEntries?: PlantSupportDictionaryEntry[];
}
```

Pass the effective process props to `ProcessTab` and `StepsTab`.

- [ ] **Step 5: Wire AppShell shared state and the initial Process Maintenance shell**

Create the first `src/modules/process-maintenance/ProcessMaintenanceModule.tsx` implementation so AppShell can compile before the full editor lands:

```tsx
import { ModuleGate } from '../../components/ModuleGate';
import type {
  CustomerPart,
  PlantSupportDictionaryEntry,
  ProcessMaster,
  ProcessRevision,
  User,
} from '../../domain/types';

interface ProcessMaintenanceModuleProps {
  currentUser: User;
  processMasters: ProcessMaster[];
  processRevisions: ProcessRevision[];
  plantSupportDictionaryEntries: PlantSupportDictionaryEntry[];
  customerParts: CustomerPart[];
  onProcessMastersChange: (processMasters: ProcessMaster[]) => void;
  onProcessRevisionsChange: (processRevisions: ProcessRevision[]) => void;
  onPlantSupportDictionaryEntriesChange: (entries: PlantSupportDictionaryEntry[]) => void;
  onCustomerPartsChange: (parts: CustomerPart[]) => void;
}

export function ProcessMaintenanceModule({ currentUser }: ProcessMaintenanceModuleProps) {
  return (
    <ModuleGate user={currentUser} permission="Process Maintenance" moduleName="Process Maintenance">
      <section className="master-data-module process-maintenance-module" aria-labelledby="process-maintenance-title">
        <header className="master-data-header">
          <div>
            <p className="module-label">Process Foundation</p>
            <h1 id="process-maintenance-title">Process Maintenance</h1>
          </div>
        </header>
      </section>
    </ModuleGate>
  );
}
```

Modify `src/components/AppShell.tsx`:

- Import `useState`, `createInitialHeatSynQDataState`, and `ProcessMaintenanceModule`.
- Add `{ label: 'Process Maintenance', permission: 'Process Maintenance' }` to `modules`.
- Create shared state:

```tsx
const [heatSynQData, setHeatSynQData] = useState(createInitialHeatSynQDataState);
```

- Render `ProcessMaintenanceModule` when selected.
- Pass shared process/part state into Process Maintenance, Part Maintenance, and Order Entry.
- Use setter wrappers that update only the relevant slice:

```tsx
onCustomerPartsChange={(customerParts) => setHeatSynQData((current) => ({ ...current, customerParts }))}
```

- [ ] **Step 6: Run AppShell and existing module tests**

Run:

```bash
npm test src/components/AppShell.test.tsx src/modules/part-maintenance/PartMaintenanceModule.test.tsx src/modules/order-entry/OrderEntryModule.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit shared state shell**

Run:

```bash
git add src/state/heatSynQData.ts src/components/AppShell.tsx src/components/AppShell.test.tsx src/modules/process-maintenance/ProcessMaintenanceModule.tsx src/modules/part-maintenance/PartMaintenanceModule.tsx src/modules/order-entry/OrderEntryModule.tsx
git commit -m "feat: add process maintenance shell state"
```

## Task 4: Build Process Maintenance Recipe Editor

**Files:**
- Modify: `src/modules/process-maintenance/ProcessMaintenanceModule.tsx`
- Create: `src/modules/process-maintenance/ProcessMaintenanceModule.test.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write failing Process Maintenance interaction tests**

Create `src/modules/process-maintenance/ProcessMaintenanceModule.test.tsx` with:

```tsx
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  customerParts,
  plantSupportDictionaryEntries,
  processMasters,
  processRevisions,
  users,
} from '../../data/seed';
import { ProcessMaintenanceModule } from './ProcessMaintenanceModule';

function renderProcessMaintenance() {
  const onProcessMastersChange = vi.fn();
  const onProcessRevisionsChange = vi.fn();
  const onPlantSupportDictionaryEntriesChange = vi.fn();
  const onCustomerPartsChange = vi.fn();

  render(
    <ProcessMaintenanceModule
      currentUser={users[0]}
      processMasters={structuredClone(processMasters)}
      processRevisions={structuredClone(processRevisions)}
      plantSupportDictionaryEntries={structuredClone(plantSupportDictionaryEntries)}
      customerParts={structuredClone(customerParts)}
      onProcessMastersChange={onProcessMastersChange}
      onProcessRevisionsChange={onProcessRevisionsChange}
      onPlantSupportDictionaryEntriesChange={onPlantSupportDictionaryEntriesChange}
      onCustomerPartsChange={onCustomerPartsChange}
    />,
  );

  return {
    onProcessMastersChange,
    onProcessRevisionsChange,
    onPlantSupportDictionaryEntriesChange,
    onCustomerPartsChange,
  };
}

describe('ProcessMaintenanceModule', () => {
  it('blocks users without Process Maintenance permission', () => {
    render(
      <ProcessMaintenanceModule
        currentUser={users[1]}
        processMasters={processMasters}
        processRevisions={processRevisions}
        plantSupportDictionaryEntries={plantSupportDictionaryEntries}
        customerParts={customerParts}
        onProcessMastersChange={vi.fn()}
        onProcessRevisionsChange={vi.fn()}
        onPlantSupportDictionaryEntriesChange={vi.fn()}
        onCustomerPartsChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Process Maintenance permission required')).toBeInTheDocument();
  });

  it('searches process masters and displays active and draft revision status', async () => {
    const user = userEvent.setup();
    renderProcessMaintenance();

    await user.type(screen.getByLabelText('Search processes'), 'austemper');
    await user.click(screen.getByRole('button', { name: /15-29900-003 Ductile Iron Austemper Route/i }));

    expect(screen.getByRole('heading', { name: 'Process Maintenance' })).toBeInTheDocument();
    expect(screen.getByText('Rev 16 Active')).toBeInTheDocument();
    expect(screen.getByText('Rev 17 Draft')).toBeInTheDocument();
  });

  it('saves an incomplete draft and keeps promotion blockers visible', async () => {
    const user = userEvent.setup();
    const { onProcessRevisionsChange } = renderProcessMaintenance();

    await user.click(screen.getByRole('button', { name: /15-29900-003 Ductile Iron Austemper Route/i }));
    await user.click(screen.getByRole('button', { name: 'Save Draft' }));

    expect(onProcessRevisionsChange).toHaveBeenCalled();
    expect(screen.getByText('Draft saved.')).toBeVisible();
    expect(screen.getByText('Specification is required before promotion.')).toBeVisible();
  });

  it('adds, duplicates, moves, and removes process steps in the draft', async () => {
    const user = userEvent.setup();
    renderProcessMaintenance();

    await user.click(screen.getByRole('button', { name: /15-29900-003 Ductile Iron Austemper Route/i }));
    await user.click(screen.getByRole('button', { name: 'Add Step' }));
    await user.type(screen.getByLabelText('Draft step 1 name'), 'Temper check');
    await user.click(screen.getByRole('button', { name: 'Duplicate Draft Step 1' }));
    await user.click(screen.getByRole('button', { name: 'Move Draft Step 2 Up' }));
    await user.click(screen.getByRole('button', { name: 'Remove Draft Step 1' }));

    const stepTable = screen.getByRole('table', { name: 'Recipe steps' });
    expect(within(stepTable).getAllByRole('row')).toHaveLength(2);
  });

  it('adds an inspection requirement with acceptance targets', async () => {
    const user = userEvent.setup();
    renderProcessMaintenance();

    await user.click(screen.getByRole('button', { name: /15-29900-003 Ductile Iron Austemper Route/i }));
    await user.click(screen.getByRole('button', { name: 'Add Inspection' }));
    await user.type(screen.getByLabelText('Draft inspection 1 target value'), '302-363 BHN');
    await user.type(screen.getByLabelText('Draft inspection 1 minimum value'), '302 BHN');
    await user.type(screen.getByLabelText('Draft inspection 1 maximum value'), '363 BHN');

    expect(screen.getByLabelText('Draft inspection 1 target value')).toHaveDisplayValue('302-363 BHN');
  });
});
```

- [ ] **Step 2: Run Process Maintenance tests and verify they fail**

Run:

```bash
npm test src/modules/process-maintenance/ProcessMaintenanceModule.test.tsx
```

Expected: FAIL because the initial shell does not implement the required interactions.

- [ ] **Step 3: Implement process search, revision header, readiness, steps, and inspections**

Replace `src/modules/process-maintenance/ProcessMaintenanceModule.tsx` with a stateful module that:

- Uses the props created in Task 3.
- Tracks `selectedProcessMasterId`, `draftRevision`, `searchQuery`, `validationMessages`, and `saveSummary`.
- Selects the first process master by default.
- Uses `getActiveProcessRevision`, `getDraftProcessRevision`, `getProcessDisplaySummary`, and `getProcessRevisionReadiness`.
- Provides `saveDraft`, `addStep`, `duplicateStep`, `moveStep`, `removeStep`, and `addInspection`.
- Calls `onProcessRevisionsChange` when saving the draft.
- Displays promotion blockers in a `role="alert"` summary when present.

Use these button labels and accessible labels exactly so tests can find them:

```tsx
<button type="button">Save Draft</button>
<button type="button">Add Step</button>
<button type="button">Add Inspection</button>
aria-label={`Draft step ${index + 1} name`}
aria-label={`Duplicate Draft Step ${index + 1}`}
aria-label={`Move Draft Step ${index + 1} Up`}
aria-label={`Remove Draft Step ${index + 1}`}
aria-label={`Draft inspection ${index + 1} target value`}
aria-label={`Draft inspection ${index + 1} minimum value`}
aria-label={`Draft inspection ${index + 1} maximum value`}
```

For a new step, use this object shape:

```ts
{
  id: `step-${crypto.randomUUID()}`,
  sequence: nextSequence,
  name: '',
  tableKeyId: activeTableKeys[0]?.id ?? '',
  processCodeId: activeProcessCodes[0]?.id ?? '',
  equipmentId: activeEquipment[0]?.id ?? '',
  groupId: activeGroups[0]?.id ?? '',
  costCenterId: activeCostCenters[0]?.id ?? '',
  temperatureF: 0,
  minutes: 0,
  tolerance: '',
  atmosphere: '',
  quenchMedia: '',
  hardnessTarget: '',
  caseDepthTarget: '',
  instructions: '',
}
```

For a new inspection, use this object shape:

```ts
{
  id: `inspection-${crypto.randomUUID()}`,
  inspectionCodeId: activeInspectionCodes[0]?.id ?? '',
  inspectionScaleId: activeInspectionScales[0]?.id ?? '',
  timing: 'Final',
  frequency: 'Each lot',
  required: true,
  targetValue: '',
  minimumValue: '',
  maximumValue: '',
  certVisible: true,
  notes: '',
}
```

- [ ] **Step 4: Add process module styles**

Append styles to `src/styles.css` for:

```css
.process-maintenance-module .process-revision-grid,
.process-maintenance-module .process-workflow-grid {
  display: grid;
  gap: 12px;
}

.process-revision-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.process-table-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.process-assignment-panel {
  display: grid;
  gap: 10px;
}
```

Keep selectors compatible with existing `master-data-module`, `master-section`, `data-table`, and `toolbar-button` styles. Do not add a landing page or decorative hero.

- [ ] **Step 5: Run Process Maintenance tests**

Run:

```bash
npm test src/modules/process-maintenance/ProcessMaintenanceModule.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit recipe editor**

Run:

```bash
git add src/modules/process-maintenance/ProcessMaintenanceModule.tsx src/modules/process-maintenance/ProcessMaintenanceModule.test.tsx src/styles.css
git commit -m "feat: add process recipe editor"
```

## Task 5: Add Dictionary Editing And Draft Promotion

**Files:**
- Modify: `src/modules/process-maintenance/ProcessMaintenanceModule.tsx`
- Modify: `src/modules/process-maintenance/ProcessMaintenanceModule.test.tsx`
- Modify: `src/domain/processFoundation.ts`
- Modify: `src/domain/processFoundation.test.ts`

- [ ] **Step 1: Add failing tests for dictionary editing and promotion**

Append to `src/modules/process-maintenance/ProcessMaintenanceModule.test.tsx`:

```tsx
it('adds and inactivates lightweight dictionary entries', async () => {
  const user = userEvent.setup();
  const { onPlantSupportDictionaryEntriesChange } = renderProcessMaintenance();

  await user.click(screen.getByRole('button', { name: /15-29900-003 Ductile Iron Austemper Route/i }));
  await user.click(screen.getByRole('button', { name: 'Add Dictionary Entry' }));
  await user.selectOptions(screen.getByLabelText('Dictionary kind'), 'Equipment');
  await user.type(screen.getByLabelText('Dictionary code'), 'FURN-9');
  await user.type(screen.getByLabelText('Dictionary name'), 'Furnace 9');
  await user.click(screen.getByRole('button', { name: 'Save Dictionary Entry' }));

  expect(onPlantSupportDictionaryEntriesChange).toHaveBeenCalled();
  expect(screen.getByText('Furnace 9')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Inactivate Furnace 9' }));

  expect(screen.getByText('Inactive')).toBeInTheDocument();
});

it('promotes a ready draft revision to active', async () => {
  const user = userEvent.setup();
  const { onProcessMastersChange, onProcessRevisionsChange } = renderProcessMaintenance();

  await user.click(screen.getByRole('button', { name: /12-496783-HT 8620 Steel Carburize Route/i }));
  await user.click(screen.getByRole('button', { name: 'New Draft Revision' }));
  await user.click(screen.getByRole('button', { name: 'Add Step' }));
  await user.click(screen.getByRole('button', { name: 'Add Inspection' }));
  await user.click(screen.getByRole('button', { name: 'Promote Draft' }));

  expect(onProcessMastersChange).toHaveBeenCalled();
  expect(onProcessRevisionsChange).toHaveBeenCalled();
  expect(screen.getByText('Draft promoted to active revision.')).toBeVisible();
});
```

Append to `src/domain/processFoundation.test.ts`:

```ts
describe('promoteProcessDraftRevision', () => {
  it('turns a ready draft into the active revision and updates the process master', () => {
    const draft = revision({ id: 'proc-rev-draft', status: 'Draft', revision: 17 });
    const { processMaster: updatedMaster, revisions } = promoteProcessDraftRevision(
      processMaster,
      [revision(), draft],
      draft.id,
      dictionaries,
    );

    expect(updatedMaster.activeRevisionId).toBe('proc-rev-draft');
    expect(updatedMaster.draftRevisionId).toBe('');
    expect(revisions.find((entry) => entry.id === 'proc-rev-draft')?.status).toBe('Active');
  });
});
```

- [ ] **Step 2: Run focused tests and verify they fail**

Run:

```bash
npm test src/domain/processFoundation.test.ts src/modules/process-maintenance/ProcessMaintenanceModule.test.tsx
```

Expected: FAIL because promotion and dictionary editing are not implemented.

- [ ] **Step 3: Add promotion helper**

Export from `src/domain/processFoundation.ts`:

```ts
export interface PromoteProcessDraftRevisionResult {
  processMaster: ProcessMaster;
  revisions: ProcessRevision[];
  errors: string[];
}

export function promoteProcessDraftRevision(
  processMaster: ProcessMaster,
  revisions: ProcessRevision[],
  draftRevisionId: string,
  dictionaries: PlantSupportDictionaryEntry[],
): PromoteProcessDraftRevisionResult {
  const draftRevision = revisions.find((revision) => revision.id === draftRevisionId);
  if (!draftRevision) {
    return { processMaster, revisions, errors: ['Draft revision was not found.'] };
  }

  const validation = validateProcessRevisionForPromotion(draftRevision, dictionaries);
  if (!validation.valid) {
    return { processMaster, revisions, errors: validation.errors };
  }

  const promotedDraft: ProcessRevision = { ...draftRevision, status: 'Active' };
  const demotedActive = revisions.find((revision) => revision.id === processMaster.activeRevisionId);
  const nextRevisions = revisions.map((revision) => {
    if (revision.id === promotedDraft.id) return promotedDraft;
    if (demotedActive && revision.id === demotedActive.id) return { ...revision, status: 'Draft' as const };
    return revision;
  });

  return {
    processMaster: { ...processMaster, activeRevisionId: promotedDraft.id, draftRevisionId: '' },
    revisions: nextRevisions,
    errors: [],
  };
}
```

- [ ] **Step 4: Implement dictionary editing and promotion UI**

In `ProcessMaintenanceModule.tsx`:

- Add local dictionary draft state with fields `kind`, `code`, `name`, `description`, `category`, `active`.
- Add buttons `Add Dictionary Entry`, `Save Dictionary Entry`, and `Inactivate ${entry.name}`.
- On save, append a new `PlantSupportDictionaryEntry` and call `onPlantSupportDictionaryEntriesChange`.
- On inactivate, set `active: false` for the selected dictionary entry and call `onPlantSupportDictionaryEntriesChange`.
- Add `New Draft Revision` action that creates a draft revision for a selected process master when none exists.
- Add `Promote Draft` action that uses `promoteProcessDraftRevision`, calls `onProcessMastersChange` and `onProcessRevisionsChange`, and shows `Draft promoted to active revision.` on success.

Use these exact labels:

```tsx
<button type="button">Add Dictionary Entry</button>
<label>Dictionary kind</label>
<label>Dictionary code</label>
<label>Dictionary name</label>
<button type="button">Save Dictionary Entry</button>
<button type="button">New Draft Revision</button>
<button type="button">Promote Draft</button>
```

- [ ] **Step 5: Run focused tests**

Run:

```bash
npm test src/domain/processFoundation.test.ts src/modules/process-maintenance/ProcessMaintenanceModule.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit dictionaries and promotion**

Run:

```bash
git add src/domain/processFoundation.ts src/domain/processFoundation.test.ts src/modules/process-maintenance/ProcessMaintenanceModule.tsx src/modules/process-maintenance/ProcessMaintenanceModule.test.tsx
git commit -m "feat: support process dictionaries and promotion"
```

## Task 6: Add Process-To-Part Assignment

**Files:**
- Modify: `src/modules/process-maintenance/ProcessMaintenanceModule.tsx`
- Modify: `src/modules/process-maintenance/ProcessMaintenanceModule.test.tsx`
- Modify: `src/modules/part-maintenance/PartMaintenanceModule.tsx`
- Modify: `src/modules/part-maintenance/PartMaintenanceModule.test.tsx`

- [ ] **Step 1: Add failing assignment tests**

Append to `src/modules/process-maintenance/ProcessMaintenanceModule.test.tsx`:

```tsx
it('assigns the active process revision to multiple customer parts', async () => {
  const user = userEvent.setup();
  const { onCustomerPartsChange } = renderProcessMaintenance();

  await user.click(screen.getByRole('button', { name: /15-29900-003 Ductile Iron Austemper Route/i }));
  await user.click(screen.getByLabelText('Assign 15-29900-DRAFT Draft Tow Variation'));
  await user.click(screen.getByRole('button', { name: 'Assign To Parts' }));

  expect(onCustomerPartsChange).toHaveBeenCalled();
  expect(screen.getByText('Assigned process revision to 1 part.')).toBeVisible();
});

it('blocks assigning a draft revision to parts', async () => {
  const user = userEvent.setup();
  renderProcessMaintenance();

  await user.click(screen.getByRole('button', { name: /15-29900-003 Ductile Iron Austemper Route/i }));
  await user.click(screen.getByRole('button', { name: 'Use Draft For Assignment Preview' }));
  await user.click(screen.getByLabelText('Assign 15-29900-DRAFT Draft Tow Variation'));
  await user.click(screen.getByRole('button', { name: 'Assign To Parts' }));

  expect(screen.getByText('Draft revisions cannot be assigned to parts.')).toBeVisible();
});
```

Append to `src/modules/part-maintenance/PartMaintenanceModule.test.tsx`:

```tsx
it('shows shared active process revision details for a linked part', async () => {
  const user = userEvent.setup();
  render(<PartMaintenanceModule currentUser={users[0]} />);

  await user.type(screen.getByLabelText('Search parts'), '15-29900-010');
  await user.click(screen.getByRole('button', { name: /15-29900-010 CNTR TOW/i }));

  expect(screen.getByText('Rev 16 Active')).toBeInTheDocument();
  expect(screen.getByText('4 process steps')).toBeInTheDocument();
  expect(screen.getByText('1 required inspection')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run assignment tests and verify they fail**

Run:

```bash
npm test src/modules/process-maintenance/ProcessMaintenanceModule.test.tsx src/modules/part-maintenance/PartMaintenanceModule.test.tsx
```

Expected: FAIL because assignment UI and Part Maintenance summary do not exist.

- [ ] **Step 3: Implement assignment panel in Process Maintenance**

In `ProcessMaintenanceModule.tsx`:

- Track `selectedPartIds`.
- Add an assignment panel with checkboxes for customer parts.
- For each part, use this accessible label:

```tsx
aria-label={`Assign ${part.partId} ${part.partName || 'Unnamed part'}`}
```

- Add button `Use Draft For Assignment Preview` only for testing and prototype preview; it should switch the assignment target from active revision to draft revision without changing active data.
- Make `Assign To Parts` call `assignProcessRevisionToParts`.
- On success, call `onCustomerPartsChange(result.updatedParts)`.
- Show `Assigned process revision to ${selectedPartIds.length} part.` for one part and `Assigned process revision to ${selectedPartIds.length} parts.` for more than one.
- Show warnings and errors in the same `validation-summary` pattern used by other modules.

- [ ] **Step 4: Show process revision summary in Part Maintenance**

In `PartMaintenanceModule.tsx`:

- Use `getActiveProcessRevision` and `getProcessDisplaySummary` for the selected draft part.
- Show a compact process summary inside `Process And Requirements`.
- Include visible text:
  - `Rev 16 Active`
  - `${stepCount} process steps`
  - `${requiredInspectionCount} required inspection` or `${requiredInspectionCount} required inspections`
- Use effective process props introduced in Task 3.

- [ ] **Step 5: Run assignment and part tests**

Run:

```bash
npm test src/modules/process-maintenance/ProcessMaintenanceModule.test.tsx src/modules/part-maintenance/PartMaintenanceModule.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit process assignment integration**

Run:

```bash
git add src/modules/process-maintenance/ProcessMaintenanceModule.tsx src/modules/process-maintenance/ProcessMaintenanceModule.test.tsx src/modules/part-maintenance/PartMaintenanceModule.tsx src/modules/part-maintenance/PartMaintenanceModule.test.tsx
git commit -m "feat: assign process revisions to parts"
```

## Task 7: Integrate Active Process Revisions Into Order Entry

**Files:**
- Modify: `src/modules/order-entry/OrderEntryModule.tsx`
- Modify: `src/modules/order-entry/OrderEntryModule.test.tsx`
- Modify: `src/modules/order-entry/tabs/ProcessTab.tsx`
- Modify: `src/modules/order-entry/tabs/StepsTab.tsx`

- [ ] **Step 1: Add failing Order Entry integration test**

Append to `src/modules/order-entry/OrderEntryModule.test.tsx`:

```tsx
it('displays active process revision details and enhanced steps from shared process data', async () => {
  const user = userEvent.setup();
  render(<OrderEntryModule currentUser={users[0]} />);

  await user.click(screen.getByRole('tab', { name: 'Process' }));
  await user.selectOptions(screen.getByLabelText('Process master'), '15-29900-003');

  expect(screen.getByText('Rev 16 Active')).toBeInTheDocument();
  expect(screen.getByText('Generic - AM')).toBeInTheDocument();

  await user.click(screen.getByRole('tab', { name: 'Steps' }));

  expect(screen.getByText('Austenitize')).toBeInTheDocument();
  expect(screen.getByText('+/- 15 F')).toBeInTheDocument();
  expect(screen.getByText('Controlled')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run Order Entry tests and verify they fail**

Run:

```bash
npm test src/modules/order-entry/OrderEntryModule.test.tsx
```

Expected: FAIL because ProcessTab and StepsTab still display the old process reference shape.

- [ ] **Step 3: Update ProcessTab to display active revision summary**

Modify `src/modules/order-entry/tabs/ProcessTab.tsx`:

- Accept props `processMasters`, `processRevisions`, and `plantSupportDictionaryEntries`.
- Use `getActiveProcessRevision` and `getProcessDisplaySummary`.
- Keep the `<select aria-label="Process master">` behavior.
- Display:
  - process code
  - revision label
  - material
  - cert format
  - specification
  - process notes
  - step count
  - required inspection count

Use these labels in the definition list:

```tsx
<dt>Revision</dt>
<dt>Cert format</dt>
<dt>Required inspections</dt>
```

- [ ] **Step 4: Update StepsTab to display active revision steps**

Modify `src/modules/order-entry/tabs/StepsTab.tsx`:

- Accept props `processMasters`, `processRevisions`, and `plantSupportDictionaryEntries`.
- Resolve the active revision for the selected process master.
- Render columns:
  - Seq
  - Step
  - Equipment
  - Temp F
  - Minutes
  - Tolerance
  - Atmosphere
  - Instructions
- Resolve equipment names from dictionary entries.

- [ ] **Step 5: Run Order Entry tests**

Run:

```bash
npm test src/modules/order-entry/OrderEntryModule.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit Order Entry process integration**

Run:

```bash
git add src/modules/order-entry/OrderEntryModule.tsx src/modules/order-entry/OrderEntryModule.test.tsx src/modules/order-entry/tabs/ProcessTab.tsx src/modules/order-entry/tabs/StepsTab.tsx
git commit -m "feat: show active process revisions in order entry"
```

## Task 8: Final Verification And Build

**Files:**
- Modify only if verification exposes a specific defect.

- [ ] **Step 1: Run all tests**

Run:

```bash
npm test
```

Expected: PASS for all Vitest suites.

- [ ] **Step 2: Run TypeScript lint**

Run:

```bash
npm run lint
```

Expected: exit 0.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: exit 0 and Vite writes `dist/`.

- [ ] **Step 4: Inspect git status**

Run:

```bash
git status -sb
```

Expected: clean working tree except ignored `dist/`, `node_modules/`, and local `.superpowers/` artifacts.

- [ ] **Step 5: Manual smoke check**

Run:

```bash
npm run dev
```

Expected: Vite prints a local URL. Open it if the environment allows browser access and verify:

- module nav shows `Order Entry`, `Customer Maintenance`, `Part Maintenance`, and `Process Maintenance`;
- Process Maintenance opens for the seeded admin user;
- Process Maintenance search finds `15-29900-003`;
- draft revision warnings are visible before promotion;
- recipe steps can be added and edited without layout overlap;
- inspection requirements can be added and edited without layout overlap;
- active revision assignment updates the selected part in browser state;
- Part Maintenance shows revision, step count, and inspection count for a linked process;
- Order Entry Process and Steps tabs show active revision details.

- [ ] **Step 6: Commit verification fixes if needed**

If verification required code changes, run:

```bash
git add src
git commit -m "fix: stabilize process foundation prototype"
```

Expected: use this commit only when a specific verification defect was fixed.

## Self-Review Checklist

- Spec coverage: Tasks 1-7 cover `Process Maintenance` permission, process masters, active/draft revisions, recipe steps, selected engineering fields, inspection requirements, lightweight dictionaries, process-to-part assignment, shared AppShell-owned state, Part Maintenance display, and Order Entry display.
- Deferred scope: backend persistence, on-prem database, authentication, audit history, multi-user conflict handling, live tracking, measured inspection result entry, full revision history, deep Plant Support, and deep Order Entry auto-selection stay outside this implementation.
- Type consistency: `ProcessMaster`, `ProcessRevision`, `ProcessStep`, `ProcessInspectionRequirement`, `PlantSupportDictionaryEntry`, `ProcessPartAssignment`, `processRevisionId`, `getActiveProcessRevision`, `getProcessDisplaySummary`, `getProcessRevisionReadiness`, and `assignProcessRevisionToParts` use the same names across tasks.
- Verification: every task has focused tests and a commit step; final verification includes all tests, TypeScript lint, production build, git status, and manual smoke check.
