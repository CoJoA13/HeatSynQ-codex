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
    expect(screen.getByRole('button', { name: 'Process Maintenance' })).toBeEnabled();
    expect(screen.getByRole('heading', { name: 'Order Entry' })).toBeInTheDocument();
  });

  it('switches between master-data modules', async () => {
    const user = userEvent.setup();
    render(<AppShell currentUser={users[0]} />);

    await user.click(screen.getByRole('button', { name: 'Customer Maintenance' }));
    expect(screen.getByRole('heading', { name: 'Customer Maintenance' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Part Maintenance' }));
    expect(screen.getByRole('heading', { name: 'Part Maintenance' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Process Maintenance' }));
    expect(screen.getByRole('heading', { name: 'Process Maintenance' })).toBeInTheDocument();
  });

  it('keeps a single app-level main landmark when switching modules', async () => {
    const user = userEvent.setup();
    render(<AppShell currentUser={users[0]} />);

    await user.click(screen.getByRole('button', { name: 'Customer Maintenance' }));

    expect(screen.getAllByRole('main')).toHaveLength(1);
  });

  it('rehydrates Part Maintenance draft state from shared app parts after remounting', async () => {
    const user = userEvent.setup();
    render(<AppShell currentUser={users[0]} />);

    await user.click(screen.getByRole('button', { name: 'Part Maintenance' }));
    await user.clear(screen.getByLabelText('Part name'));
    await user.type(screen.getByLabelText('Part name'), 'Shared Tow Update');
    await user.click(screen.getByRole('button', { name: 'Save Part' }));

    expect(screen.getByText('Part saved.')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Customer Maintenance' }));
    await user.click(screen.getByRole('button', { name: 'Part Maintenance' }));

    expect(screen.getByLabelText('Part name')).toHaveDisplayValue('Shared Tow Update');
    expect(screen.getByRole('button', { name: '15-29900-010 Shared Tow Update' })).toBeInTheDocument();
  });

  it('defaults to the first enabled module when Order Entry is not enabled', () => {
    const partOnlyUser: User = {
      id: 'part-only',
      name: 'Part Clerk',
      permissions: ['Part Maintenance'],
    };

    render(<AppShell currentUser={partOnlyUser} />);

    expect(screen.getByRole('button', { name: 'Order Entry' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Process Maintenance' })).toBeDisabled();
    expect(screen.getByRole('heading', { name: 'Part Maintenance' })).toBeInTheDocument();
  });

  it('defaults to Process Maintenance for a process-only user', () => {
    const processOnlyUser: User = {
      id: 'process-only',
      name: 'Process Engineer',
      permissions: ['Process Maintenance'],
    };

    render(<AppShell currentUser={processOnlyUser} />);

    expect(screen.getByRole('button', { name: 'Order Entry' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Process Maintenance' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Process Maintenance' })).toBeInTheDocument();
  });
});
