# Master Data Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the seeded browser prototype for the `Customer Maintenance` and `Part Maintenance` master-data modules, with separate permissions and an Order Entry integration contract.

**Architecture:** Extend the existing React/Vite prototype with shared master-data domain types, pure validation/filtering functions, seeded customer-part data, a reusable module gate, and a compact module shell. Keep Customer Maintenance and Part Maintenance separate modules under `src/modules`, with in-browser state only and no backend persistence.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, jsdom, lucide-react.

---

## Scope Check

The approved spec covers one bounded prototype slice: shallow but linked `Customer Maintenance` and `Part Maintenance` modules. This plan does not add backend persistence, authentication, multi-user conflict handling, Process Foundation editing, deep pricing, pictures/PDF upload, invoice control, A/R, Customer Expediting, or document archive storage.

## File Structure

- Modify: `src/domain/types.ts` - extend permissions and add master-data types.
- Create: `src/domain/masterData.ts` - pure customer/part validation, readiness, and lookup helpers.
- Create: `src/domain/masterData.test.ts` - tests for the pure master-data rules.
- Modify: `src/domain/permissions.test.ts` - cover the new module permissions.
- Modify: `src/data/seed.ts` - seed users, richer customers, customer-specific parts, and reference data.
- Create: `src/components/ModuleGate.tsx` - reusable permission gate.
- Create: `src/components/ModuleGate.test.tsx` - reusable gate tests.
- Modify: `src/modules/order-entry/components/ModuleGate.tsx` - keep the existing Order Entry wrapper while delegating to the shared gate.
- Create: `src/modules/customer-maintenance/CustomerMaintenanceModule.tsx` - Customer Maintenance module UI and state.
- Create: `src/modules/customer-maintenance/CustomerMaintenanceModule.test.tsx` - Customer Maintenance interaction tests.
- Create: `src/modules/part-maintenance/PartMaintenanceModule.tsx` - Part Maintenance module UI and state.
- Create: `src/modules/part-maintenance/PartMaintenanceModule.test.tsx` - Part Maintenance interaction tests.
- Create: `src/components/AppShell.tsx` - module navigation and active-module composition.
- Create: `src/components/AppShell.test.tsx` - module shell tests.
- Modify: `src/App.tsx` - render `AppShell`.
- Modify: `src/styles.css` - add dense ERP module shell and master-data styles.

## Task 1: Extend Master-Data Domain Types And Rules

**Files:**
- Modify: `src/domain/types.ts`
- Create: `src/domain/masterData.ts`
- Create: `src/domain/masterData.test.ts`
- Modify: `src/domain/permissions.test.ts`
- Modify: `src/data/seed.ts`

- [ ] **Step 1: Write the failing domain tests**

Create `src/domain/masterData.test.ts` with:

```ts
import { describe, expect, it } from 'vitest';
import {
  filterPartsForCustomer,
  getPartOrderEntryStatus,
  validateCustomer,
  validateCustomerPart,
} from './masterData';
import type { Customer, CustomerPart, ProcessMaster } from './types';

function customer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 'cust-gfmco',
    name: 'GFMCO - Columbus LLC',
    alphaKey: 'GFMCO',
    customerType: 'Customer',
    plant: '1',
    phone: '800-328-8379',
    terms: 'Net 30',
    attention: 'Receiving',
    region: 'Midwest',
    rank: 'A',
    active: true,
    reviewRequired: false,
    cod: false,
    creditHold: false,
    receivedFrom: 'GFMCO - Columbus LLC',
    shipTo: 'Max Coating',
    orderRules: {
      defaultReceivedFrom: 'GFMCO - Columbus LLC',
      defaultShipTo: 'Max Coating',
      requestDays: 5,
      targetDays: 7,
      poRequired: true,
      validateProcessCode: true,
      validateMaterial: true,
      defaultRoute: 'GFMCO Truck',
      defaultCarrier: 'GFMCO Truck',
      defaultCertFormat: 'Generic - AM',
      certEveryOrder: false,
      notes: 'PO required before release.',
    },
    addresses: [],
    contacts: [],
    requirements: [],
    documents: [],
    ...overrides,
  };
}

function part(overrides: Partial<CustomerPart> = {}): CustomerPart {
  return {
    id: 'part-1',
    partId: '15-29900-010',
    customerId: 'cust-gfmco',
    processMasterId: '15-29900-003',
    partName: 'CNTR TOW',
    description: 'Machined ductile iron tow component',
    outgoingPartNumber: '',
    blanketPo: '49499',
    revision: '16',
    material: 'Ductile Iron',
    specification: 'Eq: 180; Gr: IQ',
    customerSpecification: '',
    certFormat: 'Generic - AM',
    certRequired: false,
    eachWeight: 127,
    thickness: 0.25,
    inactive: false,
    partHold: false,
    shippingHold: false,
    price: {
      setup: 0,
      amount: 1.35,
      pricePer: 'Lb',
      minimum: 125,
    },
    quote: {
      quoteId: 'Q-1042',
      quotedQuantity: 500,
      effectiveDate: '2026-06-01',
      expirationDate: '2026-12-31',
      contact: 'Ron Grover',
      salesPerson: 'Inside Sales',
    },
    notes: 'Use standard austemper route.',
    ...overrides,
  };
}

const processMasters: ProcessMaster[] = [
  {
    id: '15-29900-003',
    revision: 16,
    processCode: 'Austemper',
    material: 'Ductile Iron',
    certificationId: '',
    spec: 'Eq: 180; Gr: IQ',
    comments: 'Standard austemper process.',
    steps: [],
  },
];

describe('validateCustomer', () => {
  it('requires customer ID and name', () => {
    const result = validateCustomer(customer({ id: ' ', name: '' }), []);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(['Customer ID is required.', 'Customer name is required.']);
  });

  it('blocks duplicate customer IDs and warns about missing order defaults', () => {
    const result = validateCustomer(
      customer({
        id: 'CUST-GFMCO',
        receivedFrom: '',
        shipTo: '',
        orderRules: {
          ...customer().orderRules,
          defaultReceivedFrom: '',
          defaultShipTo: '',
        },
      }),
      [customer({ id: 'cust-gfmco' })],
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Customer ID must be unique.');
    expect(result.warnings).toEqual(['Missing order defaults: received-from and ship-to.']);
  });
});

describe('validateCustomerPart', () => {
  it('requires part ID and customer before saving', () => {
    const result = validateCustomerPart(part({ partId: '', customerId: '' }), [], processMasters);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(['Part ID is required.', 'Customer is required.']);
  });

  it('allows draft parts without process masters but marks them with a warning', () => {
    const result = validateCustomerPart(part({ processMasterId: '' }), [], processMasters);

    expect(result.valid).toBe(true);
    expect(result.warnings).toContain('Draft part is missing process master.');
  });

  it('blocks duplicate customer plus part ID and invalid process references', () => {
    const result = validateCustomerPart(
      part({ id: 'part-2', processMasterId: 'missing-process' }),
      [part()],
      processMasters,
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      'Part ID must be unique for this customer.',
      'Process master reference is invalid.',
    ]);
  });
});

describe('getPartOrderEntryStatus', () => {
  it('reports a ready part when core fields and process reference are valid', () => {
    expect(getPartOrderEntryStatus(part(), processMasters)).toEqual({
      ready: true,
      blockers: [],
      warnings: [],
    });
  });

  it('reports blockers and warnings that affect Order Entry and shipping', () => {
    const result = getPartOrderEntryStatus(
      part({
        inactive: true,
        partHold: true,
        shippingHold: true,
        processMasterId: '',
        material: '',
        certFormat: '',
        eachWeight: 0,
      }),
      processMasters,
    );

    expect(result.ready).toBe(false);
    expect(result.blockers).toEqual([
      'Inactive parts do not appear in normal Order Entry search.',
      'Part hold blocks Order Entry release.',
      'Missing process master.',
    ]);
    expect(result.warnings).toEqual([
      'Shipping hold will block shipping readiness.',
      'Material is missing.',
      'Cert format is missing.',
      'Each weight is missing.',
    ]);
  });
});

describe('filterPartsForCustomer', () => {
  it('returns active parts for one customer by default', () => {
    const result = filterPartsForCustomer(
      [
        part(),
        part({ id: 'part-2', partId: 'inactive', inactive: true }),
        part({ id: 'part-3', partId: 'other', customerId: 'cust-other' }),
      ],
      'cust-gfmco',
    );

    expect(result.map((entry) => entry.partId)).toEqual(['15-29900-010']);
  });

  it('can include inactive parts for maintenance screens', () => {
    const result = filterPartsForCustomer(
      [part(), part({ id: 'part-2', partId: 'inactive', inactive: true })],
      'cust-gfmco',
      { includeInactive: true },
    );

    expect(result.map((entry) => entry.partId)).toEqual(['15-29900-010', 'inactive']);
  });
});
```

