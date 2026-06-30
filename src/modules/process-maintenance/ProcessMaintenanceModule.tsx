import { useEffect, useMemo, useState } from 'react';
import { ModuleGate } from '../../components/ModuleGate';
import {
  assignProcessRevisionToParts,
  filterActiveDictionaryEntries,
  getActiveProcessRevision,
  getDraftProcessRevision,
  getProcessDisplaySummary,
  getProcessRevisionReadiness,
  promoteProcessDraftRevision,
} from '../../domain/processFoundation';
import type {
  CustomerPart,
  PlantSupportDictionaryEntry,
  PlantSupportDictionaryKind,
  ProcessInspectionRequirement,
  ProcessMaster,
  ProcessRevision,
  ProcessStep,
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

interface DictionaryDraft {
  kind: PlantSupportDictionaryKind;
  code: string;
  name: string;
  description: string;
  category: string;
  active: boolean;
}

const dictionaryKinds: PlantSupportDictionaryKind[] = [
  'Process Code',
  'Equipment',
  'Group',
  'Cost Center',
  'Inspection Code',
  'Inspection Scale',
  'Table Key',
  'Standard Step Template',
];

function createEmptyDictionaryDraft(): DictionaryDraft {
  return {
    kind: 'Process Code',
    code: '',
    name: '',
    description: '',
    category: '',
    active: true,
  };
}

function createEditableDraft(processMaster: ProcessMaster, revisions: ProcessRevision[]): ProcessRevision {
  const draftRevision = getDraftProcessRevision(processMaster, revisions);

  if (draftRevision) return structuredClone(draftRevision);

  const activeRevision = getActiveProcessRevision(processMaster, revisions);

  return {
    id: `proc-rev-${processMaster.id}-${crypto.randomUUID()}`,
    processMasterId: processMaster.id,
    revision: activeRevision ? activeRevision.revision + 1 : 1,
    status: 'Draft',
    effectiveDate: '',
    processCodeId: activeRevision?.processCodeId ?? '',
    material: activeRevision?.material ?? '',
    specification: activeRevision?.specification ?? '',
    certificationId: activeRevision?.certificationId ?? '',
    certFormat: activeRevision?.certFormat ?? '',
    notes: activeRevision?.notes ?? '',
    steps: structuredClone(activeRevision?.steps ?? []),
    inspections: structuredClone(activeRevision?.inspections ?? []),
  };
}

function resequenceSteps(steps: ProcessStep[]): ProcessStep[] {
  return steps.map((step, index) => ({ ...step, sequence: (index + 1) * 10 }));
}

function readNumber(value: number): number {
  return Number.isNaN(value) ? 0 : value;
}

export function ProcessMaintenanceModule({
  currentUser,
  processMasters,
  processRevisions,
  plantSupportDictionaryEntries,
  customerParts,
  onProcessMastersChange,
  onProcessRevisionsChange,
  onPlantSupportDictionaryEntriesChange,
  onCustomerPartsChange,
}: ProcessMaintenanceModuleProps) {
  const [processMasterEntries, setProcessMasterEntries] = useState<ProcessMaster[]>(() =>
    structuredClone(processMasters),
  );
  const [processRevisionEntries, setProcessRevisionEntries] = useState<ProcessRevision[]>(() =>
    structuredClone(processRevisions),
  );
  const firstProcessMaster = processMasterEntries[0];
  const [selectedProcessMasterId, setSelectedProcessMasterId] = useState(firstProcessMaster?.id ?? '');
  const [draftRevision, setDraftRevision] = useState<ProcessRevision | undefined>(() =>
    firstProcessMaster ? createEditableDraft(firstProcessMaster, processRevisionEntries) : undefined,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [saveSummary, setSaveSummary] = useState('');
  const [hasUnsavedDraftEdits, setHasUnsavedDraftEdits] = useState(false);
  const [syncedDraftRevisionId, setSyncedDraftRevisionId] = useState(firstProcessMaster?.draftRevisionId ?? '');
  const [dictionaryEntries, setDictionaryEntries] = useState<PlantSupportDictionaryEntry[]>(() =>
    structuredClone(plantSupportDictionaryEntries),
  );
  const [showDictionaryDraft, setShowDictionaryDraft] = useState(false);
  const [dictionaryDraft, setDictionaryDraft] = useState<DictionaryDraft>(() => createEmptyDictionaryDraft());
  const [customerPartEntries, setCustomerPartEntries] = useState<CustomerPart[]>(() => structuredClone(customerParts));
  const [selectedPartIds, setSelectedPartIds] = useState<string[]>([]);
  const [assignmentTargetMode, setAssignmentTargetMode] = useState<'active' | 'draft-preview'>('active');
  const [assignmentMessages, setAssignmentMessages] = useState<string[]>([]);

  const selectedProcessMaster =
    processMasterEntries.find((processMaster) => processMaster.id === selectedProcessMasterId) ?? firstProcessMaster;
  const activeRevision = selectedProcessMaster
    ? getActiveProcessRevision(selectedProcessMaster, processRevisionEntries)
    : undefined;
  const activeSummary = selectedProcessMaster
    ? getProcessDisplaySummary(selectedProcessMaster, activeRevision, dictionaryEntries)
    : undefined;
  const draftSummary =
    selectedProcessMaster && draftRevision
      ? getProcessDisplaySummary(selectedProcessMaster, draftRevision, dictionaryEntries)
      : undefined;
  const draftReadiness = draftRevision ? getProcessRevisionReadiness(draftRevision, dictionaryEntries) : undefined;
  const readinessMessages = draftReadiness?.blockers ?? [];
  const feedbackMessages = assignmentMessages.length > 0 ? assignmentMessages : readinessMessages;
  const assignedPartCount = selectedProcessMaster
    ? customerPartEntries.filter((part) => part.processMasterId === selectedProcessMaster.id).length
    : 0;
  const assignmentTargetRevision = assignmentTargetMode === 'draft-preview' ? draftRevision : activeRevision;
  const assignmentTargetSummary =
    selectedProcessMaster && assignmentTargetRevision
      ? getProcessDisplaySummary(selectedProcessMaster, assignmentTargetRevision, dictionaryEntries)
      : undefined;

  useEffect(() => {
    setProcessMasterEntries(structuredClone(processMasters));
  }, [processMasters]);

  useEffect(() => {
    setProcessRevisionEntries(structuredClone(processRevisions));
  }, [processRevisions]);

  useEffect(() => {
    setDictionaryEntries(structuredClone(plantSupportDictionaryEntries));
  }, [plantSupportDictionaryEntries]);

  useEffect(() => {
    const nextCustomerParts = structuredClone(customerParts);
    const nextCustomerPartIds = new Set(nextCustomerParts.map((part) => part.id));

    setCustomerPartEntries(nextCustomerParts);
    setSelectedPartIds((currentSelectedPartIds) =>
      currentSelectedPartIds.filter((partId) => nextCustomerPartIds.has(partId)),
    );
  }, [customerParts]);

  useEffect(() => {
    if (processMasterEntries.length === 0) {
      if (selectedProcessMasterId) setSelectedProcessMasterId('');
      if (draftRevision) setDraftRevision(undefined);
      if (hasUnsavedDraftEdits) setHasUnsavedDraftEdits(false);
      if (syncedDraftRevisionId) setSyncedDraftRevisionId('');
      return;
    }

    const nextSelectedProcessMaster =
      processMasterEntries.find((processMaster) => processMaster.id === selectedProcessMasterId) ??
      processMasterEntries[0];

    if (nextSelectedProcessMaster.id !== selectedProcessMasterId) {
      setSelectedProcessMasterId(nextSelectedProcessMaster.id);
      setDraftRevision(createEditableDraft(nextSelectedProcessMaster, processRevisionEntries));
      setHasUnsavedDraftEdits(false);
      setSyncedDraftRevisionId(nextSelectedProcessMaster.draftRevisionId);
      setSaveSummary('');
      setSelectedPartIds([]);
      setAssignmentTargetMode('active');
      setAssignmentMessages([]);
      return;
    }

    if (!draftRevision || draftRevision.processMasterId !== nextSelectedProcessMaster.id) {
      setDraftRevision(createEditableDraft(nextSelectedProcessMaster, processRevisionEntries));
      setHasUnsavedDraftEdits(false);
      setSyncedDraftRevisionId(nextSelectedProcessMaster.draftRevisionId);
      setSaveSummary('');
      setAssignmentTargetMode('active');
      setAssignmentMessages([]);
      return;
    }

    const parentDraftPointerChanged = nextSelectedProcessMaster.draftRevisionId !== syncedDraftRevisionId;
    const parentClearedDraftPointer = parentDraftPointerChanged && nextSelectedProcessMaster.draftRevisionId === '';

    if (parentDraftPointerChanged && (!hasUnsavedDraftEdits || parentClearedDraftPointer)) {
      setDraftRevision(createEditableDraft(nextSelectedProcessMaster, processRevisionEntries));
      setHasUnsavedDraftEdits(false);
      setSyncedDraftRevisionId(nextSelectedProcessMaster.draftRevisionId);
      setSaveSummary('');
      setAssignmentTargetMode('active');
      setAssignmentMessages([]);
    }
  }, [
    draftRevision,
    hasUnsavedDraftEdits,
    processMasterEntries,
    processRevisionEntries,
    selectedProcessMasterId,
    syncedDraftRevisionId,
  ]);

  const activeProcessCodes = useMemo(
    () => filterActiveDictionaryEntries(dictionaryEntries, 'Process Code'),
    [dictionaryEntries],
  );
  const activeEquipment = useMemo(
    () => filterActiveDictionaryEntries(dictionaryEntries, 'Equipment'),
    [dictionaryEntries],
  );
  const activeGroups = useMemo(
    () => filterActiveDictionaryEntries(dictionaryEntries, 'Group'),
    [dictionaryEntries],
  );
  const activeCostCenters = useMemo(
    () => filterActiveDictionaryEntries(dictionaryEntries, 'Cost Center'),
    [dictionaryEntries],
  );
  const activeInspectionCodes = useMemo(
    () => filterActiveDictionaryEntries(dictionaryEntries, 'Inspection Code'),
    [dictionaryEntries],
  );
  const activeInspectionScales = useMemo(
    () => filterActiveDictionaryEntries(dictionaryEntries, 'Inspection Scale'),
    [dictionaryEntries],
  );
  const activeTableKeys = useMemo(
    () => filterActiveDictionaryEntries(dictionaryEntries, 'Table Key'),
    [dictionaryEntries],
  );

  const filteredProcessMasters = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();

    if (!normalizedQuery) return processMasterEntries;

    return processMasterEntries.filter((processMaster) => {
      const processActiveRevision = getActiveProcessRevision(processMaster, processRevisionEntries);
      const processDraftRevision = getDraftProcessRevision(processMaster, processRevisionEntries);
      const processActiveSummary = getProcessDisplaySummary(
        processMaster,
        processActiveRevision,
        dictionaryEntries,
      );
      const processDraftSummary = getProcessDisplaySummary(
        processMaster,
        processDraftRevision,
        dictionaryEntries,
      );
      const searchableText = [
        processMaster.id,
        processMaster.name,
        processActiveSummary.processCode,
        processActiveSummary.material,
        processActiveSummary.specification,
        processDraftSummary.revisionLabel,
      ]
        .join(' ')
        .toLocaleLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [dictionaryEntries, processMasterEntries, processRevisionEntries, searchQuery]);

  function renderDictionaryOptions(entries: PlantSupportDictionaryEntry[]) {
    return entries.map((entry) => (
      <option key={entry.id} value={entry.id}>
        {entry.code} - {entry.name}
      </option>
    ));
  }

  function selectProcess(processMaster: ProcessMaster) {
    const nextDraftRevision = createEditableDraft(processMaster, processRevisionEntries);

    setSelectedProcessMasterId(processMaster.id);
    setDraftRevision(nextDraftRevision);
    setHasUnsavedDraftEdits(false);
    setSyncedDraftRevisionId(processMaster.draftRevisionId);
    setSaveSummary('');
    setSelectedPartIds([]);
    setAssignmentTargetMode('active');
    setAssignmentMessages([]);
  }

  function updateDraft(nextDraftRevision: ProcessRevision) {
    setDraftRevision(nextDraftRevision);
    setHasUnsavedDraftEdits(true);
    setSaveSummary('');
    setAssignmentMessages([]);
  }

  function saveDraft() {
    if (!draftRevision) return;

    const savedDraft = structuredClone(draftRevision);
    const existingRevisionIndex = processRevisionEntries.findIndex((revision) => revision.id === savedDraft.id);
    const nextRevisions =
      existingRevisionIndex === -1
        ? [...processRevisionEntries, savedDraft]
        : processRevisionEntries.map((revision, index) => (index === existingRevisionIndex ? savedDraft : revision));

    setProcessRevisionEntries(nextRevisions);
    onProcessRevisionsChange(nextRevisions);

    if (selectedProcessMaster && selectedProcessMaster.draftRevisionId !== savedDraft.id) {
      const nextProcessMasters = processMasterEntries.map((processMaster) =>
        processMaster.id === selectedProcessMaster.id
          ? { ...processMaster, draftRevisionId: savedDraft.id }
          : processMaster,
      );

      setProcessMasterEntries(nextProcessMasters);
      onProcessMastersChange(nextProcessMasters);
    }

    setDraftRevision(savedDraft);
    setHasUnsavedDraftEdits(false);
    setSaveSummary('Draft saved.');
    setAssignmentMessages([]);
  }

  function createNewDraftRevision() {
    if (!selectedProcessMaster) return;

    const nextDraftRevision = createEditableDraft(selectedProcessMaster, processRevisionEntries);

    setDraftRevision(nextDraftRevision);
    setHasUnsavedDraftEdits(true);
    setSyncedDraftRevisionId(selectedProcessMaster.draftRevisionId);
    setSaveSummary('');
    setAssignmentTargetMode('active');
    setAssignmentMessages([]);
  }

  function saveDictionaryEntry() {
    const nextEntry: PlantSupportDictionaryEntry = {
      id: `dict-${dictionaryDraft.kind.toLocaleLowerCase().replace(/\s+/g, '-')}-${crypto.randomUUID()}`,
      kind: dictionaryDraft.kind,
      code: dictionaryDraft.code.trim(),
      name: dictionaryDraft.name.trim(),
      description: dictionaryDraft.description.trim(),
      category: dictionaryDraft.category.trim(),
      active: dictionaryDraft.active,
    };
    const nextEntries = [...dictionaryEntries, nextEntry];

    setDictionaryEntries(nextEntries);
    onPlantSupportDictionaryEntriesChange(nextEntries);
    setDictionaryDraft(createEmptyDictionaryDraft());
    setShowDictionaryDraft(false);
  }

  function inactivateDictionaryEntry(entryId: string) {
    const nextEntries = dictionaryEntries.map((entry) =>
      entry.id === entryId ? { ...entry, active: false } : entry,
    );

    setDictionaryEntries(nextEntries);
    onPlantSupportDictionaryEntriesChange(nextEntries);
  }

  function promoteDraft() {
    if (!selectedProcessMaster || !draftRevision) return;

    const existingRevisionIndex = processRevisionEntries.findIndex((revision) => revision.id === draftRevision.id);
    const revisionsWithDraft =
      existingRevisionIndex === -1
        ? [...processRevisionEntries, draftRevision]
        : processRevisionEntries.map((revision, index) =>
            index === existingRevisionIndex ? draftRevision : revision,
          );
    const promotion = promoteProcessDraftRevision(
      selectedProcessMaster,
      revisionsWithDraft,
      draftRevision.id,
      dictionaryEntries,
    );

    if (promotion.errors.length > 0) {
      setSaveSummary(promotion.errors.join(' '));
      return;
    }

    const nextProcessMasters = processMasterEntries.map((processMaster) =>
      processMaster.id === selectedProcessMaster.id ? promotion.processMaster : processMaster,
    );

    setProcessMasterEntries(nextProcessMasters);
    setProcessRevisionEntries(promotion.revisions);
    onProcessMastersChange(nextProcessMasters);
    onProcessRevisionsChange(promotion.revisions);
    setDraftRevision(createEditableDraft(promotion.processMaster, promotion.revisions));
    setHasUnsavedDraftEdits(false);
    setSyncedDraftRevisionId(promotion.processMaster.draftRevisionId);
    setSaveSummary('Draft promoted to active revision.');
    setAssignmentTargetMode('active');
    setAssignmentMessages([]);
  }

  function toggleSelectedPart(partId: string, selected: boolean) {
    setSelectedPartIds((currentSelectedPartIds) => {
      if (selected) {
        if (currentSelectedPartIds.includes(partId)) return currentSelectedPartIds;
        return [...currentSelectedPartIds, partId];
      }

      return currentSelectedPartIds.filter((selectedPartId) => selectedPartId !== partId);
    });
    setSaveSummary('');
    setAssignmentMessages([]);
  }

  function previewDraftAssignmentTarget() {
    setAssignmentTargetMode('draft-preview');
    setSaveSummary('');
    setAssignmentMessages([]);
  }

  function assignSelectedParts() {
    if (!selectedProcessMaster || !assignmentTargetRevision) {
      setAssignmentMessages(['No process revision is available for assignment.']);
      setSaveSummary('');
      return;
    }

    const selectedPartCount = selectedPartIds.length;
    const result = assignProcessRevisionToParts({
      parts: customerPartEntries,
      selectedPartIds,
      processMaster: selectedProcessMaster,
      revision: assignmentTargetRevision,
      dictionaries: dictionaryEntries,
    });

    if (result.errors.length > 0) {
      setAssignmentMessages([...result.errors, ...result.warnings]);
      setSaveSummary('');
      return;
    }

    setCustomerPartEntries(result.updatedParts);
    onCustomerPartsChange(result.updatedParts);
    setAssignmentMessages(result.warnings);
    setSaveSummary(
      `Assigned process revision to ${selectedPartCount} ${selectedPartCount === 1 ? 'part' : 'parts'}.`,
    );
  }

  function addStep() {
    if (!draftRevision) return;

    const nextSequence =
      draftRevision.steps.length === 0 ? 10 : Math.max(...draftRevision.steps.map((step) => step.sequence)) + 10;
    const newStep: ProcessStep = {
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
    };

    updateDraft({ ...draftRevision, steps: resequenceSteps([...draftRevision.steps, newStep]) });
  }

  function updateStep<FieldName extends keyof ProcessStep>(
    stepIndex: number,
    fieldName: FieldName,
    value: ProcessStep[FieldName],
  ) {
    if (!draftRevision) return;

    updateDraft({
      ...draftRevision,
      steps: draftRevision.steps.map((step, index) =>
        index === stepIndex ? { ...step, [fieldName]: value } : step,
      ),
    });
  }

  function duplicateStep(stepIndex: number) {
    if (!draftRevision) return;

    const sourceStep = draftRevision.steps[stepIndex];
    if (!sourceStep) return;

    const duplicate = { ...sourceStep, id: `step-${crypto.randomUUID()}` };
    const nextSteps = [
      ...draftRevision.steps.slice(0, stepIndex + 1),
      duplicate,
      ...draftRevision.steps.slice(stepIndex + 1),
    ];

    updateDraft({ ...draftRevision, steps: resequenceSteps(nextSteps) });
  }

  function moveStep(stepIndex: number) {
    if (!draftRevision || stepIndex === 0) return;

    const nextSteps = [...draftRevision.steps];
    const previousStep = nextSteps[stepIndex - 1];
    nextSteps[stepIndex - 1] = nextSteps[stepIndex];
    nextSteps[stepIndex] = previousStep;

    updateDraft({ ...draftRevision, steps: resequenceSteps(nextSteps) });
  }

  function removeStep(stepIndex: number) {
    if (!draftRevision) return;

    updateDraft({
      ...draftRevision,
      steps: resequenceSteps(draftRevision.steps.filter((_, index) => index !== stepIndex)),
    });
  }

  function addInspection() {
    if (!draftRevision) return;

    const newInspection: ProcessInspectionRequirement = {
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
    };

    updateDraft({ ...draftRevision, inspections: [...draftRevision.inspections, newInspection] });
  }

  function updateInspection<FieldName extends keyof ProcessInspectionRequirement>(
    inspectionIndex: number,
    fieldName: FieldName,
    value: ProcessInspectionRequirement[FieldName],
  ) {
    if (!draftRevision) return;

    updateDraft({
      ...draftRevision,
      inspections: draftRevision.inspections.map((inspection, index) =>
        index === inspectionIndex ? { ...inspection, [fieldName]: value } : inspection,
      ),
    });
  }

  return (
    <ModuleGate user={currentUser} permission="Process Maintenance" moduleName="Process Maintenance">
      <section className="master-data-module process-maintenance-module" aria-labelledby="process-maintenance-title">
        <header className="master-data-header">
          <div>
            <p className="module-label">Process Foundation</p>
            <h1 id="process-maintenance-title">Process Maintenance</h1>
          </div>
          <div className="toolbar-group">
            <button className="toolbar-button" type="button" onClick={() => setShowDictionaryDraft(true)}>
              Add Dictionary Entry
            </button>
            <button className="toolbar-button" type="button" onClick={createNewDraftRevision}>
              New Draft Revision
            </button>
            <button className="toolbar-button" type="button" onClick={promoteDraft}>
              Promote Draft
            </button>
            <button className="toolbar-button toolbar-button-primary" type="button" onClick={saveDraft}>
              Save Draft
            </button>
          </div>
        </header>

        <div className="master-data-workspace">
          <aside className="master-list-panel" aria-label="Process list">
            <label className="master-search-field">
              Search processes
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="ID, route, material, or process"
              />
            </label>
            <div className="simple-list">
              {filteredProcessMasters.map((processMaster) => (
                <button
                  className="simple-list-row"
                  type="button"
                  key={processMaster.id}
                  onClick={() => selectProcess(processMaster)}
                  aria-current={selectedProcessMaster?.id === processMaster.id ? 'true' : undefined}
                  aria-label={`${processMaster.id} ${processMaster.name}`}
                >
                  <strong>{processMaster.id}</strong>
                  <span>{processMaster.name}</span>
                </button>
              ))}
            </div>
          </aside>

          <section className="master-detail-panel" aria-label="Process recipe detail">
            {saveSummary && (
              <p className="save-summary" role="status">
                {saveSummary}
              </p>
            )}

            {selectedProcessMaster && (
              <section className="master-section" aria-labelledby="process-overview-heading">
                <h2 id="process-overview-heading">Revision Status</h2>
                <dl className="definition-grid process-revision-grid">
                  <div>
                    <dt>Process master</dt>
                    <dd>
                      {selectedProcessMaster.id} {selectedProcessMaster.name}
                    </dd>
                  </div>
                  <div>
                    <dt>Active revision</dt>
                    <dd>{activeSummary?.revisionLabel ?? 'No active revision'}</dd>
                  </div>
                  <div>
                    <dt>Draft revision</dt>
                    <dd>{draftSummary?.revisionLabel ?? 'No draft revision'}</dd>
                  </div>
                  <div>
                    <dt>Assigned parts</dt>
                    <dd>{assignedPartCount}</dd>
                  </div>
                </dl>
              </section>
            )}

            {draftRevision && draftReadiness && (
              <section className="master-section process-assignment-panel" aria-labelledby="process-readiness-heading">
                <h2 id="process-readiness-heading">Readiness</h2>
                <div className="status-strip">
                  <span>{draftReadiness.promotable ? 'Promotable' : 'Promotion blocked'}</span>
                  <span>{draftReadiness.assignable ? 'Assignable to parts' : 'Not assignable to parts'}</span>
                </div>
                {feedbackMessages.length > 0 ? (
                  <div className="validation-summary" role="alert">
                    {feedbackMessages.map((message) => (
                      <p key={message}>{message}</p>
                    ))}
                  </div>
                ) : (
                  <p className="empty-copy">No readiness issues found.</p>
                )}
              </section>
            )}

            {selectedProcessMaster && (
              <section className="master-section process-assignment-panel" aria-labelledby="process-assignment-heading">
                <div className="section-toolbar">
                  <h2 id="process-assignment-heading">Process Assignment</h2>
                  <div className="toolbar-group">
                    {draftRevision && (
                      <button className="toolbar-button" type="button" onClick={previewDraftAssignmentTarget}>
                        Use Draft For Assignment Preview
                      </button>
                    )}
                    <button className="toolbar-button toolbar-button-primary" type="button" onClick={assignSelectedParts}>
                      Assign To Parts
                    </button>
                  </div>
                </div>
                <dl className="definition-grid process-revision-grid">
                  <div>
                    <dt>Assignment target</dt>
                    <dd aria-label={`Assignment target ${assignmentTargetSummary?.revisionLabel ?? 'No active revision'}`}>
                      {assignmentTargetMode === 'draft-preview' ? 'Draft preview' : 'Current active'}
                    </dd>
                  </div>
                  <div>
                    <dt>Selected parts</dt>
                    <dd>{selectedPartIds.length}</dd>
                  </div>
                </dl>
                <div className="simple-list" aria-label="Customer parts for assignment">
                  {customerPartEntries.map((part) => (
                    <label className="show-inactive-toggle" key={part.id}>
                      <input
                        type="checkbox"
                        checked={selectedPartIds.includes(part.id)}
                        onChange={(event) => toggleSelectedPart(part.id, event.target.checked)}
                        aria-label={`Assign ${part.partId} ${part.partName || 'Unnamed part'}`}
                      />
                      <span>
                        <strong>{part.partId}</strong> {part.partName || 'Unnamed part'}
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            )}

            <section className="master-section" aria-labelledby="process-dictionary-heading">
              <div className="section-toolbar">
                <h2 id="process-dictionary-heading">Plant Support Dictionary</h2>
              </div>
              {showDictionaryDraft && (
                <div className="master-form-grid">
                  <label>
                    Dictionary kind
                    <select
                      value={dictionaryDraft.kind}
                      onChange={(event) =>
                        setDictionaryDraft({
                          ...dictionaryDraft,
                          kind: event.target.value as PlantSupportDictionaryKind,
                        })
                      }
                    >
                      {dictionaryKinds.map((kind) => (
                        <option key={kind} value={kind}>
                          {kind}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Dictionary code
                    <input
                      value={dictionaryDraft.code}
                      onChange={(event) => setDictionaryDraft({ ...dictionaryDraft, code: event.target.value })}
                    />
                  </label>
                  <label>
                    Dictionary name
                    <input
                      value={dictionaryDraft.name}
                      onChange={(event) => setDictionaryDraft({ ...dictionaryDraft, name: event.target.value })}
                    />
                  </label>
                  <label>
                    Description
                    <input
                      value={dictionaryDraft.description}
                      onChange={(event) =>
                        setDictionaryDraft({ ...dictionaryDraft, description: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Category
                    <input
                      value={dictionaryDraft.category}
                      onChange={(event) => setDictionaryDraft({ ...dictionaryDraft, category: event.target.value })}
                    />
                  </label>
                  <label>
                    Dictionary active
                    <input
                      type="checkbox"
                      checked={dictionaryDraft.active}
                      onChange={(event) => setDictionaryDraft({ ...dictionaryDraft, active: event.target.checked })}
                    />
                  </label>
                  <button className="toolbar-button toolbar-button-primary" type="button" onClick={saveDictionaryEntry}>
                    Save Dictionary Entry
                  </button>
                </div>
              )}
              <div className="table-scroll">
                <table className="data-table" aria-label="Plant support dictionary entries">
                  <thead>
                    <tr>
                      <th scope="col">Kind</th>
                      <th scope="col">Code</th>
                      <th scope="col">Name</th>
                      <th scope="col">Status</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dictionaryEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.kind}</td>
                        <td>{entry.code}</td>
                        <td>{entry.name}</td>
                        <td>{entry.active ? 'Active' : 'Inactive'}</td>
                        <td>
                          {entry.active ? (
                            <button
                              className="row-action-button"
                              type="button"
                              onClick={() => inactivateDictionaryEntry(entry.id)}
                            >
                              Inactivate {entry.name}
                            </button>
                          ) : (
                            <span>-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {draftRevision && (
              <section className="master-section" aria-labelledby="process-draft-fields-heading">
                <h2 id="process-draft-fields-heading">Draft Recipe Header</h2>
                <div className="master-form-grid">
                  <label>
                    Material
                    <input
                      value={draftRevision.material}
                      onChange={(event) => updateDraft({ ...draftRevision, material: event.target.value })}
                    />
                  </label>
                  <label>
                    Specification
                    <input
                      value={draftRevision.specification}
                      onChange={(event) => updateDraft({ ...draftRevision, specification: event.target.value })}
                    />
                  </label>
                  <label>
                    Process code
                    <select
                      value={draftRevision.processCodeId}
                      onChange={(event) => updateDraft({ ...draftRevision, processCodeId: event.target.value })}
                    >
                      <option value="">Select process code</option>
                      {renderDictionaryOptions(activeProcessCodes)}
                    </select>
                  </label>
                  <label>
                    Cert format
                    <input
                      value={draftRevision.certFormat}
                      onChange={(event) => updateDraft({ ...draftRevision, certFormat: event.target.value })}
                    />
                  </label>
                  <label>
                    Effective date
                    <input
                      type="date"
                      value={draftRevision.effectiveDate}
                      onChange={(event) => updateDraft({ ...draftRevision, effectiveDate: event.target.value })}
                    />
                  </label>
                  <label>
                    Notes
                    <input
                      value={draftRevision.notes}
                      onChange={(event) => updateDraft({ ...draftRevision, notes: event.target.value })}
                    />
                  </label>
                </div>
              </section>
            )}

            {draftRevision && (
              <div className="process-workflow-grid">
                <section className="master-section" aria-labelledby="process-steps-heading">
                  <div className="section-toolbar">
                    <h2 id="process-steps-heading">Recipe Steps</h2>
                    <button className="toolbar-button" type="button" onClick={addStep}>
                      Add Step
                    </button>
                  </div>
                  <div className="table-scroll">
                    <table className="data-table process-steps-table" aria-label="Recipe steps">
                      <thead>
                        <tr>
                          <th scope="col">Seq</th>
                          <th scope="col">Step</th>
                          <th scope="col">Process</th>
                          <th scope="col">Equipment</th>
                          <th scope="col">Temp F</th>
                          <th scope="col">Minutes</th>
                          <th scope="col">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {draftRevision.steps.map((step, index) => (
                          <tr key={step.id}>
                            <td>{step.sequence}</td>
                            <td>
                              <input
                                aria-label={`Draft step ${index + 1} name`}
                                value={step.name}
                                onChange={(event) => updateStep(index, 'name', event.target.value)}
                              />
                            </td>
                            <td>
                              <select
                                aria-label={`Draft step ${index + 1} process code`}
                                value={step.processCodeId}
                                onChange={(event) => updateStep(index, 'processCodeId', event.target.value)}
                              >
                                <option value="">Select process</option>
                                {renderDictionaryOptions(activeProcessCodes)}
                              </select>
                            </td>
                            <td>
                              <select
                                aria-label={`Draft step ${index + 1} equipment`}
                                value={step.equipmentId}
                                onChange={(event) => updateStep(index, 'equipmentId', event.target.value)}
                              >
                                <option value="">Select equipment</option>
                                {renderDictionaryOptions(activeEquipment)}
                              </select>
                            </td>
                            <td>
                              <input
                                aria-label={`Draft step ${index + 1} temperature`}
                                type="number"
                                value={step.temperatureF}
                                onChange={(event) =>
                                  updateStep(index, 'temperatureF', readNumber(event.target.valueAsNumber))
                                }
                              />
                            </td>
                            <td>
                              <input
                                aria-label={`Draft step ${index + 1} minutes`}
                                type="number"
                                value={step.minutes}
                                onChange={(event) => updateStep(index, 'minutes', readNumber(event.target.valueAsNumber))}
                              />
                            </td>
                            <td>
                              <div className="process-table-actions">
                                <button
                                  className="row-action-button"
                                  type="button"
                                  aria-label={`Duplicate Draft Step ${index + 1}`}
                                  onClick={() => duplicateStep(index)}
                                >
                                  +
                                </button>
                                <button
                                  className="row-action-button"
                                  type="button"
                                  aria-label={`Move Draft Step ${index + 1} Up`}
                                  onClick={() => moveStep(index)}
                                  disabled={index === 0}
                                >
                                  Up
                                </button>
                                <button
                                  className="row-action-button"
                                  type="button"
                                  aria-label={`Remove Draft Step ${index + 1}`}
                                  onClick={() => removeStep(index)}
                                >
                                  -
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="master-section" aria-labelledby="process-inspections-heading">
                  <div className="section-toolbar">
                    <h2 id="process-inspections-heading">Inspection Requirements</h2>
                    <button className="toolbar-button" type="button" onClick={addInspection}>
                      Add Inspection
                    </button>
                  </div>
                  <div className="table-scroll">
                    <table className="data-table process-inspections-table" aria-label="Inspection requirements">
                      <thead>
                        <tr>
                          <th scope="col">Code</th>
                          <th scope="col">Scale</th>
                          <th scope="col">Target</th>
                          <th scope="col">Minimum</th>
                          <th scope="col">Maximum</th>
                          <th scope="col">Frequency</th>
                        </tr>
                      </thead>
                      <tbody>
                        {draftRevision.inspections.map((inspection, index) => (
                          <tr key={inspection.id}>
                            <td>
                              <select
                                aria-label={`Draft inspection ${index + 1} code`}
                                value={inspection.inspectionCodeId}
                                onChange={(event) => updateInspection(index, 'inspectionCodeId', event.target.value)}
                              >
                                <option value="">Select code</option>
                                {renderDictionaryOptions(activeInspectionCodes)}
                              </select>
                            </td>
                            <td>
                              <select
                                aria-label={`Draft inspection ${index + 1} scale`}
                                value={inspection.inspectionScaleId}
                                onChange={(event) => updateInspection(index, 'inspectionScaleId', event.target.value)}
                              >
                                <option value="">Select scale</option>
                                {renderDictionaryOptions(activeInspectionScales)}
                              </select>
                            </td>
                            <td>
                              <input
                                aria-label={`Draft inspection ${index + 1} target value`}
                                value={inspection.targetValue}
                                onChange={(event) => updateInspection(index, 'targetValue', event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                aria-label={`Draft inspection ${index + 1} minimum value`}
                                value={inspection.minimumValue}
                                onChange={(event) => updateInspection(index, 'minimumValue', event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                aria-label={`Draft inspection ${index + 1} maximum value`}
                                value={inspection.maximumValue}
                                onChange={(event) => updateInspection(index, 'maximumValue', event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                aria-label={`Draft inspection ${index + 1} frequency`}
                                value={inspection.frequency}
                                onChange={(event) => updateInspection(index, 'frequency', event.target.value)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}
          </section>
        </div>
      </section>
    </ModuleGate>
  );
}
