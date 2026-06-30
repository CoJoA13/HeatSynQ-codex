import { describe, expect, it } from 'vitest';
import {
  assignProcessRevisionToParts,
  filterActiveDictionaryEntries,
  getActiveProcessRevision,
  getDraftProcessRevision,
  getProcessDisplaySummary,
  getProcessRevisionReadiness,
  promoteProcessDraftRevision,
  validateProcessRevisionForPromotion,
} from './processFoundation';
import type {
  CustomerPart,
  PlantSupportDictionaryEntry,
  ProcessInspectionRequirement,
  ProcessMaster,
  ProcessRevision,
  ProcessStep,
} from './types';

const dictionaries: PlantSupportDictionaryEntry[] = [
  {
    id: 'dict-process-austemper',
    kind: 'Process Code',
    code: 'AUST',
    name: 'Austemper',
    description: 'Austemper heat treat process.',
    active: true,
    category: 'Heat Treat',
  },
  {
    id: 'dict-process-old',
    kind: 'Process Code',
    code: 'OLD',
    name: 'Old Process',
    description: 'Inactive process code.',
    active: false,
    category: 'Heat Treat',
  },
  {
    id: 'dict-equipment-furnace',
    kind: 'Equipment',
    code: 'FURN',
    name: 'Furnace 2',
    description: 'Batch furnace.',
    active: true,
    category: 'Furnace',
  },
  {
    id: 'dict-equipment-old',
    kind: 'Equipment',
    code: 'OLD-FURN',
    name: 'Old Furnace',
    description: 'Inactive furnace.',
    active: false,
    category: 'Furnace',
  },
  {
    id: 'dict-group-heat-treat',
    kind: 'Group',
    code: 'HT',
    name: 'Heat Treat',
    description: 'Heat treat group.',
    active: true,
    category: 'Production',
  },
  {
    id: 'dict-group-old',
    kind: 'Group',
    code: 'OLD-HT',
    name: 'Old Heat Treat',
    description: 'Inactive heat treat group.',
    active: false,
    category: 'Production',
  },
  {
    id: 'dict-cost-center-furnace',
    kind: 'Cost Center',
    code: 'CC-FURN',
    name: 'Furnace Operations',
    description: 'Furnace cost center.',
    active: true,
    category: 'Production',
  },
  {
    id: 'dict-cost-center-old',
    kind: 'Cost Center',
    code: 'OLD-CC',
    name: 'Old Cost Center',
    description: 'Inactive cost center.',
    active: false,
    category: 'Production',
  },
  {
    id: 'dict-inspection-hardness',
    kind: 'Inspection Code',
    code: 'HARD',
    name: 'Hardness',
    description: 'Hardness inspection.',
    active: true,
    category: 'Mechanical',
  },
  {
    id: 'dict-inspection-old',
    kind: 'Inspection Code',
    code: 'OLD-HARD',
    name: 'Old Hardness',
    description: 'Inactive inspection.',
    active: false,
    category: 'Mechanical',
  },
  {
    id: 'dict-scale-bhn',
    kind: 'Inspection Scale',
    code: 'BHN',
    name: 'Brinell Hardness',
    description: 'BHN scale.',
    active: true,
    category: 'Hardness',
  },
  {
    id: 'dict-scale-hrc',
    kind: 'Inspection Scale',
    code: 'HRC',
    name: 'Rockwell C',
    description: 'HRC scale.',
    active: true,
    category: 'Hardness',
  },
  {
    id: 'dict-scale-old',
    kind: 'Inspection Scale',
    code: 'OLD',
    name: 'Old Scale',
    description: 'Inactive scale.',
    active: false,
    category: 'Hardness',
  },
  {
    id: 'dict-table-austemper',
    kind: 'Table Key',
    code: 'AUST-FURN',
    name: 'Austemper Furnace',
    description: 'Austemper furnace table.',
    active: true,
    category: 'Austemper',
  },
  {
    id: 'dict-table-old',
    kind: 'Table Key',
    code: 'OLD-TABLE',
    name: 'Old Table',
    description: 'Inactive table key.',
    active: false,
    category: 'Austemper',
  },
];

