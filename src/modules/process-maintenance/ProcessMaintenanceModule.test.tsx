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
