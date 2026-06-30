import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { users } from '../../data/seed';
import { OrderEntryModule } from './OrderEntryModule';

describe('OrderEntryModule', () => {
  it('blocks users without the Order Entry permission', () => {
    render(<OrderEntryModule currentUser={users[1]} />);
    expect(screen.getByText('Order Entry permission required')).toBeInTheDocument();
  });

  it('shows the module for users with the Order Entry permission', () => {
    render(<OrderEntryModule currentUser={users[0]} />);
    expect(screen.getByRole('heading', { name: 'Order Entry' })).toBeInTheDocument();
  });

  it('renders the operational Order Entry shell for permitted users', () => {
    render(<OrderEntryModule currentUser={users[0]} />);

    expect(screen.getByRole('button', { name: /new order/i })).toBeInTheDocument();

    for (const tabName of ['Order Top', 'Detail', 'Parts', 'Process', 'Steps']) {
      expect(screen.getByRole('tab', { name: tabName })).toBeInTheDocument();
    }

    expect(screen.queryByText('Assembly')).not.toBeInTheDocument();
    expect(screen.queryByText('Inventory')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ready to Release' })).toBeVisible();
  });

  it('lets users switch between Order Entry tabs', async () => {
    const user = userEvent.setup();
    render(<OrderEntryModule currentUser={users[0]} />);

    await user.click(screen.getByRole('tab', { name: 'Process' }));

    expect(screen.getByRole('tab', { name: 'Process' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Order Top' })).toHaveAttribute('aria-selected', 'false');
  });

  it('syncs customer and process selections across order entry tabs', async () => {
    const user = userEvent.setup();
    render(<OrderEntryModule currentUser={users[0]} />);

    await user.selectOptions(screen.getByLabelText('Customer'), 'cust-amz');

    expect(screen.getByLabelText('Customer')).toHaveDisplayValue('AMZ Manufacturing Corporation');

    await user.click(screen.getByRole('tab', { name: 'Process' }));
    await user.selectOptions(screen.getByLabelText('Process master'), '12-496783-HT');

    expect(screen.getByText('Carburize')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Steps' }));

    expect(screen.getByText('Oil quench')).toBeInTheDocument();
  });

  it('wires toolbar actions to the active order state', async () => {
    const user = userEvent.setup();
    render(<OrderEntryModule currentUser={users[0]} />);

    await user.click(screen.getByRole('button', { name: /new order/i }));

    expect(screen.getByText(/Order Draft \/ Unassigned/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ready to Release' })).toBeInTheDocument();
  });

  it('uses readiness items as shortcuts to the related tabs', async () => {
    const user = userEvent.setup();
    render(<OrderEntryModule currentUser={users[0]} />);

    await user.click(screen.getByRole('button', { name: /new order/i }));
    await user.click(screen.getByRole('button', { name: /Existing process master/i }));

    expect(screen.getByRole('tab', { name: 'Process' })).toHaveAttribute('aria-selected', 'true');
  });
});