const processMaster: ProcessMaster = {
  id: '15-29900-003',
  name: 'Ductile Iron Austemper Route',
  activeRevisionId: 'proc-rev-active',
  draftRevisionId: 'proc-rev-draft',
};

function step(overrides: Partial<ProcessStep> = {}): ProcessStep {
  return {
    id: 'step-preheat',
    sequence: 10,
    name: 'Preheat load',
    tableKeyId: 'dict-table-austemper',
    processCodeId: 'dict-process-austemper',
    equipmentId: 'dict-equipment-furnace',
    groupId: 'dict-group-heat-treat',
    costCenterId: 'dict-cost-center-furnace',
    temperatureF: 700,
    minutes: 45,
    tolerance: '+/- 25 F',
    atmosphere: 'Air',
    quenchMedia: '',
    hardnessTarget: '',
    caseDepthTarget: '',
    instructions: 'Bring load up evenly.',
    ...overrides,
  };
}

function inspection(overrides: Partial<ProcessInspectionRequirement> = {}): ProcessInspectionRequirement {
  return {
    id: 'insp-hardness',
    inspectionCodeId: 'dict-inspection-hardness',
    inspectionScaleId: 'dict-scale-bhn',
    timing: 'Final',
    frequency: 'Each lot',
    required: true,
    targetValue: '302-363 BHN',
    minimumValue: '302 BHN',
    maximumValue: '363 BHN',
    certVisible: true,
    notes: 'Record hardness summary.',
    ...overrides,
  };
}

function revision(overrides: Partial<ProcessRevision> = {}): ProcessRevision {
  return {
    id: 'proc-rev-active',
    processMasterId: '15-29900-003',
    revision: 16,
    status: 'Active',
    effectiveDate: '2026-06-01',
    processCodeId: 'dict-process-austemper',
    material: 'Ductile Iron',
    specification: 'Eq: 180; Gr: IQ',
    certificationId: '',
    certFormat: 'Generic - AM',
    notes: 'Standard austemper process.',
    steps: [step()],
    inspections: [inspection()],
    ...overrides,
  };
}

function part(overrides: Partial<CustomerPart> = {}): CustomerPart {
  return {
    id: 'part-gfmco-tow',
    partId: '15-29900-010',
    customerId: 'cust-gfmco',
    processMasterId: '',
    processRevisionId: '',
    partName: 'CNTR TOW',
    description: 'Machined center tow component',
    outgoingPartNumber: '',
    blanketPo: '',
    revision: '',
    material: '',
    specification: '',
    customerSpecification: '',
    certFormat: '',
    certRequired: false,
    eachWeight: 127,
    thickness: 0.25,
    inactive: false,
    partHold: false,
    shippingHold: false,
    price: {
      setup: 0,
      amount: 0,
      pricePer: 'Each',
      minimum: 0,
    },
    quote: {
      quoteId: '',
      quotedQuantity: 0,
      effectiveDate: '',
      expirationDate: '',
      contact: '',
      salesPerson: '',
    },
    notes: '',
    ...overrides,
  };
}

describe('getProcessRevisionReadiness', () => {
  it('reports a complete active revision as promotable and assignable', () => {
    expect(getProcessRevisionReadiness(revision(), dictionaries)).toEqual({
      promotable: true,
      assignable: true,
      blockers: [],
      warnings: [],
    });
  });

  it('allows saving incomplete drafts but blocks promotion and assignment', () => {
    const result = getProcessRevisionReadiness(
      revision({
        id: 'proc-rev-draft',
        revision: 17,
        status: 'Draft',
        specification: '',
        steps: [],
        inspections: [],
      }),
      dictionaries,
    );

    expect(result).toEqual({
      promotable: false,
      assignable: false,
      blockers: [
        'Specification is required before promotion.',
        'At least one process step is required before promotion.',
        'At least one required inspection is required before promotion.',
        'Draft revisions cannot be assigned to parts.',
      ],
      warnings: [],
    });
  });
});

