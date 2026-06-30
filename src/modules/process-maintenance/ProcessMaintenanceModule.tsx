import { useMemo, useState } from 'react';
import { ModuleGate } from '../../components/ModuleGate';
import {
  filterActiveDictionaryEntries,
  getActiveProcessRevision,
  getDraftProcessRevision,
  getProcessDisplaySummary,
  getProcessRevisionReadiness,
} from '../../domain/processFoundation';
import type {
  CustomerPart,
  PlantSupportDictionaryEntry,
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
  onProcessRevisionsChange,
}: ProcessMaintenanceModuleProps) {
  const firstProcessMaster = processMasters[0];
  const [selectedProcessMasterId, setSelectedProcessMasterId] = useState(firstProcessMaster?.id ?? '');
  const [draftRevision, setDraftRevision] = useState<ProcessRevision | undefined>(() =>
    firstProcessMaster ? createEditableDraft(firstProcessMaster, processRevisions) : undefined,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [validationMessages, setValidationMessages] = useState<string[]>([]);
  const [saveSummary, setSaveSummary] = useState('');

  const selectedProcessMaster =
    processMasters.find((processMaster) => processMaster.id === selectedProcessMasterId) ?? firstProcessMaster;
  const activeRevision = selectedProcessMaster
    ? getActiveProcessRevision(selectedProcessMaster, processRevisions)
    : undefined;
  const activeSummary = selectedProcessMaster
    ? getProcessDisplaySummary(selectedProcessMaster, activeRevision, plantSupportDictionaryEntries)
    : undefined;
  const draftSummary =
    selectedProcessMaster && draftRevision
      ? getProcessDisplaySummary(selectedProcessMaster, draftRevision, plantSupportDictionaryEntries)
      : undefined;
  const draftReadiness = draftRevision
    ? getProcessRevisionReadiness(draftRevision, plantSupportDictionaryEntries)
    : undefined;
  const readinessMessages = validationMessages.length > 0 ? validationMessages : draftReadiness?.blockers ?? [];
  const assignedPartCount = selectedProcessMaster
    ? customerParts.filter((part) => part.processMasterId === selectedProcessMaster.id).length
    : 0;

  const activeProcessCodes = useMemo(
    () => filterActiveDictionaryEntries(plantSupportDictionaryEntries, 'Process Code'),
    [plantSupportDictionaryEntries],
  );
  const activeEquipment = useMemo(
    () => filterActiveDictionaryEntries(plantSupportDictionaryEntries, 'Equipment'),
    [plantSupportDictionaryEntries],
  );
  const activeGroups = useMemo(
    () => filterActiveDictionaryEntries(plantSupportDictionaryEntries, 'Group'),
    [plantSupportDictionaryEntries],
  );
  const activeCostCenters = useMemo(
    () => filterActiveDictionaryEntries(plantSupportDictionaryEntries, 'Cost Center'),
    [plantSupportDictionaryEntries],
  );
  const activeInspectionCodes = useMemo(
    () => filterActiveDictionaryEntries(plantSupportDictionaryEntries, 'Inspection Code'),
    [plantSupportDictionaryEntries],
  );
  const activeInspectionScales = useMemo(
    () => filterActiveDictionaryEntries(plantSupportDictionaryEntries, 'Inspection Scale'),
    [plantSupportDictionaryEntries],
  );
  const activeTableKeys = useMemo(
    () => filterActiveDictionaryEntries(plantSupportDictionaryEntries, 'Table Key'),
    [plantSupportDictionaryEntries],
  );

  const filteredProcessMasters = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();

    if (!normalizedQuery) return processMasters;

    return processMasters.filter((processMaster) => {
      const processActiveRevision = getActiveProcessRevision(processMaster, processRevisions);
      const processDraftRevision = getDraftProcessRevision(processMaster, processRevisions);
      const processActiveSummary = getProcessDisplaySummary(
        processMaster,
        processActiveRevision,
        plantSupportDictionaryEntries,
      );
      const processDraftSummary = getProcessDisplaySummary(
        processMaster,
        processDraftRevision,
        plantSupportDictionaryEntries,
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
  }, [plantSupportDictionaryEntries, processMasters, processRevisions, searchQuery]);

  function renderDictionaryOptions(entries: PlantSupportDictionaryEntry[]) {
    return entries.map((entry) => (
      <option key={entry.id} value={entry.id}>
        {entry.code} - {entry.name}
      </option>
    ));
  }

  function selectProcess(processMaster: ProcessMaster) {
    const nextDraftRevision = createEditableDraft(processMaster, processRevisions);

    setSelectedProcessMasterId(processMaster.id);
    setDraftRevision(nextDraftRevision);
    setValidationMessages(getProcessRevisionReadiness(nextDraftRevision, plantSupportDictionaryEntries).blockers);
    setSaveSummary('');
  }

  function updateDraft(nextDraftRevision: ProcessRevision) {
    setDraftRevision(nextDraftRevision);
    setValidationMessages(getProcessRevisionReadiness(nextDraftRevision, plantSupportDictionaryEntries).blockers);
    setSaveSummary('');
  }

  function saveDraft() {
    if (!draftRevision) return;

    const savedDraft = structuredClone(draftRevision);
    const existingRevisionIndex = processRevisions.findIndex((revision) => revision.id === savedDraft.id);
    const nextRevisions =
      existingRevisionIndex === -1
        ? [...processRevisions, savedDraft]
        : processRevisions.map((revision, index) => (index === existingRevisionIndex ? savedDraft : revision));

    onProcessRevisionsChange(nextRevisions);
    setDraftRevision(savedDraft);
    setValidationMessages(getProcessRevisionReadiness(savedDraft, plantSupportDictionaryEntries).blockers);
    setSaveSummary('Draft saved.');
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
            {saveSummary && <p className="save-summary">{saveSummary}</p>}

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
                {readinessMessages.length > 0 ? (
                  <div className="validation-summary" role="alert">
                    {readinessMessages.map((message) => (
                      <p key={message}>{message}</p>
                    ))}
                  </div>
                ) : (
                  <p className="empty-copy">No readiness issues found.</p>
                )}
              </section>
            )}

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