- [ ] **Step 2: Extend permission tests**

Add this test to `src/domain/permissions.test.ts`:

```ts
  it('allows independently assigned master-data module permissions', () => {
    const user: User = {
      id: 'user-master-data',
      name: 'Master Data',
      permissions: ['Customer Maintenance', 'Part Maintenance'],
    };

    expect(hasModulePermission(user, 'Customer Maintenance')).toBe(true);
    expect(hasModulePermission(user, 'Part Maintenance')).toBe(true);
    expect(hasModulePermission(user, 'Order Entry')).toBe(false);
  });
```

- [ ] **Step 3: Run the new domain tests and verify they fail**

Run:

```bash
npm test src/domain/masterData.test.ts src/domain/permissions.test.ts
```

Expected: FAIL because `src/domain/masterData.ts` does not exist and the permission type only allows `Order Entry`.

- [ ] **Step 4: Extend shared domain types**

Modify `src/domain/types.ts` so `ModulePermission` becomes:

```ts
export type ModulePermission = 'Order Entry' | 'Customer Maintenance' | 'Part Maintenance';
```

Add these interfaces below the existing `Customer` shape, then update `Customer` to include the new fields while preserving `phone`, `receivedFrom`, and `shipTo` for Order Entry:

```ts
export interface CustomerOrderRules {
  defaultReceivedFrom: string;
  defaultShipTo: string;
  requestDays: number;
  targetDays: number;
  poRequired: boolean;
  validateProcessCode: boolean;
  validateMaterial: boolean;
  defaultRoute: string;
  defaultCarrier: string;
  defaultCertFormat: string;
  certEveryOrder: boolean;
  notes: string;
}

export interface CustomerAddress {
  id: string;
  type: 'Ship To' | 'Bill To' | 'Received From' | 'Other';
  name: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  email: string;
}

export interface CustomerContact {
  id: string;
  name: string;
  title: string;
  phone: string;
  email: string;
  receivesQuotes: boolean;
  receivesCerts: boolean;
  receivesInvoices: boolean;
}

export interface CustomerRequirement {
  id: string;
  category: 'Order' | 'Shipping' | 'Process' | 'Inspection' | 'Quote' | 'Certification';
  text: string;
}

export interface Customer {
  id: string;
  name: string;
  alphaKey: string;
  customerType: string;
  plant: string;
  phone: string;
  terms: string;
  attention: string;
  region: string;
  rank: string;
  active: boolean;
  reviewRequired: boolean;
  cod: boolean;
  creditHold: boolean;
  receivedFrom: string;
  shipTo: string;
  orderRules: CustomerOrderRules;
  addresses: CustomerAddress[];
  contacts: CustomerContact[];
  requirements: CustomerRequirement[];
  documents: DocumentReference[];
}

export interface PartPriceSummary {
  setup: number;
  amount: number;
  pricePer: string;
  minimum: number;
}

export interface PartQuoteSummary {
  quoteId: string;
  quotedQuantity: number;
  effectiveDate: string;
  expirationDate: string;
  contact: string;
  salesPerson: string;
}

export interface CustomerPart {
  id: string;
  partId: string;
  customerId: string;
  processMasterId: string;
  partName: string;
  description: string;
  outgoingPartNumber: string;
  blanketPo: string;
  revision: string;
  material: string;
  specification: string;
  customerSpecification: string;
  certFormat: string;
  certRequired: boolean;
  eachWeight: number;
  thickness: number;
  inactive: boolean;
  partHold: boolean;
  shippingHold: boolean;
  price: PartPriceSummary;
  quote: PartQuoteSummary;
  notes: string;
}
```

- [ ] **Step 5: Add the master-data domain helpers**

Create `src/domain/masterData.ts` with:

```ts
import type { Customer, CustomerPart, ProcessMaster } from './types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PartOrderEntryStatus {
  ready: boolean;
  blockers: string[];
  warnings: string[];
}

interface PartFilterOptions {
  includeInactive?: boolean;
}

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

function sameText(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

export function validateCustomer(customer: Customer, otherCustomers: Customer[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!hasText(customer.id)) errors.push('Customer ID is required.');
  if (!hasText(customer.name)) errors.push('Customer name is required.');

  if (hasText(customer.id) && otherCustomers.some((entry) => sameText(entry.id, customer.id))) {
    errors.push('Customer ID must be unique.');
  }

  const missingDefaults = !hasText(customer.orderRules.defaultReceivedFrom) || !hasText(customer.orderRules.defaultShipTo);
  if (missingDefaults) {
    warnings.push('Missing order defaults: received-from and ship-to.');
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function getPartOrderEntryStatus(part: CustomerPart, processMasters: ProcessMaster[]): PartOrderEntryStatus {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (part.inactive) blockers.push('Inactive parts do not appear in normal Order Entry search.');
  if (part.partHold) blockers.push('Part hold blocks Order Entry release.');
  if (!hasText(part.processMasterId)) {
    blockers.push('Missing process master.');
  } else if (!processMasters.some((entry) => entry.id === part.processMasterId)) {
    blockers.push('Process master reference is invalid.');
  }

  if (part.shippingHold) warnings.push('Shipping hold will block shipping readiness.');
  if (!hasText(part.material)) warnings.push('Material is missing.');
  if (!hasText(part.certFormat)) warnings.push('Cert format is missing.');
  if (part.eachWeight <= 0) warnings.push('Each weight is missing.');

  return { ready: blockers.length === 0, blockers, warnings };
}

export function validateCustomerPart(
  part: CustomerPart,
  existingParts: CustomerPart[],
  processMasters: ProcessMaster[],
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!hasText(part.partId)) errors.push('Part ID is required.');
  if (!hasText(part.customerId)) errors.push('Customer is required.');

  const duplicate = existingParts.some(
    (entry) => entry.id !== part.id && entry.customerId === part.customerId && sameText(entry.partId, part.partId),
  );
  if (duplicate) errors.push('Part ID must be unique for this customer.');

  if (!hasText(part.processMasterId)) {
    warnings.push('Draft part is missing process master.');
  } else if (!processMasters.some((entry) => entry.id === part.processMasterId)) {
    errors.push('Process master reference is invalid.');
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function filterPartsForCustomer(
  parts: CustomerPart[],
  customerId: string,
  options: PartFilterOptions = {},
): CustomerPart[] {
  return parts.filter((part) => {
    if (part.customerId !== customerId) return false;
    if (!options.includeInactive && part.inactive) return false;
    return true;
  });
}
```

