import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { users } from '../../data/seed';
import { CustomerMaintenanceModule } from './CustomerMaintenanceModule';

describe('CustomerMaintenanceModule', () => {
  it('blocks users without Customer Maintenance permission', () => {
    render(<CustomerMaintenanceModule currentUser={users[1]} />);

    expect(screen.getByText('Customer Maintenance permission required')).toBeInTheDocument();
  });

  it('filters customers by AMZ, selects AMZ, and shows linked parts', async () => {
    const user = userEvent.setup();
    render(<CustomerMaintenanceModule currentUser={users[0]} />);

    await user.type(screen.getByLabelText('Search customers'), 'AMZ');
    await user.click(screen.getByRole('button', { name: /AMZ Manufacturing Corporation cust-amz/i }));

    expect(screen.getByRole('heading', { name: 'Customer Maintenance' })).toBeInTheDocument();
    expect(screen.getByLabelText('Customer name')).toHaveDisplayValue('AMZ Manufacturing Corporation');
    expect(screen.getByRole('heading', { name: 'Linked Parts' })).toBeInTheDocument();
    expect(screen.getByText('12496783-HT')).toBeInTheDocument();
    expect(screen.getByText('Shipping hold')).toBeInTheDocument();
  });

  it('keeps existing customer IDs read-only while allowing new customer IDs', async () => {
    const user = userEvent.setup();
    render(<CustomerMaintenanceModule currentUser={users[0]} />);

    expect(screen.getByLabelText('Customer ID')).toHaveAttribute('readonly');

    await user.click(screen.getByRole('button', { name: 'New Customer' }));

    expect(screen.getByLabelText('Customer ID')).not.toHaveAttribute('readonly');
  });

  it('shows validation summary when saving a customer without a name', async () => {
    const user = userEvent.setup();
    render(<CustomerMaintenanceModule currentUser={users[0]} />);

    await user.clear(screen.getByLabelText('Customer name'));
    await user.click(screen.getByRole('button', { name: 'Save Customer' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Customer name is required.');
  });

  it('keeps warning-only validation visible when saving a valid new customer', async () => {
    const user = userEvent.setup();
    render(<CustomerMaintenanceModule currentUser={users[0]} />);

    await user.click(screen.getByRole('button', { name: 'New Customer' }));
    await user.type(screen.getByLabelText('Customer ID'), 'cust-warning');
    await user.type(screen.getByLabelText('Customer name'), 'Warning Only Customer');
    await user.click(screen.getByRole('button', { name: 'Save Customer' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Missing order defaults: received-from and ship-to.');
    expect(screen.getByText('Customer saved.')).toBeVisible();
  });

  it('cancels edits and restores the selected customer draft', async () => {
    const user = userEvent.setup();
    render(<CustomerMaintenanceModule currentUser={users[0]} />);

    await user.clear(screen.getByLabelText('Customer name'));
    await user.type(screen.getByLabelText('Customer name'), 'Edited Customer Name');
    await user.click(screen.getByRole('button', { name: 'Cancel Edits' }));

    expect(screen.getByLabelText('Customer name')).toHaveDisplayValue('GFMCO - Columbus LLC');
  });

  it('does not assign invalid list semantics to customer row buttons', () => {
    render(<CustomerMaintenanceModule currentUser={users[0]} />);

    const customerList = screen.getByRole('complementary', { name: 'Customer list' });

    expect(within(customerList).queryByRole('list')).not.toBeInTheDocument();
  });

  it('saves request days changes inside Order Rules', async () => {
    const user = userEvent.setup();
    render(<CustomerMaintenanceModule currentUser={users[0]} />);

    const orderRules = screen.getByRole('region', { name: 'Order Rules' });
    const requestDays = within(orderRules).getByLabelText('Request days');

    await user.clear(requestDays);
    await user.type(requestDays, '9');
    await user.click(screen.getByRole('button', { name: 'Save Customer' }));

    expect(within(orderRules).getByLabelText('Request days')).toHaveValue(9);
    expect(screen.getByText('Customer saved.')).toBeVisible();
  });
});
