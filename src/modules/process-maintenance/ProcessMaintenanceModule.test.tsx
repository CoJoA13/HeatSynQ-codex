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
    expect(screen.getByRole('status')).toHaveTextContent('Draft saved.');
    expect(screen.getByText('Draft saved.')).toBeVisible();
    expect(screen.getByText('Specification is required before promotion.')).toBeVisible();
  });

  it('links a newly saved draft to a process master without an existing draft', async () => {
    const user = userEvent.setup();
    const { onProcessMastersChange, onProcessRevisionsChange } = renderProcessMaintenance();

    await user.click(screen.getByRole('button', { name: /12-496783-HT 8620 Steel Carburize Route/i }));
    await user.click(screen.getByRole('button', { name: 'Save Draft' }));

    const savedRevisions = onProcessRevisionsChange.mock.calls[0]?.[0] as typeof processRevisions;
    const savedDraft = savedRevisions.find(
      (revision) => revision.processMasterId === '12-496783-HT' && revision.status === 'Draft',
    );

    expect(savedDraft).toBeDefined();
    if (!savedDraft) throw new Error('Expected saved draft');
    expect(onProcessMastersChange).toHaveBeenCalled();
    expect(onProcessMastersChange.mock.calls[0][0]).toContainEqual(
      expect.objectContaining({
        id: '12-496783-HT',
        draftRevisionId: savedDraft.id,
      }),
    );
  });

  it('syncs the selected local draft when parent process props point to a new draft revision', async () => {
    const user = userEvent.setup();
    const onProcessMastersChange = vi.fn();
    const onProcessRevisionsChange = vi.fn();
    const onPlantSupportDictionaryEntriesChange = vi.fn();
    const onCustomerPartsChange = vi.fn();
    const rendered = render(
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

    await user.click(screen.getByRole('button', { name: /12-496783-HT 8620 Steel Carburize Route/i }));
    expect(screen.getByText('Rev 5 Draft')).toBeInTheDocument();

    const parentDraft = {
      ...structuredClone(processRevisions.find((revision) => revision.id === 'proc-rev-carburize-4')!),
      id: 'proc-rev-carburize-parent-draft',
      revision: 8,
      status: 'Draft' as const,
      effectiveDate: '',
      specification: 'Parent synchronized spec',
    };
    const parentMasters = processMasters.map((processMaster) =>
      processMaster.id === '12-496783-HT'
        ? { ...processMaster, draftRevisionId: parentDraft.id }
        : processMaster,
    );

    rendered.rerender(
      <ProcessMaintenanceModule
        currentUser={users[0]}
        processMasters={parentMasters}
        processRevisions={[...processRevisions, parentDraft]}
        plantSupportDictionaryEntries={plantSupportDictionaryEntries}
        customerParts={customerParts}
        onProcessMastersChange={onProcessMastersChange}
        onProcessRevisionsChange={onProcessRevisionsChange}
        onPlantSupportDictionaryEntriesChange={onPlantSupportDictionaryEntriesChange}
        onCustomerPartsChange={onCustomerPartsChange}
      />,
    );

    expect(await screen.findByText('Rev 8 Draft')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Parent synchronized spec')).toBeInTheDocument();
  });

  it('syncs the selected local draft when parent process props clear the draft revision pointer', async () => {
    const user = userEvent.setup();
    const onProcessMastersChange = vi.fn();
    const onProcessRevisionsChange = vi.fn();
    const onPlantSupportDictionaryEntriesChange = vi.fn();
    const onCustomerPartsChange = vi.fn();
    const initialRevisions = processRevisions.map((revision) =>
      revision.id === 'proc-rev-austemper-draft' ? { ...revision, revision: 99 } : revision,
    );
    const rendered = render(
      <ProcessMaintenanceModule
        currentUser={users[0]}
        processMasters={structuredClone(processMasters)}
        processRevisions={initialRevisions}
        plantSupportDictionaryEntries={structuredClone(plantSupportDictionaryEntries)}
        customerParts={structuredClone(customerParts)}
        onProcessMastersChange={onProcessMastersChange}
        onProcessRevisionsChange={onProcessRevisionsChange}
        onPlantSupportDictionaryEntriesChange={onPlantSupportDictionaryEntriesChange}
        onCustomerPartsChange={onCustomerPartsChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: /15-29900-003 Ductile Iron Austemper Route/i }));
    expect(screen.getByText('Rev 99 Draft')).toBeInTheDocument();

    const clearedDraftMasters = processMasters.map((processMaster) =>
      processMaster.id === '15-29900-003' ? { ...processMaster, draftRevisionId: '' } : processMaster,
    );
    const promotedRevisions = initialRevisions.filter((revision) => revision.id !== 'proc-rev-austemper-draft');

    rendered.rerender(
      <ProcessMaintenanceModule
        currentUser={users[0]}
        processMasters={clearedDraftMasters}
        processRevisions={promotedRevisions}
        plantSupportDictionaryEntries={plantSupportDictionaryEntries}
        customerParts={customerParts}
        onProcessMastersChange={onProcessMastersChange}
        onProcessRevisionsChange={onProcessRevisionsChange}
        onPlantSupportDictionaryEntriesChange={onPlantSupportDictionaryEntriesChange}
        onCustomerPartsChange={onCustomerPartsChange}
      />,
    );

    expect(await screen.findByText('Rev 17 Draft')).toBeInTheDocument();
    expect(screen.queryByText('Rev 99 Draft')).not.toBeInTheDocument();
  });

  it('syncs a cleared parent draft pointer over dirty local edits', async () => {
    const user = userEvent.setup();
    const onProcessMastersChange = vi.fn();
    const onProcessRevisionsChange = vi.fn();
    const onPlantSupportDictionaryEntriesChange = vi.fn();
    const onCustomerPartsChange = vi.fn();
    const initialRevisions = processRevisions.map((revision) =>
      revision.id === 'proc-rev-austemper-draft' ? { ...revision, revision: 99 } : revision,
    );
    const rendered = render(
      <ProcessMaintenanceModule
        currentUser={users[0]}
        processMasters={structuredClone(processMasters)}
        processRevisions={initialRevisions}
        plantSupportDictionaryEntries={structuredClone(plantSupportDictionaryEntries)}
        customerParts={structuredClone(customerParts)}
        onProcessMastersChange={onProcessMastersChange}
        onProcessRevisionsChange={onProcessRevisionsChange}
        onPlantSupportDictionaryEntriesChange={onPlantSupportDictionaryEntriesChange}
        onCustomerPartsChange={onCustomerPartsChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: /15-29900-003 Ductile Iron Austemper Route/i }));
    await user.type(screen.getByLabelText('Specification'), 'Dirty local spec');
    expect(screen.getByText('Rev 99 Draft')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Dirty local spec')).toBeInTheDocument();

    const clearedDraftMasters = processMasters.map((processMaster) =>
      processMaster.id === '15-29900-003' ? { ...processMaster, draftRevisionId: '' } : processMaster,
    );
    const promotedRevisions = initialRevisions.filter((revision) => revision.id !== 'proc-rev-austemper-draft');

    rendered.rerender(
      <ProcessMaintenanceModule
        currentUser={users[0]}
        processMasters={clearedDraftMasters}
        processRevisions={promotedRevisions}
        plantSupportDictionaryEntries={plantSupportDictionaryEntries}
        customerParts={customerParts}
        onProcessMastersChange={onProcessMastersChange}
        onProcessRevisionsChange={onProcessRevisionsChange}
        onPlantSupportDictionaryEntriesChange={onPlantSupportDictionaryEntriesChange}
        onCustomerPartsChange={onCustomerPartsChange}
      />,
    );

    expect(await screen.findByText('Rev 17 Draft')).toBeInTheDocument();
    expect(screen.queryByText('Rev 99 Draft')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('Dirty local spec')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Eq: 180; Gr: IQ')).toBeInTheDocument();
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

  it('exposes readiness-validated dictionary references for draft steps', async () => {
    const user = userEvent.setup();
    renderProcessMaintenance();

    await user.click(screen.getByRole('button', { name: /15-29900-003 Ductile Iron Austemper Route/i }));
    await user.click(screen.getByRole('button', { name: 'Add Step' }));
    await user.selectOptions(screen.getByLabelText('Draft step 1 table key'), 'dict-table-carburize-furnace');
    await user.selectOptions(screen.getByLabelText('Draft step 1 cost center'), 'dict-cost-center-inspection');

    expect(screen.getByLabelText('Draft step 1 table key')).toHaveDisplayValue('CARB-FURN - Carburize Furnace');
    expect(screen.getByLabelText('Draft step 1 group')).toHaveDisplayValue('HT - Heat Treat');
    expect(screen.getByLabelText('Draft step 1 cost center')).toHaveDisplayValue('CC-INSP - Inspection');
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
    const addCalls = onPlantSupportDictionaryEntriesChange.mock.calls;
    const addedEntries = addCalls[addCalls.length - 1][0] as typeof plantSupportDictionaryEntries;
    expect(addedEntries).toContainEqual(
      expect.objectContaining({
        kind: 'Equipment',
        code: 'FURN-9',
        name: 'Furnace 9',
        active: true,
      }),
    );

    await user.click(screen.getByRole('button', { name: 'Inactivate Furnace 9' }));

    const inactivateCalls = onPlantSupportDictionaryEntriesChange.mock.calls;
    const inactivatedEntries = inactivateCalls[inactivateCalls.length - 1][0] as typeof plantSupportDictionaryEntries;
    expect(inactivatedEntries.find((entry) => entry.name === 'Furnace 9')).toMatchObject({
      active: false,
    });
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
    const promotedMasters = onProcessMastersChange.mock.calls[0][0] as typeof processMasters;
    const promotedMaster = promotedMasters.find((processMaster) => processMaster.id === '12-496783-HT');
    expect(promotedMaster).toBeDefined();
    if (!promotedMaster) throw new Error('Expected promoted process master');
    expect(promotedMaster.draftRevisionId).toBe('');
    expect(promotedMaster.activeRevisionId).not.toBe('proc-rev-carburize-4');

    const promotedDraftId = promotedMaster.activeRevisionId;
    const promotedRevisions = onProcessRevisionsChange.mock.calls[0][0] as typeof processRevisions;
    expect(promotedRevisions.find((revision) => revision.id === promotedDraftId)?.status).toBe('Active');
    expect(promotedRevisions.find((revision) => revision.id === 'proc-rev-carburize-4')?.status).toBe('Draft');
    expect(screen.getByText('Draft promoted to active revision.')).toBeVisible();
    expect(screen.getByText('Rev 6 Draft')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save Draft' }));

    const saveMasterCalls = onProcessMastersChange.mock.calls;
    const savedMasters = saveMasterCalls[saveMasterCalls.length - 1][0] as typeof processMasters;
    const savedMaster = savedMasters.find((processMaster) => processMaster.id === '12-496783-HT');
    expect(savedMaster).toBeDefined();
    if (!savedMaster) throw new Error('Expected saved process master');
    expect(savedMaster.activeRevisionId).toBe(promotedDraftId);
    expect(savedMaster.draftRevisionId).not.toBe(promotedDraftId);

    const saveRevisionCalls = onProcessRevisionsChange.mock.calls;
    const savedRevisions = saveRevisionCalls[saveRevisionCalls.length - 1][0] as typeof processRevisions;
    expect(savedRevisions.find((revision) => revision.id === promotedDraftId)?.status).toBe('Active');
    expect(savedRevisions.find((revision) => revision.id === 'proc-rev-carburize-4')?.status).toBe('Draft');
    expect(savedRevisions.find((revision) => revision.id === savedMaster.draftRevisionId)?.status).toBe('Draft');
  });

  it('assigns the active process revision to multiple customer parts', async () => {
    const user = userEvent.setup();
    const { onCustomerPartsChange } = renderProcessMaintenance();

    await user.click(screen.getByRole('button', { name: /15-29900-003 Ductile Iron Austemper Route/i }));
    await user.click(screen.getByLabelText('Assign 15-29900-DRAFT Draft Tow Variation'));
    await user.click(screen.getByRole('button', { name: 'Assign To Parts' }));

    expect(onCustomerPartsChange).toHaveBeenCalled();
    const assignmentCalls = onCustomerPartsChange.mock.calls;
    const updatedParts = assignmentCalls[assignmentCalls.length - 1][0] as typeof customerParts;
    expect(updatedParts.find((part) => part.id === 'part-gfmco-draft')).toMatchObject({
      processMasterId: '15-29900-003',
      processRevisionId: 'proc-rev-austemper-16',
    });
    expect(screen.getByText('Assigned process revision to 1 part.')).toBeVisible();
  });

  it('blocks assigning a draft revision to parts', async () => {
    const user = userEvent.setup();
    const { onCustomerPartsChange } = renderProcessMaintenance();

    await user.click(screen.getByRole('button', { name: /15-29900-003 Ductile Iron Austemper Route/i }));
    await user.click(screen.getByRole('button', { name: 'Use Draft For Assignment Preview' }));
    await user.click(screen.getByLabelText('Assign 15-29900-DRAFT Draft Tow Variation'));
    await user.click(screen.getByRole('button', { name: 'Assign To Parts' }));

    expect(onCustomerPartsChange).not.toHaveBeenCalled();
    expect(screen.getByText('Draft revisions cannot be assigned to parts.')).toBeVisible();
  });

  it('prunes selected assignment parts when parent customer parts remove a selected part', async () => {
    const user = userEvent.setup();
    const onProcessMastersChange = vi.fn();
    const onProcessRevisionsChange = vi.fn();
    const onPlantSupportDictionaryEntriesChange = vi.fn();
    const onCustomerPartsChange = vi.fn();
    const rendered = render(
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

    await user.click(screen.getByRole('button', { name: /15-29900-003 Ductile Iron Austemper Route/i }));
    await user.click(screen.getByLabelText('Assign 15-29900-DRAFT Draft Tow Variation'));

    rendered.rerender(
      <ProcessMaintenanceModule
        currentUser={users[0]}
        processMasters={processMasters}
        processRevisions={processRevisions}
        plantSupportDictionaryEntries={plantSupportDictionaryEntries}
        customerParts={customerParts.filter((part) => part.id !== 'part-gfmco-draft')}
        onProcessMastersChange={onProcessMastersChange}
        onProcessRevisionsChange={onProcessRevisionsChange}
        onPlantSupportDictionaryEntriesChange={onPlantSupportDictionaryEntriesChange}
        onCustomerPartsChange={onCustomerPartsChange}
      />,
    );

    expect(screen.queryByLabelText('Assign 15-29900-DRAFT Draft Tow Variation')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Assign To Parts' }));

    expect(screen.getByText('Select at least one customer part.')).toBeVisible();
    expect(screen.queryByText('Selected customer part part-gfmco-draft was not found.')).not.toBeInTheDocument();
  });
});
