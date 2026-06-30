import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  customerParts,
  plantSupportDictionaryEntries,
  processMasters,
  processRevisions,
  users,
} from '../../data/seed';
import { PartMaintenanceModule } from './PartMaintenanceModule';

describe('PartMaintenanceModule', () => {
  it('blocks users without Part Maintenance permission', () => {
    render(<PartMaintenanceModule currentUser={users[1]} />);

    expect(screen.getByText('Part Maintenance permission required')).toBeInTheDocument();
  });

  it('filters parts by Guard, selects 12496783-HT, and shows readiness warning', async () => {
    const user = userEvent.setup();
    render(<PartMaintenanceModule currentUser={users[0]} />);

    await user.type(screen.getByLabelText('Search parts'), 'Guard');
    await user.click(screen.getByRole('button', { name: /12496783-HT Guard, Right Track/i }));

    expect(screen.getByLabelText('Part name')).toHaveDisplayValue('Guard, Right Track');
    expect(screen.getByRole('heading', { name: 'Order Entry Use' })).toBeInTheDocument();
    expect(screen.getByText('Ready for Order Entry')).toBeInTheDocument();
    expect(screen.getByText('Shipping hold will block shipping readiness.')).toBeInTheDocument();
  });

  it('saves a draft new part without a process master and keeps readiness blocker visible', async () => {
    const user = userEvent.setup();
    render(<PartMaintenanceModule currentUser={users[0]} />);

    await user.click(screen.getByRole('button', { name: 'New Part' }));
    await user.type(screen.getByLabelText('Part ID'), 'NEW-DRAFT');
    await user.selectOptions(screen.getByLabelText('Customer'), 'cust-gfmco');
    await user.click(screen.getByRole('button', { name: 'Save Part' }));

    expect(screen.getByText('Part saved.')).toBeVisible();
    expect(screen.getByText('Missing process master.')).toBeVisible();
  });

  it('clears stale validation warning alerts after draft edits', async () => {
    const user = userEvent.setup();
    render(<PartMaintenanceModule currentUser={users[0]} />);

    await user.click(screen.getByRole('button', { name: 'New Part' }));
    await user.type(screen.getByLabelText('Part ID'), 'STALE-WARNING');
    await user.selectOptions(screen.getByLabelText('Customer'), 'cust-gfmco');
    await user.click(screen.getByRole('button', { name: 'Save Part' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Draft part is missing process master.');

    await user.selectOptions(screen.getByLabelText('Process master'), '15-29900-003');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText('Draft part is missing process master.')).not.toBeInTheDocument();
  });

  it('does not append duplicate records when saving a new part twice quickly', async () => {
    const user = userEvent.setup();
    render(<PartMaintenanceModule currentUser={users[0]} />);

    await user.click(screen.getByRole('button', { name: 'New Part' }));
    await user.type(screen.getByLabelText('Part ID'), 'DOUBLE-SAVE');
    await user.selectOptions(screen.getByLabelText('Customer'), 'cust-gfmco');
    await user.selectOptions(screen.getByLabelText('Process master'), '15-29900-003');
    const saveButton = screen.getByRole('button', { name: 'Save Part' });
    act(() => {
      fireEvent.click(saveButton);
      fireEvent.click(saveButton);
    });
    await user.clear(screen.getByLabelText('Search parts'));
    await user.type(screen.getByLabelText('Search parts'), 'DOUBLE-SAVE');

    expect(screen.getAllByRole('button', { name: /^DOUBLE-SAVE/i })).toHaveLength(1);
  });

  it('blocks duplicate part IDs for the same customer', async () => {
    const user = userEvent.setup();
    render(<PartMaintenanceModule currentUser={users[0]} />);

    await user.click(screen.getByRole('button', { name: 'New Part' }));
    await user.type(screen.getByLabelText('Part ID'), '15-29900-010');
    await user.selectOptions(screen.getByLabelText('Customer'), 'cust-gfmco');
    await user.click(screen.getByRole('button', { name: 'Save Part' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Part ID must be unique for this customer.');
  });

  it('does not assign invalid list semantics to part row buttons', () => {
    render(<PartMaintenanceModule currentUser={users[0]} />);

    const partList = screen.getByRole('complementary', { name: 'Part list' });

    expect(within(partList).queryByRole('list')).not.toBeInTheDocument();
  });

  it('shows shared active process revision details for a linked part', async () => {
    const user = userEvent.setup();
    render(<PartMaintenanceModule currentUser={users[0]} />);

    await user.type(screen.getByLabelText('Search parts'), '15-29900-010');
    await user.click(screen.getByRole('button', { name: /15-29900-010 CNTR TOW/i }));

    expect(screen.getByText('Rev 16 Active')).toBeInTheDocument();
    expect(screen.getByText('Current active revision')).toBeInTheDocument();
    expect(screen.getByText('4 process steps')).toBeInTheDocument();
    expect(screen.getByText('1 required inspection')).toBeInTheDocument();
  });

  it('shows a stale stored process revision instead of the process master active revision', () => {
    const staleRevisionParts = [
      {
        ...structuredClone(customerParts[0]),
        processRevisionId: 'proc-rev-austemper-draft',
        revision: '17',
      },
    ];

    render(
      <PartMaintenanceModule
        currentUser={users[0]}
        parts={staleRevisionParts}
        processMasters={processMasters}
        processRevisions={processRevisions}
        plantSupportDictionaryEntries={plantSupportDictionaryEntries}
      />,
    );

    expect(screen.getByText('Rev 17 Draft')).toBeInTheDocument();
    expect(screen.getByText('Not current active revision')).toBeInTheDocument();
    expect(screen.queryByText('Rev 16 Active')).not.toBeInTheDocument();
  });

  it('flags a stored process revision that belongs to another process master', () => {
    const mismatchedRevisionParts = [
      {
        ...structuredClone(customerParts[0]),
        processRevisionId: 'proc-rev-carburize-4',
      },
    ];

    render(
      <PartMaintenanceModule
        currentUser={users[0]}
        parts={mismatchedRevisionParts}
        processMasters={processMasters}
        processRevisions={processRevisions}
        plantSupportDictionaryEntries={plantSupportDictionaryEntries}
      />,
    );

    expect(screen.getByText('Stored process revision does not belong to selected process master.')).toBeInTheDocument();
    expect(screen.queryByText('Rev 16 Active')).not.toBeInTheDocument();
  });
});
