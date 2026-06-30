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

  it('displays active process revision details and enhanced steps from shared process data', async () => {
    const user = userEvent.setup();
    render(<OrderEntryModule currentUser={users[0]} />);

    await user.click(screen.getByRole('tab', { name: 'Process' }));
    await user.selectOptions(screen.getByLabelText('Process master'), '15-29900-003');

    expect(screen.getByText('Rev 16 Active')).toBeInTheDocument();
    expect(screen.getByText('Generic - AM')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Steps' }));

    expect(screen.getByText('Austenitize')).toBeInTheDocument();
    expect(screen.getByText('+/- 15 F')).toBeInTheDocument();
    expect(screen.getByText('Controlled')).toBeInTheDocument();
  });

  it('wires toolbar actions to the active order state', async () => {
    const user = userEvent.setup();
    render(<OrderEntryModule currentUser={users[0]} />);

    await user.click(screen.getByRole('button', { name: /new order/i }));

    expect(screen.getByText(/Order Draft \/ Unassigned/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ready to Release' })).toBeInTheDocument();
  });

  it('checks draft readiness before building part and container totals', async () => {
    const user = userEvent.setup();
    render(<OrderEntryModule currentUser={users[0]} />);

    await user.click(screen.getByRole('button', { name: /new order/i }));
    await user.click(screen.getByRole('button', { name: /check/i }));

    expect(screen.getByText(/Missing: Assigned customer/i)).toBeVisible();

    await user.click(screen.getByRole('tab', { name: 'Parts' }));
    await user.click(screen.getByRole('button', { name: /add container/i }));

    expect(screen.getByRole('heading', { name: 'Container Totals' })).toBeVisible();
    expect(screen.getByLabelText('Container 1 quantity')).toHaveValue(0);
    expect(screen.getByText('Net weight 0.00 lb')).toBeVisible();
  });

  it('keeps release blocked for blank container and part rows until real quantity or weight is entered', async () => {
    const user = userEvent.setup();
    render(<OrderEntryModule currentUser={users[0]} />);

    await user.click(screen.getByRole('button', { name: /new order/i }));
    await user.selectOptions(screen.getByLabelText('Customer'), 'cust-amz');
    await user.click(screen.getByRole('tab', { name: 'Process' }));
    await user.selectOptions(screen.getByLabelText('Process master'), '12-496783-HT');
    await user.click(screen.getByRole('tab', { name: 'Parts' }));
    await user.click(screen.getByRole('button', { name: /add container/i }));
    await user.click(screen.getByRole('button', { name: /add part/i }));

    await user.click(screen.getByRole('button', { name: /release order/i }));

    expect(screen.getByText(/Release blocked\. Missing: Quantity or weight/i)).toBeVisible();
    expect(screen.getByRole('button', { name: /release order/i })).toHaveAttribute('aria-disabled', 'true');
  });

  it('surfaces invalid negative net weight and keeps release blocked', async () => {
    const user = userEvent.setup();
    render(<OrderEntryModule currentUser={users[0]} />);

    await user.click(screen.getByRole('tab', { name: 'Parts' }));
    await user.clear(screen.getByLabelText('Container 1 gross weight'));
    await user.type(screen.getByLabelText('Container 1 gross weight'), '20');
    await user.clear(screen.getByLabelText('Container 1 tare weight'));
    await user.type(screen.getByLabelText('Container 1 tare weight'), '30');

    expect(screen.getByText('Net weight cannot be negative.')).toBeVisible();

    await user.click(screen.getByRole('button', { name: /release order/i }));

    expect(screen.getByText(/Release blocked\. Missing: Valid container net weight/i)).toBeVisible();
    expect(screen.getByRole('button', { name: /release order/i })).toHaveAttribute('aria-disabled', 'true');
  });

  it('records a release event when a ready order is released', async () => {
    const user = userEvent.setup();
    render(<OrderEntryModule currentUser={users[0]} />);

    await user.click(screen.getByRole('button', { name: /release order/i }));

    expect(screen.getByText(/Released order 71951/i)).toBeVisible();
  });

  it('restores the last saved working order when canceling edits', async () => {
    const user = userEvent.setup();
    render(<OrderEntryModule currentUser={users[0]} />);

    await user.click(screen.getByRole('button', { name: /new order/i }));
    await user.selectOptions(screen.getByLabelText('Customer'), 'cust-amz');
    await user.click(screen.getByRole('button', { name: /save order draft/i }));
    await user.selectOptions(screen.getByLabelText('Customer'), 'cust-gfmco');
    await user.click(screen.getByRole('button', { name: /cancel edits/i }));

    expect(screen.getByText(/Order Draft \/ AMZ Manufacturing Corporation/i)).toBeVisible();
    expect(screen.queryByText(/Order 71951/i)).not.toBeInTheDocument();
  });

  it('uses readiness items as shortcuts to the related tabs', async () => {
    const user = userEvent.setup();
    render(<OrderEntryModule currentUser={users[0]} />);

    await user.click(screen.getByRole('button', { name: /new order/i }));
    await user.click(screen.getByRole('button', { name: /Existing process master/i }));

    expect(screen.getByRole('tab', { name: 'Process' })).toHaveAttribute('aria-selected', 'true');
  });
});
