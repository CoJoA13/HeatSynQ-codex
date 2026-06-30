import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { users } from '../../data/seed';
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
});
