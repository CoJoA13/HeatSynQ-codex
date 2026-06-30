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