describe('promoteProcessDraftRevision', () => {
  it('turns a ready current draft into the active revision and updates the process master without mutation', () => {
    const active = revision();
    const draft = revision({ id: 'proc-rev-draft', status: 'Draft', revision: 17 });
    const originalProcessMaster = structuredClone(processMaster);
    const { processMaster: updatedMaster, revisions } = promoteProcessDraftRevision(
      processMaster,
      [active, draft],
      draft.id,
      dictionaries,
    );

    expect(updatedMaster.activeRevisionId).toBe('proc-rev-draft');
    expect(updatedMaster.draftRevisionId).toBe('');
    expect(revisions.find((entry) => entry.id === 'proc-rev-draft')?.status).toBe('Active');
    expect(revisions.find((entry) => entry.id === 'proc-rev-active')?.status).toBe('Draft');
    expect(processMaster).toEqual(originalProcessMaster);
    expect(active.status).toBe('Active');
    expect(draft.status).toBe('Draft');
  });

  it('allows promotion of a new unsaved draft when the process master has no draft pointer', () => {
    const processMasterWithoutDraft = { ...processMaster, draftRevisionId: '' };
    const draft = revision({ id: 'proc-rev-unsaved-draft', status: 'Draft', revision: 17 });
    const result = promoteProcessDraftRevision(
      processMasterWithoutDraft,
      [revision(), draft],
      draft.id,
      dictionaries,
    );

    expect(result.errors).toEqual([]);
    expect(result.processMaster.activeRevisionId).toBe('proc-rev-unsaved-draft');
    expect(result.processMaster.draftRevisionId).toBe('');
  });

  it('returns an error when the draft revision is missing', () => {
    const revisions = [revision()];
    const result = promoteProcessDraftRevision(processMaster, revisions, 'missing-draft', dictionaries);

    expect(result.errors).toEqual(['Draft revision was not found.']);
    expect(result.processMaster).toBe(processMaster);
    expect(result.revisions).toBe(revisions);
  });

  it('returns an error when the selected revision is not a draft', () => {
    const revisions = [revision(), revision({ id: 'proc-rev-draft', status: 'Draft', revision: 17 })];
    const result = promoteProcessDraftRevision(processMaster, revisions, 'proc-rev-active', dictionaries);

    expect(result.errors).toEqual(['Only draft revisions can be promoted.']);
    expect(result.processMaster).toBe(processMaster);
    expect(result.revisions).toBe(revisions);
  });

  it('returns an error when the draft belongs to another process master', () => {
    const revisions = [
      revision(),
      revision({ id: 'proc-rev-other-draft', processMasterId: 'other-process-master', status: 'Draft', revision: 1 }),
    ];
    const result = promoteProcessDraftRevision(processMaster, revisions, 'proc-rev-other-draft', dictionaries);

    expect(result.errors).toEqual(['Draft revision does not belong to the selected process master.']);
    expect(result.processMaster).toBe(processMaster);
    expect(result.revisions).toBe(revisions);
  });

  it('returns an error when the draft is stale for a process master with a current draft pointer', () => {
    const revisions = [
      revision(),
      revision({ id: 'proc-rev-draft', status: 'Draft', revision: 17 }),
      revision({ id: 'proc-rev-stale-draft', status: 'Draft', revision: 18 }),
    ];
    const result = promoteProcessDraftRevision(processMaster, revisions, 'proc-rev-stale-draft', dictionaries);

    expect(result.errors).toEqual(["Draft revision is not the selected process master's current draft."]);
    expect(result.processMaster).toBe(processMaster);
    expect(result.revisions).toBe(revisions);
  });
});

