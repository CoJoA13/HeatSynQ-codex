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

  it('carries Process Maintenance assignments into Part Maintenance through shared app state', async () => {
    const user = userEvent.setup();
    render(<AppShell currentUser={users[0]} />);

    await user.click(screen.getByRole('button', { name: 'Process Maintenance' }));
    await user.click(screen.getByRole('button', { name: /15-29900-003 Ductile Iron Austemper Route/i }));
    await user.click(screen.getByLabelText('Assign 15-29900-DRAFT Draft Tow Variation'));
    await user.click(screen.getByRole('button', { name: 'Assign To Parts' }));

    expect(screen.getByText('Assigned process revision to 1 part.')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Part Maintenance' }));
    await user.type(screen.getByLabelText('Search parts'), '15-29900-DRAFT');
    await user.click(screen.getByRole('button', { name: /15-29900-DRAFT Draft Tow Variation/i }));

    expect(screen.getByText('Rev 16 Active')).toBeInTheDocument();
    expect(screen.getByText('4 process steps')).toBeInTheDocument();
    expect(screen.getByText('1 required inspection')).toBeInTheDocument();
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
