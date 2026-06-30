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
});
