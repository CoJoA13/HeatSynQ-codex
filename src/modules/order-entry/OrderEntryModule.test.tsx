import { render, screen } from '@testing-library/react';
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
    expect(screen.getByText(/ready to release/i)).toBeVisible();
  });
});