describe('validateProcessRevisionForPromotion', () => {
  it('blocks inactive and missing dictionary references', () => {
    const activeRevision = revision();
    const result = validateProcessRevisionForPromotion(
      {
        ...activeRevision,
        processCodeId: 'missing-process-code',
        steps: [{ ...activeRevision.steps[0], equipmentId: 'dict-equipment-old' }],
      },
      dictionaries,
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(['Process code reference is invalid.', 'Step 10 equipment is inactive.']);
    expect(result.warnings).toEqual([]);
  });

  it('blocks inactive table key references', () => {
    const activeRevision = revision();
    const result = validateProcessRevisionForPromotion(
      {
        ...activeRevision,
        steps: [{ ...activeRevision.steps[0], tableKeyId: 'dict-table-old' }],
      },
      dictionaries,
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Step 10 table key is inactive.');
  });

  it('validates process step and inspection dictionary references', () => {
    const activeRevision = revision();
    const result = validateProcessRevisionForPromotion(
      {
        ...activeRevision,
        steps: [
          {
            ...activeRevision.steps[0],
            processCodeId: 'dict-process-old',
            groupId: 'missing-group',
            costCenterId: 'dict-cost-center-old',
          },
          {
            ...activeRevision.steps[0],
            id: 'step-austenitize',
            sequence: 20,
            processCodeId: 'missing-process-code',
            groupId: 'dict-group-old',
            costCenterId: 'missing-cost-center',
          },
        ],
        inspections: [
          {
            ...activeRevision.inspections[0],
            id: 'insp-invalid',
            inspectionCodeId: 'missing-inspection-code',
            inspectionScaleId: 'dict-scale-old',
          },
          {
            ...activeRevision.inspections[0],
            id: 'insp-inactive',
            inspectionCodeId: 'dict-inspection-old',
            inspectionScaleId: 'missing-scale',
          },
        ],
      },
      dictionaries,
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'Step 10 process code is inactive.',
        'Step 10 group is invalid.',
        'Step 10 cost center is inactive.',
        'Step 20 process code is invalid.',
        'Step 20 group is inactive.',
        'Step 20 cost center is invalid.',
        'Inspection insp-invalid code is invalid.',
        'Inspection insp-invalid scale is inactive.',
        'Inspection insp-inactive code is inactive.',
        'Inspection insp-inactive scale is invalid.',
      ]),
    );
  });
});

describe('filterActiveDictionaryEntries', () => {
  it('filters active entries by kind', () => {
    expect(filterActiveDictionaryEntries(dictionaries, 'Equipment').map((entry) => entry.id)).toEqual([
      'dict-equipment-furnace',
    ]);
  });
});

describe('getActiveProcessRevision', () => {
  it('finds the active revision', () => {
    const activeRevision = revision();
    const draftRevision = revision({ id: 'proc-rev-draft', revision: 17, status: 'Draft' });

    expect(getActiveProcessRevision(processMaster, [draftRevision, activeRevision])).toBe(activeRevision);
  });
});

describe('getDraftProcessRevision', () => {
  it('finds the draft revision', () => {
    const activeRevision = revision();
    const draftRevision = revision({ id: 'proc-rev-draft', revision: 17, status: 'Draft' });

    expect(getDraftProcessRevision(processMaster, [activeRevision, draftRevision])).toBe(draftRevision);
  });
});

