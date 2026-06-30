import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { User } from '../domain/types';
import { ModuleGate } from './ModuleGate';

const customerUser: User = {
  id: 'user-customer',
  name: 'Customer Clerk',
  permissions: ['Customer Maintenance'],
};

const partBlockedUser: User = {
  id: 'user-blocked',
  name: 'Part Clerk',
  permissions: ['Customer Maintenance'],
};

describe('ModuleGate', () => {
  it('renders children when Customer Maintenance permission is enabled', () => {
    render(
      <ModuleGate user={customerUser} permission="Customer Maintenance" moduleName="Customer Maintenance">
        <p>Customer maintenance workspace</p>
      </ModuleGate>,
    );

    expect(screen.getByText('Customer maintenance workspace')).toBeInTheDocument();
  });

  it('shows Part Maintenance permission required and hides children when missing', () => {
    render(
      <ModuleGate user={partBlockedUser} permission="Part Maintenance" moduleName="Part Maintenance">
        <p>Part maintenance workspace</p>
      </ModuleGate>,
    );

    expect(screen.getByText('Part Maintenance permission required')).toBeInTheDocument();
    expect(screen.queryByText('Part maintenance workspace')).not.toBeInTheDocument();
  });
});
