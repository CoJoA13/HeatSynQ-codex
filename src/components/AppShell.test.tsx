import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { User } from '../domain/types';
import { users } from '../data/seed';
import { AppShell } from './AppShell';

describe('AppShell', () => {
  it('shows permission-enabled module navigation and defaults to Order Entry for the seeded admin user', () => {
    render(<AppShell currentUser={users[0]} />);

    expect(screen.getByRole('button', { name: 'Order Entry' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Customer Maintenance' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Part Maintenance' })).toBeEnabled();
    expect(screen.getByRole('heading', { name: 'Order Entry' })).toBeInTheDocument();
  });

  it('switches between master-data modules', async () => {
    const user = userEvent.setup();
    render(<AppShell currentUser={users[0]} />);

    await user.click(screen.getByRole('button', { name: 'Customer Maintenance' }));
    expect(screen.getByRole('heading', { name: 'Customer Maintenance' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Part Maintenance' }));
    expect(screen.getByRole('heading', { name: 'Part Maintenance' })).toBeInTheDocument();
  });

  it('keeps a single app-level main landmark when switching modules', async () => {
    const user = userEvent.setup();
    render(<AppShell currentUser={users[0]} />);

    await user.click(screen.getByRole('button', { name: 'Customer Maintenance' }));

    expect(screen.getAllByRole('main')).toHaveLength(1);
  });

  it('defaults to the first enabled module when Order Entry is not enabled', () => {
    const partOnlyUser: User = {
      id: 'part-only',
      name: 'Part Clerk',
      permissions: ['Part Maintenance'],
    };

    render(<AppShell currentUser={partOnlyUser} />);

    expect(screen.getByRole('button', { name: 'Order Entry' })).toBeDisabled();
    expect(screen.getByRole('heading', { name: 'Part Maintenance' })).toBeInTheDocument();
  });
});