describe('getProcessDisplaySummary', () => {
  it('returns the process display summary', () => {
    expect(getProcessDisplaySummary(processMaster, revision(), dictionaries)).toEqual({
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

  it('returns an unassigned summary when the revision is missing', () => {
    expect(getProcessDisplaySummary(processMaster, undefined, dictionaries)).toEqual({
      processMasterId: '15-29900-003',
      name: 'Ductile Iron Austemper Route',
      revisionLabel: 'No active revision',
      processCode: 'Unassigned',
      material: '',
      specification: '',
      certFormat: '',
      stepCount: 0,
      requiredInspectionCount: 0,
    });
  });
});

describe('assignProcessRevisionToParts', () => {
  it('assigns one active process revision to multiple selected customer parts', () => {
    const parts = [
      part({ id: 'part-a', partId: '15-29900-010' }),
      part({ id: 'part-b', partId: '15-29900-011' }),
      part({
        id: 'part-c',
        partId: '15-29900-012',
        material: 'Existing Material',
        specification: 'Existing Spec',
        certFormat: 'Existing Cert',
      }),
    ];

    const result = assignProcessRevisionToParts({
      parts,
      selectedPartIds: ['part-a', 'part-b'],
      processMaster,
      revision: revision(),
      dictionaries,
    });

    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.updatedParts).toEqual([
      expect.objectContaining({
        id: 'part-a',
        processMasterId: '15-29900-003',
        processRevisionId: 'proc-rev-active',
        material: 'Ductile Iron',
        specification: 'Eq: 180; Gr: IQ',
        certFormat: 'Generic - AM',
      }),
      expect.objectContaining({
        id: 'part-b',
        processMasterId: '15-29900-003',
        processRevisionId: 'proc-rev-active',
        material: 'Ductile Iron',
        specification: 'Eq: 180; Gr: IQ',
        certFormat: 'Generic - AM',
      }),
      expect.objectContaining({
        id: 'part-c',
        processMasterId: '',
        processRevisionId: '',
        material: 'Existing Material',
        specification: 'Existing Spec',
        certFormat: 'Existing Cert',
      }),
    ]);
  });

  it('blocks draft assignment and returns the original parts', () => {
    const parts = [part()];
    const result = assignProcessRevisionToParts({
      parts,
      selectedPartIds: ['part-gfmco-tow'],
      processMaster,
      revision: revision({ id: 'proc-rev-draft', revision: 17, status: 'Draft' }),
      dictionaries,
    });

    expect(result.errors).toEqual(['Draft revisions cannot be assigned to parts.']);
    expect(result.updatedParts).toBe(parts);
  });

  it('blocks invalid active assignment and returns the original parts', () => {
    const parts = [part()];
    const result = assignProcessRevisionToParts({
      parts,
      selectedPartIds: ['part-gfmco-tow'],
      processMaster,
      revision: revision({ specification: '' }),
      dictionaries,
    });

    expect(result.errors).toEqual(['Specification is required before promotion.']);
    expect(result.warnings).toEqual([]);
    expect(result.updatedParts).toBe(parts);
  });

  it('blocks assignment when the revision belongs to another process master', () => {
    const parts = [part()];
    const result = assignProcessRevisionToParts({
      parts,
      selectedPartIds: ['part-gfmco-tow'],
      processMaster,
      revision: revision({ processMasterId: 'other-process-master' }),
      dictionaries,
    });

    expect(result.errors).toEqual(['Process revision does not belong to the selected process master.']);
    expect(result.updatedParts).toBe(parts);
  });

  it('blocks unknown selected part IDs and preserves overwrite warnings', () => {
    const parts = [part({ processMasterId: 'old-process', processRevisionId: 'old-revision' })];
    const result = assignProcessRevisionToParts({
      parts,
      selectedPartIds: ['part-gfmco-tow', 'missing-part'],
      processMaster,
      revision: revision(),
      dictionaries,
    });

    expect(result.errors).toEqual(['Selected customer part missing-part was not found.']);
    expect(result.warnings).toEqual([
      'Part 15-29900-010 already has process revision old-revision and will be overwritten.',
    ]);
    expect(result.updatedParts).toBe(parts);
  });

  it('requires at least one selected part', () => {
    const parts = [part()];
    const result = assignProcessRevisionToParts({
      parts,
      selectedPartIds: [],
      processMaster,
      revision: revision(),
      dictionaries,
    });

    expect(result.errors).toEqual(['Select at least one customer part.']);
    expect(result.updatedParts).toBe(parts);
  });

  it('warns before overwriting an existing process revision', () => {
    const result = assignProcessRevisionToParts({
      parts: [part({ processMasterId: 'old-process', processRevisionId: 'old-revision' })],
      selectedPartIds: ['part-gfmco-tow'],
      processMaster,
      revision: revision(),
      dictionaries,
    });

    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([
      'Part 15-29900-010 already has process revision old-revision and will be overwritten.',
    ]);
    expect(result.updatedParts[0]).toMatchObject({
      processMasterId: '15-29900-003',
      processRevisionId: 'proc-rev-active',
    });
  });
});
