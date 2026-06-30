import type { ValidationResult } from './masterData';
import type {
  CustomerPart,
  PlantSupportDictionaryEntry,
  PlantSupportDictionaryKind,
  ProcessMaster,
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
  field: 'equipmentId' | 'tableKeyId',
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
    validateStepReference(errors, dictionaries, step, 'equipmentId', 'Equipment', 'equipment');
    validateStepReference(errors, dictionaries, step, 'tableKeyId', 'Table Key', 'table key');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
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
  revision: ProcessRevision,
  dictionaries: PlantSupportDictionaryEntry[],
): ProcessDisplaySummary {
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

  if (selectedPartIds.size === 0) {
    errors.push('Select at least one customer part.');
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