- [ ] **Step 6: Update seed data**

Modify `src/data/seed.ts` so:

- `users[0]` has `['Order Entry', 'Customer Maintenance', 'Part Maintenance']`.
- `users[1]` remains a viewer with no permissions.
- Existing customers include all required `Customer` fields.
- A new export `customerParts` provides at least three seeded customer-specific parts.

Use this shape for the new export:

```ts
export const customerParts: CustomerPart[] = [
  {
    id: 'part-gfmco-tow',
    partId: '15-29900-010',
    customerId: 'cust-gfmco',
    processMasterId: '15-29900-003',
    partName: 'CNTR TOW',
    description: 'Machined ductile iron tow component',
    outgoingPartNumber: '',
    blanketPo: '49499',
    revision: '16',
    material: 'Ductile Iron',
    specification: 'Eq: 180; Gr: IQ',
    customerSpecification: '',
    certFormat: 'Generic - AM',
    certRequired: false,
    eachWeight: 127,
    thickness: 0.25,
    inactive: false,
    partHold: false,
    shippingHold: false,
    price: { setup: 0, amount: 1.35, pricePer: 'Lb', minimum: 125 },
    quote: {
      quoteId: 'Q-1042',
      quotedQuantity: 500,
      effectiveDate: '2026-06-01',
      expirationDate: '2026-12-31',
      contact: 'Ron Grover',
      salesPerson: 'Inside Sales',
    },
    notes: 'Use standard austemper route.',
  },
  {
    id: 'part-amz-guard',
    partId: '12496783-HT',
    customerId: 'cust-amz',
    processMasterId: '12-496783-HT',
    partName: 'Guard, Right Track',
    description: '8620 steel guard requiring carburize route',
    outgoingPartNumber: '',
    blanketPo: '',
    revision: '4',
    material: '8620 Steel',
    specification: 'Case depth 0.030-0.040',
    customerSpecification: '',
    certFormat: 'CERT-8620',
    certRequired: true,
    eachWeight: 22.5,
    thickness: 0.5,
    inactive: false,
    partHold: false,
    shippingHold: true,
    price: { setup: 45, amount: 2.1, pricePer: 'Lb', minimum: 175 },
    quote: {
      quoteId: 'Q-2081',
      quotedQuantity: 250,
      effectiveDate: '2026-05-15',
      expirationDate: '2026-11-15',
      contact: 'Dana Riley',
      salesPerson: 'Inside Sales',
    },
    notes: 'Shipping hold until customer confirms packaging.',
  },
  {
    id: 'part-gfmco-draft',
    partId: '15-29900-DRAFT',
    customerId: 'cust-gfmco',
    processMasterId: '',
    partName: 'Draft Tow Variation',
    description: 'Draft record waiting for process master assignment',
    outgoingPartNumber: '',
    blanketPo: '',
    revision: '',
    material: '',
    specification: '',
    customerSpecification: '',
    certFormat: '',
    certRequired: false,
    eachWeight: 0,
    thickness: 0,
    inactive: false,
    partHold: false,
    shippingHold: false,
    price: { setup: 0, amount: 0, pricePer: 'Lb', minimum: 0 },
    quote: {
      quoteId: '',
      quotedQuantity: 0,
      effectiveDate: '',
      expirationDate: '',
      contact: '',
      salesPerson: '',
    },
    notes: 'Draft part for master-data validation.',
  },
];
```

- [ ] **Step 7: Run domain tests and verify they pass**

Run:

```bash
npm test src/domain/masterData.test.ts src/domain/permissions.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit domain foundation**

Run:

```bash
git add src/domain src/data/seed.ts
git commit -m "feat: add master data domain model"
```

## Task 2: Add A Reusable Module Gate

**Files:**
- Create: `src/components/ModuleGate.tsx`
- Create: `src/components/ModuleGate.test.tsx`
- Modify: `src/modules/order-entry/components/ModuleGate.tsx`

- [ ] **Step 1: Write the failing shared gate tests**

Create `src/components/ModuleGate.test.tsx` with:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { User } from '../domain/types';
import { ModuleGate } from './ModuleGate';

describe('ModuleGate', () => {
  const user: User = {
    id: 'user-1',
    name: 'Colton',
    permissions: ['Customer Maintenance'],
  };

  it('renders children when the named permission is enabled', () => {
    render(
      <ModuleGate user={user} permission="Customer Maintenance" moduleName="Customer Maintenance">
        <p>Allowed module content</p>
      </ModuleGate>,
    );

    expect(screen.getByText('Allowed module content')).toBeInTheDocument();
  });

  it('shows a module-specific blocked state when permission is missing', () => {
    render(
      <ModuleGate user={user} permission="Part Maintenance" moduleName="Part Maintenance">
        <p>Hidden module content</p>
      </ModuleGate>,
    );

    expect(screen.getByRole('heading', { name: 'Part Maintenance permission required' })).toBeInTheDocument();
    expect(screen.queryByText('Hidden module content')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the shared gate test and verify it fails**

Run:

```bash
npm test src/components/ModuleGate.test.tsx
```

Expected: FAIL because `src/components/ModuleGate.tsx` does not exist.

- [ ] **Step 3: Add the reusable gate**

Create `src/components/ModuleGate.tsx` with:

```tsx
import type { PropsWithChildren } from 'react';
import { hasModulePermission } from '../domain/permissions';
import type { ModulePermission, User } from '../domain/types';

interface ModuleGateProps extends PropsWithChildren {
  user: User;
  permission: ModulePermission;
  moduleName: string;
}

export function ModuleGate({ user, permission, moduleName, children }: ModuleGateProps) {
  if (!hasModulePermission(user, permission)) {
    return (
      <section className="module-blocked">
        <h1>{moduleName} permission required</h1>
        <p>This module is not enabled for {user.name}.</p>
      </section>
    );
  }

  return <>{children}</>;
}
```

- [ ] **Step 4: Rewire the existing Order Entry wrapper**

Replace `src/modules/order-entry/components/ModuleGate.tsx` with:

```tsx
import type { PropsWithChildren } from 'react';
import { ModuleGate as SharedModuleGate } from '../../../components/ModuleGate';
import type { User } from '../../../domain/types';

