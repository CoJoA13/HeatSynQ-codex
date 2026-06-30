import type { ValidationResult } from './masterData';
import type {
  CustomerPart,
  PlantSupportDictionaryEntry,
  PlantSupportDictionaryKind,
  ProcessMaster,
  ProcessInspectionRequirement,
  ProcessRevision,
  ProcessStep,
} from './types';

export type { ValidationResult } from './masterData';

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
  selectedPartIds: string[];
  processMaster: ProcessMaster;
  revision: ProcessRevision;
  dictionaries: PlantSupportDictionaryEntry[];
}

export interface AssignProcessRevisionResult {
  updatedParts: CustomerPart[];
  errors: string[];
  warnings: string[];
}

export interface PromoteProcessDraftRevisionResult {
  processMaster: ProcessMaster;
  revisions: ProcessRevision[];
  errors: string[];
}

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

function findDictionaryEntry(
  dictionaries: PlantSupportDictionaryEntry[],
  id: string,
  kind: PlantSupportDictionaryKind,
): PlantSupportDictionaryEntry | undefined {
  return dictionaries.find((entry) => entry.id === id && entry.kind === kind);
}

function validateReference(
  errors: string[],
  dictionaries: PlantSupportDictionaryEntry[],
  id: string,
  kind: PlantSupportDictionaryKind,
  invalidMessage: string,
  inactiveMessage: string,
): void {
  if (isBlank(id)) {
    errors.push(invalidMessage);
    return;
  }

  const entry = findDictionaryEntry(dictionaries, id, kind);

  if (!entry) {
    errors.push(invalidMessage);
    return;
  }

  if (!entry.active) {
    errors.push(inactiveMessage);
  }
}

function validateStepReference(
  errors: string[],
  dictionaries: PlantSupportDictionaryEntry[],
  step: ProcessStep,
  field: 'processCodeId' | 'equipmentId' | 'tableKeyId' | 'groupId' | 'costCenterId',
  kind: PlantSupportDictionaryKind,
  label: string,
): void {
  validateReference(
    errors,
    dictionaries,
    step[field],
    kind,
    `Step ${step.sequence} ${label} is invalid.`,
    `Step ${step.sequence} ${label} is inactive.`,
  );
}

function validateInspectionReference(
  errors: string[],
  dictionaries: PlantSupportDictionaryEntry[],
  inspection: ProcessInspectionRequirement,
  field: 'inspectionCodeId' | 'inspectionScaleId',
  kind: PlantSupportDictionaryKind,
  label: string,
): void {
  validateReference(
    errors,
    dictionaries,
    inspection[field],
    kind,
    `Inspection ${inspection.id} ${label} is invalid.`,
    `Inspection ${inspection.id} ${label} is inactive.`,
  );
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
    validateReference(
      errors,
      dictionaries,
      revision.processCodeId,
      'Process Code',
      'Process code reference is invalid.',
      'Process code reference is inactive.',
    );
  }

  for (const step of revision.steps) {
    validateStepReference(errors, dictionaries, step, 'processCodeId', 'Process Code', 'process code');
    validateStepReference(errors, dictionaries, step, 'equipmentId', 'Equipment', 'equipment');
    validateStepReference(errors, dictionaries, step, 'tableKeyId', 'Table Key', 'table key');
    validateStepReference(errors, dictionaries, step, 'groupId', 'Group', 'group');
    validateStepReference(errors, dictionaries, step, 'costCenterId', 'Cost Center', 'cost center');
  }

  for (const inspection of revision.inspections) {
    validateInspectionReference(
      errors,
      dictionaries,
      inspection,
      'inspectionCodeId',
      'Inspection Code',
      'code',
    );
    validateInspectionReference(
      errors,
      dictionaries,
      inspection,
      'inspectionScaleId',
      'Inspection Scale',
      'scale',
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
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

export function getProcessRevisionReadiness(
  revision: ProcessRevision,
  dictionaries: PlantSupportDictionaryEntry[],
): ProcessRevisionReadiness {
  const promotionResult = validateProcessRevisionForPromotion(revision, dictionaries);
  const blockers = [...promotionResult.errors];

  if (revision.status === 'Draft') {
    blockers.push('Draft revisions cannot be assigned to parts.');
  }

  return {
    promotable: promotionResult.valid,
    assignable: revision.status === 'Active' && promotionResult.valid,
    blockers,
    warnings: promotionResult.warnings,
  };
}

export function getProcessDisplaySummary(
  processMaster: ProcessMaster,
  revision: ProcessRevision | undefined,
  dictionaries: PlantSupportDictionaryEntry[],
): ProcessDisplaySummary {
  if (!revision) {
    return {
      processMasterId: processMaster.id,
      name: processMaster.name,
      revisionLabel: 'No active revision',
      processCode: 'Unassigned',
      material: '',
      specification: '',
      certFormat: '',
      stepCount: 0,
      requiredInspectionCount: 0,
    };
  }

  const processCode = findDictionaryEntry(dictionaries, revision.processCodeId, 'Process Code');

  return {
    processMasterId: processMaster.id,
    name: processMaster.name,
    revisionLabel: `Rev ${revision.revision} ${revision.status}`,
    processCode: processCode?.name ?? '',
    material: revision.material,
    specification: revision.specification,
    certFormat: revision.certFormat,
    stepCount: revision.steps.length,
    requiredInspectionCount: revision.inspections.filter((inspection) => inspection.required).length,
  };
}

export function assignProcessRevisionToParts(input: AssignProcessRevisionInput): AssignProcessRevisionResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const selectedPartIds = new Set(input.selectedPartIds);
  const readiness = getProcessRevisionReadiness(input.revision, input.dictionaries);
  const partIds = new Set(input.parts.map((part) => part.id));

  if (selectedPartIds.size === 0) {
    errors.push('Select at least one customer part.');
  }

  if (input.revision.processMasterId !== input.processMaster.id) {
    errors.push('Process revision does not belong to the selected process master.');
  }

  for (const selectedPartId of selectedPartIds) {
    if (!partIds.has(selectedPartId)) {
      errors.push(`Selected customer part ${selectedPartId} was not found.`);
    }
  }

  if (!readiness.assignable) {
    errors.push(...readiness.blockers);
  }

  for (const part of input.parts) {
    if (
      selectedPartIds.has(part.id) &&
      !isBlank(part.processRevisionId) &&
      part.processRevisionId !== input.revision.id
    ) {
      warnings.push(
        `Part ${part.partId} already has process revision ${part.processRevisionId} and will be overwritten.`,
      );
    }
  }

  if (errors.length > 0) {
    return {
      updatedParts: input.parts,
      errors,
      warnings,
    };
  }

  const updatedParts = input.parts.map((part) => {
    if (!selectedPartIds.has(part.id)) return part;

    return {
      ...part,
      processMasterId: input.processMaster.id,
      processRevisionId: input.revision.id,
      material: isBlank(input.revision.material) ? part.material : input.revision.material,
      specification: isBlank(input.revision.specification) ? part.specification : input.revision.specification,
      certFormat: isBlank(input.revision.certFormat) ? part.certFormat : input.revision.certFormat,
    };
  });

  return {
    updatedParts,
    errors,
    warnings,
  };
}