interface ModuleGateProps extends PropsWithChildren {
  user: User;
}

export function ModuleGate({ user, children }: ModuleGateProps) {
  return (
    <SharedModuleGate user={user} permission="Order Entry" moduleName="Order Entry">
      {children}
    </SharedModuleGate>
  );
}
```

- [ ] **Step 5: Run gate and Order Entry module tests**

Run:

```bash
npm test src/components/ModuleGate.test.tsx src/modules/order-entry/OrderEntryModule.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit reusable gate**

Run:

```bash
git add src/components/ModuleGate.tsx src/components/ModuleGate.test.tsx src/modules/order-entry/components/ModuleGate.tsx
git commit -m "feat: add reusable module gate"
```

## Task 3: Build Customer Maintenance

**Files:**
- Create: `src/modules/customer-maintenance/CustomerMaintenanceModule.tsx`
- Create: `src/modules/customer-maintenance/CustomerMaintenanceModule.test.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write the failing Customer Maintenance tests**

Create `src/modules/customer-maintenance/CustomerMaintenanceModule.test.tsx` with:

```tsx
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { users } from '../../data/seed';
import { CustomerMaintenanceModule } from './CustomerMaintenanceModule';

describe('CustomerMaintenanceModule', () => {
  it('blocks users without the Customer Maintenance permission', () => {
    render(<CustomerMaintenanceModule currentUser={users[1]} />);

    expect(screen.getByRole('heading', { name: 'Customer Maintenance permission required' })).toBeInTheDocument();
  });

  it('filters customers and shows linked parts for the selected customer', async () => {
    const user = userEvent.setup();
    render(<CustomerMaintenanceModule currentUser={users[0]} />);

    await user.clear(screen.getByLabelText('Search customers'));
    await user.type(screen.getByLabelText('Search customers'), 'AMZ');
    await user.click(screen.getByRole('button', { name: /AMZ Manufacturing Corporation/i }));

    expect(screen.getByRole('heading', { name: 'Customer Maintenance' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('AMZ Manufacturing Corporation')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Linked Parts' })).toBeInTheDocument();
    expect(screen.getByText('12496783-HT')).toBeInTheDocument();
  });

  it('validates required fields before saving customer changes', async () => {
    const user = userEvent.setup();
    render(<CustomerMaintenanceModule currentUser={users[0]} />);

    await user.clear(screen.getByLabelText('Customer name'));
    await user.click(screen.getByRole('button', { name: 'Save Customer' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Customer name is required.');
  });

  it('saves customer order-rule changes in local state', async () => {
    const user = userEvent.setup();
    render(<CustomerMaintenanceModule currentUser={users[0]} />);

    await user.clear(screen.getByLabelText('Request days'));
    await user.type(screen.getByLabelText('Request days'), '9');
    await user.click(screen.getByRole('button', { name: 'Save Customer' }));

    expect(screen.getByText('Customer saved.')).toBeVisible();

    const orderRules = screen.getByRole('region', { name: 'Order Rules' });
    expect(within(orderRules).getByLabelText('Request days')).toHaveValue(9);
  });
});
```

- [ ] **Step 2: Run the Customer Maintenance test and verify it fails**

Run:

```bash
npm test src/modules/customer-maintenance/CustomerMaintenanceModule.test.tsx
```

Expected: FAIL because `CustomerMaintenanceModule` does not exist.

- [ ] **Step 3: Create the Customer Maintenance module**

Create `src/modules/customer-maintenance/CustomerMaintenanceModule.tsx` with:

```tsx
import { useMemo, useState } from 'react';
import { customerParts, customers as seedCustomers } from '../../data/seed';
import { filterPartsForCustomer, validateCustomer } from '../../domain/masterData';
import type { Customer, User } from '../../domain/types';
import { ModuleGate } from '../../components/ModuleGate';

interface CustomerMaintenanceModuleProps {
  currentUser: User;
}

function cloneCustomer(customer: Customer): Customer {
  return {
    ...customer,
    orderRules: { ...customer.orderRules },
    addresses: customer.addresses.map((address) => ({ ...address })),
    contacts: customer.contacts.map((contact) => ({ ...contact })),
    requirements: customer.requirements.map((requirement) => ({ ...requirement })),
    documents: customer.documents.map((document) => ({ ...document })),
  };
}

function createCustomer(): Customer {
  return {
    id: '',
    name: '',
    alphaKey: '',
    customerType: 'Customer',
    plant: '1',
    phone: '',
    terms: '',
    attention: '',
    region: '',
    rank: '',
    active: true,
    reviewRequired: false,
    cod: false,
    creditHold: false,
    receivedFrom: '',
    shipTo: '',
    orderRules: {
      defaultReceivedFrom: '',
      defaultShipTo: '',
      requestDays: 0,
      targetDays: 0,
      poRequired: false,
      validateProcessCode: false,
      validateMaterial: false,
      defaultRoute: '',
      defaultCarrier: '',
      defaultCertFormat: '',
      certEveryOrder: false,
      notes: '',
    },
    addresses: [],
    contacts: [],
    requirements: [],
    documents: [],
  };
}

function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function CustomerMaintenanceModule({ currentUser }: CustomerMaintenanceModuleProps) {
  const [records, setRecords] = useState<Customer[]>(() => seedCustomers.map(cloneCustomer));
  const [selectedId, setSelectedId] = useState(seedCustomers.length > 0 ? seedCustomers[0].id : '');
  const [draft, setDraft] = useState<Customer>(() =>
    seedCustomers.length > 0 ? cloneCustomer(seedCustomers[0]) : createCustomer(),
  );
  const [search, setSearch] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [savedMessage, setSavedMessage] = useState('');

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return records;
    return records.filter((customer) => `${customer.id} ${customer.name}`.toLowerCase().includes(query));
  }, [records, search]);

  const linkedParts = filterPartsForCustomer(customerParts, draft.id, { includeInactive: true });

  function selectCustomer(customer: Customer) {
    setSelectedId(customer.id);
    setDraft(cloneCustomer(customer));
    setMessages([]);
    setSavedMessage('');
  }

  function update<K extends keyof Customer>(key: K, value: Customer[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateRule<K extends keyof Customer['orderRules']>(key: K, value: Customer['orderRules'][K]) {
    setDraft((current) => ({
      ...current,
      orderRules: { ...current.orderRules, [key]: value },
    }));
  }

  function saveCustomer() {
    const otherCustomers = records.filter((customer) => customer.id !== selectedId);
    const result = validateCustomer(draft, otherCustomers);
    setMessages([...result.errors, ...result.warnings]);
    setSavedMessage('');
    if (!result.valid) return;

    setRecords((current) => {
      const exists = current.some((customer) => customer.id === selectedId);
      if (!exists) return [...current, cloneCustomer(draft)];
      return current.map((customer) => (customer.id === selectedId ? cloneCustomer(draft) : customer));
    });
    setSelectedId(draft.id);
    setSavedMessage('Customer saved.');
  }

  return (
    <ModuleGate user={currentUser} permission="Customer Maintenance" moduleName="Customer Maintenance">
      <section className="master-data-module" aria-labelledby="customer-maintenance-title">
        <header className="master-data-header">
          <div>
            <p className="module-label">Master data</p>
            <h1 id="customer-maintenance-title">Customer Maintenance</h1>
          </div>
          <div className="toolbar-group">
            <button type="button" className="toolbar-button" onClick={() => selectCustomer(createCustomer())}>
              New Customer
            </button>
            <button type="button" className="toolbar-button toolbar-button-primary" onClick={saveCustomer}>
              Save Customer
            </button>
          </div>
        </header>

        <div className="master-data-workspace">
          <aside className="master-list-panel" aria-label="Customer list">
            <label className="search-field">
              <span>Search customers</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
            <div className="master-list">
              {filteredCustomers.map((customer) => (
                <button
                  type="button"
                  key={customer.id}
                  className={customer.id === selectedId ? 'master-list-row master-list-row-selected' : 'master-list-row'}
                  onClick={() => selectCustomer(customer)}
                >
                  <strong>{customer.name}</strong>
                  <span>{customer.id}</span>
                </button>
              ))}
            </div>
          </aside>

          <div className="master-detail-panel">
            {messages.length > 0 ? (
              <div className="validation-summary" role="alert">
                {messages.join(' ')}
              </div>
            ) : null}
            {savedMessage ? <div className="save-summary">{savedMessage}</div> : null}

            <section className="master-section" aria-label="Customer Overview">
              <h2>Overview</h2>
              <div className="form-grid">
                <label>
                  <span>Customer ID</span>
                  <input value={draft.id} onChange={(event) => update('id', event.target.value)} />
                </label>
                <label>
                  <span>Customer name</span>
                  <input value={draft.name} onChange={(event) => update('name', event.target.value)} />
                </label>
                <label>
                  <span>Customer type</span>
                  <input value={draft.customerType} onChange={(event) => update('customerType', event.target.value)} />
                </label>
                <label>
                  <span>Plant</span>
                  <input value={draft.plant} onChange={(event) => update('plant', event.target.value)} />
                </label>
                <label>
                  <span>Phone</span>
                  <input value={draft.phone} onChange={(event) => update('phone', event.target.value)} />
                </label>
                <label>
                  <span>Terms</span>
                  <input value={draft.terms} onChange={(event) => update('terms', event.target.value)} />
                </label>
              </div>
              <div className="status-strip">
                <label><input type="checkbox" checked={draft.active} onChange={(event) => update('active', event.target.checked)} /> Active customer</label>
                <label><input type="checkbox" checked={draft.reviewRequired} onChange={(event) => update('reviewRequired', event.target.checked)} /> Review required</label>
                <label><input type="checkbox" checked={draft.cod} onChange={(event) => update('cod', event.target.checked)} /> COD customer</label>
                <label><input type="checkbox" checked={draft.creditHold} onChange={(event) => update('creditHold', event.target.checked)} /> Credit hold</label>
              </div>
            </section>

            <section className="master-section" aria-label="Order Rules">
              <h2>Order Rules</h2>
              <div className="form-grid">
                <label>
                  <span>Default received from</span>
                  <input value={draft.orderRules.defaultReceivedFrom} onChange={(event) => updateRule('defaultReceivedFrom', event.target.value)} />
                </label>
                <label>
                  <span>Default ship to</span>
                  <input value={draft.orderRules.defaultShipTo} onChange={(event) => updateRule('defaultShipTo', event.target.value)} />
                </label>
                <label>
                  <span>Request days</span>
                  <input type="number" value={draft.orderRules.requestDays} onChange={(event) => updateRule('requestDays', toNumber(event.target.value))} />
                </label>
                <label>
                  <span>Target days</span>
                  <input type="number" value={draft.orderRules.targetDays} onChange={(event) => updateRule('targetDays', toNumber(event.target.value))} />
                </label>
                <label>
                  <span>Default carrier</span>
                  <input value={draft.orderRules.defaultCarrier} onChange={(event) => updateRule('defaultCarrier', event.target.value)} />
                </label>
                <label>
                  <span>Default cert format</span>
                  <input value={draft.orderRules.defaultCertFormat} onChange={(event) => updateRule('defaultCertFormat', event.target.value)} />
                </label>
              </div>
              <div className="status-strip">
                <label><input type="checkbox" checked={draft.orderRules.poRequired} onChange={(event) => updateRule('poRequired', event.target.checked)} /> PO required</label>
                <label><input type="checkbox" checked={draft.orderRules.validateProcessCode} onChange={(event) => updateRule('validateProcessCode', event.target.checked)} /> Validate process code</label>
                <label><input type="checkbox" checked={draft.orderRules.validateMaterial} onChange={(event) => updateRule('validateMaterial', event.target.checked)} /> Validate material</label>
                <label><input type="checkbox" checked={draft.orderRules.certEveryOrder} onChange={(event) => updateRule('certEveryOrder', event.target.checked)} /> Cert every order</label>
              </div>
            </section>

            <section className="master-section">
              <h2>Addresses And Contacts</h2>
              <dl className="definition-grid">
                <div><dt>Addresses</dt><dd>{draft.addresses.length}</dd></div>
                <div><dt>Contacts</dt><dd>{draft.contacts.length}</dd></div>
              </dl>
            </section>

            <section className="master-section">
              <h2>Requirements And Notes</h2>
              {draft.requirements.length === 0 ? (
                <p className="empty-copy">No customer requirements recorded.</p>
              ) : (
                <ul className="simple-list">
                  {draft.requirements.map((requirement) => (
                    <li key={requirement.id}><strong>{requirement.category}:</strong> {requirement.text}</li>
                  ))}
                </ul>
              )}
            </section>

            <section className="master-section">
              <h2>Linked Parts</h2>
              {linkedParts.length === 0 ? (
                <p className="empty-copy">No linked parts for this customer.</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr><th>Part ID</th><th>Name</th><th>Process</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {linkedParts.map((part) => (
                      <tr key={part.id}>
                        <td>{part.partId}</td>
                        <td>{part.partName}</td>
                        <td>{part.processMasterId || 'Draft'}</td>
                        <td>{part.inactive ? 'Inactive' : part.partHold ? 'Part hold' : part.shippingHold ? 'Shipping hold' : 'Active'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>
        </div>
      </section>
    </ModuleGate>
  );
}
```

- [ ] **Step 4: Add Customer Maintenance styles**

Append this CSS to `src/styles.css`:

```css
.master-data-module {
  min-height: 100vh;
  background: #f4f5f7;
}

.master-data-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 14px 24px;
  border-bottom: 1px solid #c7cdd6;
  background: #ffffff;
}

.master-data-header h1 {
  margin: 3px 0 0;
  font-size: 1.45rem;
}

.master-data-workspace {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 16px;
  padding: 18px 24px 24px;
}

.master-list-panel,
.master-detail-panel,
.master-section {
  border: 1px solid #c7cdd6;
  border-radius: 6px;
  background: #ffffff;
}

.master-list-panel {
  display: grid;
  align-content: start;
  gap: 12px;
  padding: 12px;
}

.search-field {
  display: grid;
  gap: 5px;
  color: #334155;
  font-size: 0.82rem;
  font-weight: 800;
}

.search-field input {
  height: 30px;
  border: 1px solid #9aa5b1;
  border-radius: 4px;
  padding: 3px 8px;
}

.master-list {
  display: grid;
  gap: 6px;
}

.master-list-row {
  display: grid;
  gap: 2px;
  width: 100%;
  min-height: 48px;
  padding: 8px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  background: #ffffff;
  color: #172033;
  cursor: pointer;
  text-align: left;
}

.master-list-row:hover,
.master-list-row-selected {
  border-color: #2563eb;
  background: #eff6ff;
}

.master-list-row span {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 700;
}

.master-detail-panel {
  display: grid;
  gap: 14px;
  padding: 14px;
}

.master-section {
  display: grid;
  gap: 12px;
  padding: 14px;
}

.master-section h2 {
  margin: 0;
  font-size: 1rem;
}

.status-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  padding-top: 4px;
  color: #334155;
  font-size: 0.85rem;
  font-weight: 800;
}

.status-strip label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.validation-summary,
.save-summary {
  padding: 9px 10px;
  border-radius: 4px;
  font-weight: 800;
}

.validation-summary {
  border: 1px solid #b91c1c;
  background: #fef2f2;
  color: #7f1d1d;
}

.save-summary {
  border: 1px solid #15803d;
  background: #f0fdf4;
  color: #14532d;
}

.simple-list {
  display: grid;
  gap: 6px;
  margin: 0;
  padding-left: 18px;
}
```

- [ ] **Step 5: Run Customer Maintenance tests**

Run:

```bash
npm test src/modules/customer-maintenance/CustomerMaintenanceModule.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit Customer Maintenance**

Run:

```bash
git add src/modules/customer-maintenance src/styles.css
git commit -m "feat: add customer maintenance module"
```

## Task 4: Build Part Maintenance

**Files:**
- Create: `src/modules/part-maintenance/PartMaintenanceModule.tsx`
- Create: `src/modules/part-maintenance/PartMaintenanceModule.test.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write the failing Part Maintenance tests**

Create `src/modules/part-maintenance/PartMaintenanceModule.test.tsx` with:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { users } from '../../data/seed';
import { PartMaintenanceModule } from './PartMaintenanceModule';

describe('PartMaintenanceModule', () => {
  it('blocks users without the Part Maintenance permission', () => {
    render(<PartMaintenanceModule currentUser={users[1]} />);

    expect(screen.getByRole('heading', { name: 'Part Maintenance permission required' })).toBeInTheDocument();
  });

  it('filters parts and shows Order Entry readiness for the selected part', async () => {
    const user = userEvent.setup();
    render(<PartMaintenanceModule currentUser={users[0]} />);

    await user.clear(screen.getByLabelText('Search parts'));
    await user.type(screen.getByLabelText('Search parts'), 'Guard');
    await user.click(screen.getByRole('button', { name: /12496783-HT/i }));

    expect(screen.getByDisplayValue('Guard, Right Track')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Order Entry Use' })).toBeInTheDocument();
    expect(screen.getByText('Ready for Order Entry')).toBeVisible();
    expect(screen.getByText('Shipping hold will block shipping readiness.')).toBeVisible();
  });

  it('saves a draft part without process master but marks it not ready', async () => {
    const user = userEvent.setup();
    render(<PartMaintenanceModule currentUser={users[0]} />);

    await user.click(screen.getByRole('button', { name: 'New Part' }));
    await user.type(screen.getByLabelText('Part ID'), 'NEW-DRAFT');
    await user.selectOptions(screen.getByLabelText('Customer'), 'cust-gfmco');
    await user.click(screen.getByRole('button', { name: 'Save Part' }));

    expect(screen.getByText('Part saved.')).toBeVisible();
    expect(screen.getByText('Missing process master.')).toBeVisible();
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
});
```

- [ ] **Step 2: Run the Part Maintenance test and verify it fails**

Run:

```bash
npm test src/modules/part-maintenance/PartMaintenanceModule.test.tsx
```

Expected: FAIL because `PartMaintenanceModule` does not exist.

- [ ] **Step 3: Create the Part Maintenance module**

Create `src/modules/part-maintenance/PartMaintenanceModule.tsx` with:

```tsx
import { useMemo, useState } from 'react';
import { customerParts as seedParts, customers, processMasters } from '../../data/seed';
import { getPartOrderEntryStatus, validateCustomerPart } from '../../domain/masterData';
import type { CustomerPart, User } from '../../domain/types';
import { ModuleGate } from '../../components/ModuleGate';

interface PartMaintenanceModuleProps {
  currentUser: User;
}

function clonePart(part: CustomerPart): CustomerPart {
  return {
    ...part,
    price: { ...part.price },
    quote: { ...part.quote },
  };
}

function createPart(): CustomerPart {
  return {
    id: crypto.randomUUID(),
    partId: '',
    customerId: '',
    processMasterId: '',
    partName: '',
    description: '',
    outgoingPartNumber: '',
    blanketPo: '',
    revision: '',
    material: '',
    specification: '',
    customerSpecification: '',
    certFormat: '',
    certRequired: false,
    eachWeight: 0,
    thickness: 0,
    inactive: false,
    partHold: false,
    shippingHold: false,
    price: { setup: 0, amount: 0, pricePer: 'Lb', minimum: 0 },
    quote: {
      quoteId: '',
      quotedQuantity: 0,
      effectiveDate: '',
      expirationDate: '',
      contact: '',
      salesPerson: '',
    },
    notes: '',
  };
}

function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function PartMaintenanceModule({ currentUser }: PartMaintenanceModuleProps) {
  const [records, setRecords] = useState<CustomerPart[]>(() => seedParts.map(clonePart));
  const [selectedId, setSelectedId] = useState(seedParts.length > 0 ? seedParts[0].id : '');
  const [draft, setDraft] = useState<CustomerPart>(() =>
    seedParts.length > 0 ? clonePart(seedParts[0]) : createPart(),
  );
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [savedMessage, setSavedMessage] = useState('');
  const status = getPartOrderEntryStatus(draft, processMasters);

  const filteredParts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((part) => {
      if (!showInactive && part.inactive) return false;
      if (!query) return true;
      const customerName = customers.find((customer) => customer.id === part.customerId)?.name || '';
      return `${part.partId} ${part.partName} ${customerName} ${part.processMasterId} ${part.material}`.toLowerCase().includes(query);
    });
  }, [records, search, showInactive]);

  function selectPart(part: CustomerPart) {
    setSelectedId(part.id);
    setDraft(clonePart(part));
    setMessages([]);
    setSavedMessage('');
  }

  function update<K extends keyof CustomerPart>(key: K, value: CustomerPart[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updatePrice<K extends keyof CustomerPart['price']>(key: K, value: CustomerPart['price'][K]) {
    setDraft((current) => ({ ...current, price: { ...current.price, [key]: value } }));
  }

  function updateQuote<K extends keyof CustomerPart['quote']>(key: K, value: CustomerPart['quote'][K]) {
    setDraft((current) => ({ ...current, quote: { ...current.quote, [key]: value } }));
  }

  function savePart() {
    const result = validateCustomerPart(draft, records, processMasters);
    setMessages([...result.errors, ...result.warnings]);
    setSavedMessage('');
    if (!result.valid) return;

    setRecords((current) => {
      const exists = current.some((part) => part.id === selectedId);
      if (!exists) return [...current, clonePart(draft)];
      return current.map((part) => (part.id === selectedId ? clonePart(draft) : part));
    });
    setSelectedId(draft.id);
    setSavedMessage('Part saved.');
  }

  return (
    <ModuleGate user={currentUser} permission="Part Maintenance" moduleName="Part Maintenance">
      <section className="master-data-module" aria-labelledby="part-maintenance-title">
        <header className="master-data-header">
          <div>
            <p className="module-label">Master data</p>
            <h1 id="part-maintenance-title">Part Maintenance</h1>
          </div>
          <div className="toolbar-group">
            <button type="button" className="toolbar-button" onClick={() => selectPart(createPart())}>
              New Part
            </button>
            <button type="button" className="toolbar-button toolbar-button-primary" onClick={savePart}>
              Save Part
            </button>
          </div>
        </header>

        <div className="master-data-workspace">
          <aside className="master-list-panel" aria-label="Part list">
            <label className="search-field">
              <span>Search parts</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
            <label className="show-inactive-toggle">
              <input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} />
              Include inactive
            </label>
            <div className="master-list">
              {filteredParts.map((part) => (
                <button
                  type="button"
                  key={part.id}
                  className={part.id === selectedId ? 'master-list-row master-list-row-selected' : 'master-list-row'}
                  onClick={() => selectPart(part)}
                >
                  <strong>{part.partId}</strong>
                  <span>{part.partName || 'Unnamed part'}</span>
                </button>
              ))}
            </div>
          </aside>

          <div className="master-detail-panel">
            {messages.length > 0 ? (
              <div className="validation-summary" role="alert">
                {messages.join(' ')}
              </div>
            ) : null}
            {savedMessage ? <div className="save-summary">{savedMessage}</div> : null}

            <section className="master-section" aria-label="Part Overview">
              <h2>Overview</h2>
              <div className="form-grid">
                <label><span>Part ID</span><input value={draft.partId} onChange={(event) => update('partId', event.target.value)} /></label>
                <label><span>Part name</span><input value={draft.partName} onChange={(event) => update('partName', event.target.value)} /></label>
                <label className="form-field-wide"><span>Description</span><input value={draft.description} onChange={(event) => update('description', event.target.value)} /></label>
                <label>
                  <span>Customer</span>
                  <select value={draft.customerId} onChange={(event) => update('customerId', event.target.value)}>
                    <option value="">Select customer</option>
                    {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
                  </select>
                </label>
                <label><span>Blanket PO</span><input value={draft.blanketPo} onChange={(event) => update('blanketPo', event.target.value)} /></label>
                <label><span>Revision</span><input value={draft.revision} onChange={(event) => update('revision', event.target.value)} /></label>
                <label><span>Outgoing part number</span><input value={draft.outgoingPartNumber} onChange={(event) => update('outgoingPartNumber', event.target.value)} /></label>
              </div>
              <div className="status-strip">
                <label><input type="checkbox" checked={draft.inactive} onChange={(event) => update('inactive', event.target.checked)} /> Inactive</label>
                <label><input type="checkbox" checked={draft.partHold} onChange={(event) => update('partHold', event.target.checked)} /> Part hold</label>
                <label><input type="checkbox" checked={draft.shippingHold} onChange={(event) => update('shippingHold', event.target.checked)} /> Shipping hold</label>
              </div>
            </section>

            <section className="master-section" aria-label="Process And Requirements">
              <h2>Process And Requirements</h2>
              <div className="form-grid">
                <label>
                  <span>Process master</span>
                  <select value={draft.processMasterId} onChange={(event) => update('processMasterId', event.target.value)}>
                    <option value="">Draft - no process selected</option>
                    {processMasters.map((process) => <option key={process.id} value={process.id}>{process.id} - {process.processCode}</option>)}
                  </select>
                </label>
                <label><span>Material</span><input value={draft.material} onChange={(event) => update('material', event.target.value)} /></label>
                <label><span>Specification</span><input value={draft.specification} onChange={(event) => update('specification', event.target.value)} /></label>
                <label><span>Customer specification</span><input value={draft.customerSpecification} onChange={(event) => update('customerSpecification', event.target.value)} /></label>
                <label><span>Cert format</span><input value={draft.certFormat} onChange={(event) => update('certFormat', event.target.value)} /></label>
                <label><span>Each weight</span><input type="number" value={draft.eachWeight} onChange={(event) => update('eachWeight', toNumber(event.target.value))} /></label>
              </div>
              <div className="status-strip">
                <label><input type="checkbox" checked={draft.certRequired} onChange={(event) => update('certRequired', event.target.checked)} /> Cert required</label>
              </div>
            </section>

            <section className="master-section" aria-label="Pricing And Quote Summary">
              <h2>Pricing And Quote Summary</h2>
              <div className="form-grid">
                <label><span>Setup</span><input type="number" value={draft.price.setup} onChange={(event) => updatePrice('setup', toNumber(event.target.value))} /></label>
                <label><span>Simple price</span><input type="number" value={draft.price.amount} onChange={(event) => updatePrice('amount', toNumber(event.target.value))} /></label>
                <label><span>Price per</span><input value={draft.price.pricePer} onChange={(event) => updatePrice('pricePer', event.target.value)} /></label>
                <label><span>Minimum</span><input type="number" value={draft.price.minimum} onChange={(event) => updatePrice('minimum', toNumber(event.target.value))} /></label>
                <label><span>Quote ID</span><input value={draft.quote.quoteId} onChange={(event) => updateQuote('quoteId', event.target.value)} /></label>
                <label><span>Quoted quantity</span><input type="number" value={draft.quote.quotedQuantity} onChange={(event) => updateQuote('quotedQuantity', toNumber(event.target.value))} /></label>
              </div>
            </section>

            <section className="master-section part-readiness-panel">
              <h2>Order Entry Use</h2>
              <strong>{status.ready ? 'Ready for Order Entry' : 'Not ready for Order Entry'}</strong>
              {status.blockers.length > 0 ? <ul>{status.blockers.map((item) => <li key={item}>{item}</li>)}</ul> : null}
              {status.warnings.length > 0 ? <ul>{status.warnings.map((item) => <li key={item}>{item}</li>)}</ul> : null}
            </section>
          </div>
        </div>
      </section>
    </ModuleGate>
  );
}
```

- [ ] **Step 4: Add Part Maintenance styles**

Append this CSS to `src/styles.css`:

```css
.show-inactive-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #334155;
  font-size: 0.84rem;
  font-weight: 800;
}

.part-readiness-panel strong {
  display: inline-flex;
  width: fit-content;
  padding: 5px 10px;
  border: 1px solid #64748b;
  border-radius: 999px;
  background: #f8fafc;
  color: #172033;
}

.part-readiness-panel ul {
  display: grid;
  gap: 5px;
  margin: 0;
  padding-left: 18px;
}
```

- [ ] **Step 5: Run Part Maintenance tests**

Run:

```bash
npm test src/modules/part-maintenance/PartMaintenanceModule.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit Part Maintenance**

Run:

```bash
git add src/modules/part-maintenance src/styles.css
git commit -m "feat: add part maintenance module"
```

## Task 5: Wire The Module Shell

**Files:**
- Create: `src/components/AppShell.tsx`
- Create: `src/components/AppShell.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write the failing AppShell tests**

Create `src/components/AppShell.test.tsx` with:

```tsx
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
```

- [ ] **Step 2: Run the AppShell test and verify it fails**

Run:

```bash
npm test src/components/AppShell.test.tsx
```

Expected: FAIL because `AppShell` does not exist.

- [ ] **Step 3: Create the module shell**

Create `src/components/AppShell.tsx` with:

```tsx
import { useMemo, useState } from 'react';
import { hasModulePermission } from '../domain/permissions';
import type { ModulePermission, User } from '../domain/types';
import { CustomerMaintenanceModule } from '../modules/customer-maintenance/CustomerMaintenanceModule';
import { OrderEntryModule } from '../modules/order-entry/OrderEntryModule';
import { PartMaintenanceModule } from '../modules/part-maintenance/PartMaintenanceModule';

interface AppShellProps {
  currentUser: User;
}

interface ModuleDefinition {
  label: string;
  permission: ModulePermission;
}

const modules: ModuleDefinition[] = [
  { label: 'Order Entry', permission: 'Order Entry' },
  { label: 'Customer Maintenance', permission: 'Customer Maintenance' },
  { label: 'Part Maintenance', permission: 'Part Maintenance' },
];

function renderModule(permission: ModulePermission, currentUser: User) {
  if (permission === 'Order Entry') return <OrderEntryModule currentUser={currentUser} />;
  if (permission === 'Customer Maintenance') return <CustomerMaintenanceModule currentUser={currentUser} />;
  return <PartMaintenanceModule currentUser={currentUser} />;
}

export function AppShell({ currentUser }: AppShellProps) {
  const firstEnabledPermission = useMemo(
    () => {
      const enabledModule = modules.find((module) => hasModulePermission(currentUser, module.permission));
      return enabledModule ? enabledModule.permission : modules[0].permission;
    },
    [currentUser],
  );
  const [activePermission, setActivePermission] = useState<ModulePermission>(firstEnabledPermission);
  const activeAllowed = hasModulePermission(currentUser, activePermission);
  const resolvedPermission = activeAllowed ? activePermission : firstEnabledPermission;

  return (
    <main className="app-shell erp-shell">
      <nav className="module-nav" aria-label="HeatSynQ modules">
        <strong>HeatSynQ</strong>
        <div className="module-nav-actions">
          {modules.map((module) => {
            const enabled = hasModulePermission(currentUser, module.permission);
            const selected = resolvedPermission === module.permission;

            return (
              <button
                type="button"
                key={module.permission}
                className="module-nav-button"
                disabled={!enabled}
                aria-pressed={selected}
                onClick={() => setActivePermission(module.permission)}
              >
                {module.label}
              </button>
            );
          })}
        </div>
      </nav>
      {renderModule(resolvedPermission, currentUser)}
    </main>
  );
}
```

- [ ] **Step 4: Render AppShell from App**

Replace `src/App.tsx` with:

```tsx
import { users } from './data/seed';
import { AppShell } from './components/AppShell';

export default function App() {
  return <AppShell currentUser={users[0]} />;
}
```

- [ ] **Step 5: Add module shell styles**

Append this CSS to `src/styles.css`:

```css
.erp-shell {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
}

.module-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  min-height: 44px;
  padding: 6px 14px;
  border-bottom: 1px solid #9aa5b1;
  background: #172033;
  color: #ffffff;
}

.module-nav-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.module-nav-button {
  min-height: 30px;
  padding: 0 11px;
  border: 1px solid #64748b;
  border-radius: 4px;
  background: #243044;
  color: #ffffff;
  cursor: pointer;
  font-weight: 800;
}

.module-nav-button[aria-pressed='true'] {
  border-color: #93c5fd;
  background: #1d4ed8;
}

.module-nav-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}
```

- [ ] **Step 6: Run AppShell and full module tests**

Run:

```bash
npm test src/components/AppShell.test.tsx src/components/ModuleGate.test.tsx src/modules/customer-maintenance/CustomerMaintenanceModule.test.tsx src/modules/part-maintenance/PartMaintenanceModule.test.tsx src/modules/order-entry/OrderEntryModule.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit module shell**

Run:

```bash
git add src/App.tsx src/components/AppShell.tsx src/components/AppShell.test.tsx src/styles.css
git commit -m "feat: wire master data module shell"
```

## Task 6: Final Verification And Build

**Files:**
- Modify only if verification exposes a specific defect.

- [ ] **Step 1: Run all tests**

Run:

```bash
npm test
```

Expected: PASS for all Vitest suites.

- [ ] **Step 2: Run TypeScript lint**

Run:

```bash
npm run lint
```

Expected: exit 0.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: exit 0 and Vite writes `dist/`.

- [ ] **Step 4: Inspect git status**

Run:

```bash
git status -sb
```

Expected: clean working tree except ignored `dist/` and `node_modules/`.

- [ ] **Step 5: Manual smoke check**

Run:

```bash
npm run dev
```

Expected: Vite prints a local URL. Open it if the environment allows browser access and verify:

- module nav shows `Order Entry`, `Customer Maintenance`, and `Part Maintenance`;
- `Order Entry` still opens and existing release/readiness behavior still works;
- `Customer Maintenance` search finds AMZ and shows linked part `12496783-HT`;
- `Part Maintenance` search finds Guard and shows Order Entry readiness plus shipping-hold warning;
- user-facing text fits inside buttons, lists, and panels at desktop width.

- [ ] **Step 6: Commit verification fixes if needed**

If verification required code changes, run:

```bash
git add src
git commit -m "fix: stabilize master data prototype"
```

Expected: use this commit only when a specific verification defect was fixed.

## Self-Review Checklist

- Spec coverage: Tasks 1-5 cover permissions, customer module, part module, customer-part linking, process master references, Order Entry readiness status, seeded in-browser state, and the module shell. Task 6 covers tests, lint, build, and smoke checks.
- Deferred scope: backend persistence, on-prem database, multi-user conflict handling, document storage, deep pricing, process editing, Customer Expediting, billing, and A/R stay outside this implementation.
- Type consistency: `ModulePermission`, `Customer`, `CustomerPart`, `validateCustomer`, `validateCustomerPart`, `getPartOrderEntryStatus`, and `filterPartsForCustomer` use the same names across tests, implementation, and module UI.
- Verification: every task has a test command with expected result before commit, and final verification includes all tests, TypeScript lint, production build, git status, and manual smoke check.
