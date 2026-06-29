# Order Entry Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully interactive HeatSynQ `Order Entry` module prototype based on the approved receiving/order-entry spec.

**Architecture:** Create a Vite React TypeScript app with pure domain logic for permissions, readiness, and weight calculations. Keep the Order Entry screen as a module composed from small tab, toolbar, activity, and checklist components, with seeded data instead of a backend.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, jsdom, lucide-react.

---

## Scope Check

The approved spec covers one bounded subsystem: the `Order Entry` module. This plan does not implement billing, shipping, inventory, assembly, maintenance modules, process-master editing, production tracking, or document upload.

## File Structure

- Create: `package.json` - project scripts and dependencies through Vite/npm.
- Create: `index.html` - Vite app mount point.
- Create: `tsconfig.json` - TypeScript project configuration.
- Create: `vite.config.ts` - Vite and Vitest configuration.
- Create: `src/main.tsx` - React entry point.
- Create: `src/App.tsx` - app shell with module permission fixture.
- Create: `src/styles.css` - Visual Shop-inspired dense ERP styling.
- Create: `src/domain/types.ts` - shared domain types.
- Create: `src/domain/permissions.ts` - module permission helpers.
- Create: `src/domain/readiness.ts` - release/print readiness validator.
- Create: `src/domain/weights.ts` - gross, tare, net, and totals logic.
- Create: `src/data/seed.ts` - customers, process masters, users, and sample order data.
- Create: `src/modules/order-entry/OrderEntryModule.tsx` - module state and composition.
- Create: `src/modules/order-entry/components/ModuleGate.tsx` - permission gate.
- Create: `src/modules/order-entry/components/OrderToolbar.tsx` - top action toolbar.
- Create: `src/modules/order-entry/components/OrderTabs.tsx` - five-tab navigation.
- Create: `src/modules/order-entry/components/OrderHeaderStatus.tsx` - order identity and status.
- Create: `src/modules/order-entry/components/ReadinessChecklist.tsx` - visible readiness checks.
- Create: `src/modules/order-entry/components/ActivityPanels.tsx` - notes, events, documents.
- Create: `src/modules/order-entry/tabs/OrderTopTab.tsx` - customer/order header editing.
- Create: `src/modules/order-entry/tabs/DetailTab.tsx` - read-only seeded secondary fields.
- Create: `src/modules/order-entry/tabs/PartsTab.tsx` - containers, part rows, weight totals.
- Create: `src/modules/order-entry/tabs/ProcessTab.tsx` - process master selection.
- Create: `src/modules/order-entry/tabs/StepsTab.tsx` - process step display.
- Create: `src/domain/readiness.test.ts` - readiness validator tests.
- Create: `src/domain/weights.test.ts` - weight calculation tests.
- Create: `src/domain/permissions.test.ts` - permission helper tests.
- Create: `src/modules/order-entry/OrderEntryModule.test.tsx` - module interaction tests.

## Task 1: Scaffold The React/Vite App

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`

- [ ] **Step 1: Generate the Vite React TypeScript project**

Run:

```bash
npm create vite@latest . -- --template react-ts
```

Expected: the command creates Vite React TypeScript files in the repository root.

- [ ] **Step 2: Install runtime and test dependencies**

Run:

```bash
npm install lucide-react
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Expected: `package.json` and `package-lock.json` include React, Vite, lucide-react, Vitest, jsdom, and Testing Library packages.

- [ ] **Step 3: Configure scripts**

Modify `package.json` so the `scripts` block is:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "tsc -b --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 4: Configure Vitest**

Create `vite.config.ts` with:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
});
```

- [ ] **Step 5: Replace starter entry point**

Create `src/main.tsx` with:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 6: Add a temporary app shell**

Create `src/App.tsx` with:

```tsx
export default function App() {
  return (
    <main className="app-shell">
      <h1>HeatSynQ</h1>
      <p>Order Entry module setup in progress.</p>
    </main>
  );
}
```

- [ ] **Step 7: Add base styles**

Create `src/styles.css` with:

```css
:root {
  color: #111827;
  background: #e9e9e9;
  font-family: Arial, Helvetica, sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 1024px;
}

button,
input,
select,
textarea {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
  background: #eeeeee;
}
```

- [ ] **Step 8: Verify scaffold builds**

Run:

```bash
npm run build
```

Expected: exit 0 and Vite writes a `dist/` build.

- [ ] **Step 9: Commit scaffold**

Run:

```bash
git add package.json package-lock.json index.html tsconfig.json vite.config.ts src
git commit -m "feat: scaffold HeatSynQ frontend"
```

## Task 2: Add Domain Types And Seed Data

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/data/seed.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create domain types**

Create `src/domain/types.ts` with:

```ts
export type ModulePermission = 'Order Entry';

export interface User {
  id: string;
  name: string;
  permissions: ModulePermission[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  receivedFrom: string;
  shipTo: string;
}

export interface Container {
  id: string;
  type: string;
  count: number;
  quantity: number;
  grossWeight: number;
  tareWeight: number;
  containerId: string;
}

export interface PartLine {
  id: string;
  partNumber: string;
  customerPartNumber: string;
  description: string;
  quantity: number;
  eachWeight: number;
  material: string;
  thickness: number;
  verified: boolean;
}

export interface ProcessStep {
  id: string;
  sequence: number;
  name: string;
  furnace: string;
  temperatureF: number;
  minutes: number;
}

export interface ProcessMaster {
  id: string;
  revision: number;
  processCode: string;
  material: string;
  certificationId: string;
  spec: string;
  comments: string;
  steps: ProcessStep[];
}

export interface OrderEvent {
  id: string;
  date: string;
  code: string;
  description: string;
}

export interface Note {
  id: string;
  createdBy: string;
  createdOn: string;
  note: string;
}

export interface DocumentReference {
  id: string;
  source: string;
  fileName: string;
  dateCopied: string;
}

export interface Order {
  id: string;
  status: string;
  receivingStatus: string;
  customerId: string;
  poNumber: string;
  packingNumber: string;
  certificationRequired: boolean;
  requestDate: string;
  targetShipDate: string;
  carrierIn: string;
  inRouteId: string;
  orderLocation: string;
  orderType: string;
  phone: string;
  receivedFrom: string;
  shipTo: string;
  freightOut: number;
  processMasterId: string;
  containers: Container[];
  parts: PartLine[];
  events: OrderEvent[];
  orderNotes: Note[];
  customerNotes: Note[];
  documents: DocumentReference[];
}
```

- [ ] **Step 2: Create seed data**

Create `src/data/seed.ts` with:

```ts
import type { Customer, Order, ProcessMaster, User } from '../domain/types';

export const users: User[] = [
  { id: 'user-colton', name: 'Colton', permissions: ['Order Entry'] },
  { id: 'user-viewer', name: 'Viewer', permissions: [] },
];

export const customers: Customer[] = [
  {
    id: 'cust-gfmco',
    name: 'GFMCO - Columbus LLC',
    phone: '800-328-8379',
    receivedFrom: 'GFMCO - Columbus LLC',
    shipTo: 'Max Coating',
  },
  {
    id: 'cust-amz',
    name: 'AMZ Manufacturing Corporation',
    phone: '614-555-0149',
    receivedFrom: 'AMZ Manufacturing Corporation',
    shipTo: 'AMZ Manufacturing Corporation',
  },
];

export const processMasters: ProcessMaster[] = [
  {
    id: '15-29900-003',
    revision: 16,
    processCode: 'Austemper',
    material: 'Ductile Iron',
    certificationId: '',
    spec: 'Eq: 180; Gr: IQ',
    comments: 'Standard austemper process for ductile iron tow components.',
    steps: [
      { id: 'step-1', sequence: 10, name: 'Preheat load', furnace: 'Furnace 2', temperatureF: 700, minutes: 45 },
      { id: 'step-2', sequence: 20, name: 'Austenitize', furnace: 'Furnace 2', temperatureF: 1625, minutes: 90 },
      { id: 'step-3', sequence: 30, name: 'Quench', furnace: 'Salt Bath 1', temperatureF: 725, minutes: 60 },
      { id: 'step-4', sequence: 40, name: 'Final inspection', furnace: 'Inspection', temperatureF: 70, minutes: 20 },
    ],
  },
  {
    id: '12-496783-HT',
    revision: 4,
    processCode: 'Carburize',
    material: '8620 Steel',
    certificationId: 'CERT-8620',
    spec: 'Case depth 0.030-0.040',
    comments: 'Reference process seeded from part maintenance context.',
    steps: [
      { id: 'step-5', sequence: 10, name: 'Carburize', furnace: 'Furnace 5', temperatureF: 1700, minutes: 180 },
      { id: 'step-6', sequence: 20, name: 'Oil quench', furnace: 'Quench 2', temperatureF: 150, minutes: 30 },
    ],
  },
];

export const sampleOrder: Order = {
  id: '71951',
  status: 'Receiving Complete',
  receivingStatus: 'Order Entry Complete',
  customerId: 'cust-gfmco',
  poNumber: '49499',
  packingNumber: '45194',
  certificationRequired: false,
  requestDate: '2026-07-06',
  targetShipDate: '',
  carrierIn: 'GFMCO Truck',
  inRouteId: '',
  orderLocation: '',
  orderType: 'Standard',
  phone: '800-328-8379',
  receivedFrom: 'GFMCO - Columbus LLC',
  shipTo: 'Max Coating',
  freightOut: 0,
  processMasterId: '15-29900-003',
  containers: [
    {
      id: 'container-1',
      type: 'Skid',
      count: 3,
      quantity: 15,
      grossWeight: 2055,
      tareWeight: 150,
      containerId: '',
    },
  ],
  parts: [
    {
      id: 'part-1',
      partNumber: '15-29900-010',
      customerPartNumber: 'CNTR TOW',
      description: 'MACHINED',
      quantity: 15,
      eachWeight: 127,
      material: 'Ductile Iron',
      thickness: 0.25,
      verified: true,
    },
  ],
  events: [
    { id: 'event-1', date: '2026-06-26 10:45:57', code: 'Ord Printed', description: 'Order printed' },
    { id: 'event-2', date: '2026-06-26 10:45:53', code: 'Order Released', description: '15-29900-010 / CNTR TOW' },
    { id: 'event-3', date: '2026-06-26 10:45:53', code: 'Request Date', description: 'Request date from order entry' },
  ],
  orderNotes: [],
  customerNotes: [],
  documents: [],
};
```

- [ ] **Step 3: Verify type checking**

Run:

```bash
npm run lint
```

Expected: exit 0.

- [ ] **Step 4: Commit domain types and seed data**

Run:

```bash
git add src/domain/types.ts src/data/seed.ts src/App.tsx
git commit -m "feat: add order entry seed data"
```

## Task 3: Implement Pure Domain Logic With TDD

**Files:**
- Create: `src/domain/permissions.ts`
- Create: `src/domain/permissions.test.ts`
- Create: `src/domain/weights.ts`
- Create: `src/domain/weights.test.ts`
- Create: `src/domain/readiness.ts`
- Create: `src/domain/readiness.test.ts`

- [ ] **Step 1: Write permission tests**

Create `src/domain/permissions.test.ts` with:

```ts
import { describe, expect, it } from 'vitest';
import { hasModulePermission } from './permissions';
import type { User } from './types';

describe('hasModulePermission', () => {
  it('allows a user with the Order Entry permission', () => {
    const user: User = { id: 'user-1', name: 'Receiver', permissions: ['Order Entry'] };
    expect(hasModulePermission(user, 'Order Entry')).toBe(true);
  });

  it('blocks a user without the Order Entry permission', () => {
    const user: User = { id: 'user-2', name: 'Viewer', permissions: [] };
    expect(hasModulePermission(user, 'Order Entry')).toBe(false);
  });
});
```

- [ ] **Step 2: Run permission tests and watch them fail**

Run:

```bash
npm test src/domain/permissions.test.ts
```

Expected: FAIL because `src/domain/permissions.ts` does not exist yet.

- [ ] **Step 3: Implement permission helper**

Create `src/domain/permissions.ts` with:

```ts
import type { ModulePermission, User } from './types';

export function hasModulePermission(user: User, permission: ModulePermission): boolean {
  return user.permissions.includes(permission);
}
```

- [ ] **Step 4: Run permission tests and watch them pass**

Run:

```bash
npm test src/domain/permissions.test.ts
```

Expected: PASS with 2 tests passing.

- [ ] **Step 5: Write weight tests**

Create `src/domain/weights.test.ts` with:

```ts
import { describe, expect, it } from 'vitest';
import { calculateContainerNetWeight, calculateOrderWeights } from './weights';
import type { Order } from './types';

const baseOrder: Order = {
  id: '1',
  status: '',
  receivingStatus: '',
  customerId: '',
  poNumber: '',
  packingNumber: '',
  certificationRequired: false,
  requestDate: '',
  targetShipDate: '',
  carrierIn: '',
  inRouteId: '',
  orderLocation: '',
  orderType: 'Standard',
  phone: '',
  receivedFrom: '',
  shipTo: '',
  freightOut: 0,
  processMasterId: '',
  containers: [],
  parts: [],
  events: [],
  orderNotes: [],
  customerNotes: [],
  documents: [],
};

describe('calculateContainerNetWeight', () => {
  it('subtracts tare from gross weight', () => {
    expect(calculateContainerNetWeight({ grossWeight: 2055, tareWeight: 150 })).toBe(1905);
  });

  it('does not allow negative net weight', () => {
    expect(calculateContainerNetWeight({ grossWeight: 20, tareWeight: 30 })).toBe(0);
  });
});

describe('calculateOrderWeights', () => {
  it('aggregates container and part totals', () => {
    const totals = calculateOrderWeights({
      ...baseOrder,
      containers: [
        { id: 'c1', type: 'Skid', count: 1, quantity: 10, grossWeight: 120, tareWeight: 20, containerId: '' },
        { id: 'c2', type: 'Box', count: 1, quantity: 5, grossWeight: 80, tareWeight: 10, containerId: '' },
      ],
      parts: [
        {
          id: 'p1',
          partNumber: 'A',
          customerPartNumber: 'A',
          description: 'Part A',
          quantity: 15,
          eachWeight: 10,
          material: 'Steel',
          thickness: 1,
          verified: true,
        },
      ],
    });

    expect(totals.containerQuantity).toBe(15);
    expect(totals.containerNetWeight).toBe(170);
    expect(totals.partQuantity).toBe(15);
    expect(totals.partWeight).toBe(150);
    expect(totals.hasMismatch).toBe(true);
  });
});
```

- [ ] **Step 6: Run weight tests and watch them fail**

Run:

```bash
npm test src/domain/weights.test.ts
```

Expected: FAIL because `src/domain/weights.ts` does not exist yet.

- [ ] **Step 7: Implement weight logic**

Create `src/domain/weights.ts` with:

```ts
import type { Order } from './types';

export interface WeightInput {
  grossWeight: number;
  tareWeight: number;
}

export interface OrderWeightTotals {
  containerQuantity: number;
  containerGrossWeight: number;
  containerTareWeight: number;
  containerNetWeight: number;
  partQuantity: number;
  partWeight: number;
  hasMismatch: boolean;
}

export function calculateContainerNetWeight(input: WeightInput): number {
  return Math.max(0, input.grossWeight - input.tareWeight);
}

export function calculateOrderWeights(order: Order): OrderWeightTotals {
  const containerQuantity = order.containers.reduce((sum, container) => sum + container.quantity, 0);
  const containerGrossWeight = order.containers.reduce((sum, container) => sum + container.grossWeight, 0);
  const containerTareWeight = order.containers.reduce((sum, container) => sum + container.tareWeight, 0);
  const containerNetWeight = order.containers.reduce(
    (sum, container) => sum + calculateContainerNetWeight(container),
    0,
  );
  const partQuantity = order.parts.reduce((sum, part) => sum + part.quantity, 0);
  const partWeight = order.parts.reduce((sum, part) => sum + part.quantity * part.eachWeight, 0);

  return {
    containerQuantity,
    containerGrossWeight,
    containerTareWeight,
    containerNetWeight,
    partQuantity,
    partWeight,
    hasMismatch: containerQuantity !== partQuantity || containerNetWeight !== partWeight,
  };
}
```

- [ ] **Step 8: Run weight tests and watch them pass**

Run:

```bash
npm test src/domain/weights.test.ts
```

Expected: PASS with 3 tests passing.

- [ ] **Step 9: Write readiness tests**

Create `src/domain/readiness.test.ts` with:

```ts
import { describe, expect, it } from 'vitest';
import { validateOrderReadiness } from './readiness';
import type { Order, User } from './types';

const user: User = { id: 'u1', name: 'Receiver', permissions: ['Order Entry'] };

const readyOrder: Order = {
  id: '71951',
  status: 'Receiving Complete',
  receivingStatus: 'Order Entry Complete',
  customerId: 'cust-gfmco',
  poNumber: '',
  packingNumber: '',
  certificationRequired: false,
  requestDate: '',
  targetShipDate: '',
  carrierIn: '',
  inRouteId: '',
  orderLocation: '',
  orderType: 'Standard',
  phone: '',
  receivedFrom: '',
  shipTo: '',
  freightOut: 0,
  processMasterId: '15-29900-003',
  containers: [{ id: 'c1', type: 'Skid', count: 1, quantity: 15, grossWeight: 2055, tareWeight: 150, containerId: '' }],
  parts: [
    {
      id: 'p1',
      partNumber: '15-29900-010',
      customerPartNumber: 'CNTR TOW',
      description: 'MACHINED',
      quantity: 15,
      eachWeight: 127,
      material: 'Ductile Iron',
      thickness: 0.25,
      verified: true,
    },
  ],
  events: [],
  orderNotes: [],
  customerNotes: [],
  documents: [],
};

describe('validateOrderReadiness', () => {
  it('passes when all Visual Shop readiness rules are satisfied', () => {
    expect(validateOrderReadiness(readyOrder, user).ready).toBe(true);
  });

  it('reports missing customer with the Order Top tab', () => {
    const result = validateOrderReadiness({ ...readyOrder, customerId: '' }, user);
    expect(result.ready).toBe(false);
    expect(result.missing).toContainEqual({ key: 'customer', label: 'Assigned customer', tab: 'Order Top' });
  });

  it('reports missing process master with the Process tab', () => {
    const result = validateOrderReadiness({ ...readyOrder, processMasterId: '' }, user);
    expect(result.ready).toBe(false);
    expect(result.missing).toContainEqual({ key: 'processMaster', label: 'Existing process master', tab: 'Process' });
  });

  it('reports missing module permission', () => {
    const result = validateOrderReadiness(readyOrder, { id: 'u2', name: 'Viewer', permissions: [] });
    expect(result.ready).toBe(false);
    expect(result.missing).toContainEqual({ key: 'clearance', label: 'Order Entry permission', tab: 'Order Top' });
  });
});
```

- [ ] **Step 10: Run readiness tests and watch them fail**

Run:

```bash
npm test src/domain/readiness.test.ts
```

Expected: FAIL because `src/domain/readiness.ts` does not exist yet.

- [ ] **Step 11: Implement readiness validator**

Create `src/domain/readiness.ts` with:

```ts
import { hasModulePermission } from './permissions';
import { calculateOrderWeights } from './weights';
import type { Order, User } from './types';

export type ReadinessKey = 'customer' | 'container' | 'part' | 'quantityOrWeight' | 'processMaster' | 'clearance';
export type OrderEntryTab = 'Order Top' | 'Detail' | 'Parts' | 'Process' | 'Steps';

export interface MissingReadinessItem {
  key: ReadinessKey;
  label: string;
  tab: OrderEntryTab;
}

export interface ReadinessResult {
  ready: boolean;
  missing: MissingReadinessItem[];
}

export function validateOrderReadiness(order: Order, user: User): ReadinessResult {
  const totals = calculateOrderWeights(order);
  const missing: MissingReadinessItem[] = [];

  if (!order.customerId) missing.push({ key: 'customer', label: 'Assigned customer', tab: 'Order Top' });
  if (order.containers.length === 0) missing.push({ key: 'container', label: 'At least one container', tab: 'Parts' });
  if (order.parts.length === 0) missing.push({ key: 'part', label: 'At least one part', tab: 'Parts' });
  if (totals.containerQuantity <= 0 && totals.containerNetWeight <= 0 && totals.partQuantity <= 0 && totals.partWeight <= 0) {
    missing.push({ key: 'quantityOrWeight', label: 'Quantity or weight', tab: 'Parts' });
  }
  if (!order.processMasterId) missing.push({ key: 'processMaster', label: 'Existing process master', tab: 'Process' });
  if (!hasModulePermission(user, 'Order Entry')) {
    missing.push({ key: 'clearance', label: 'Order Entry permission', tab: 'Order Top' });
  }

  return { ready: missing.length === 0, missing };
}
```

- [ ] **Step 12: Run domain tests**

Run:

```bash
npm test src/domain
```

Expected: PASS for permission, weight, and readiness tests.

- [ ] **Step 13: Commit domain logic**

Run:

```bash
git add src/domain
git commit -m "feat: add order entry domain rules"
```

## Task 4: Build The Permission-Gated App Shell

**Files:**
- Create: `src/modules/order-entry/components/ModuleGate.tsx`
- Create: `src/modules/order-entry/OrderEntryModule.tsx`
- Modify: `src/App.tsx`
- Create: `src/modules/order-entry/OrderEntryModule.test.tsx`

- [ ] **Step 1: Write permission gate interaction test**

Create `src/modules/order-entry/OrderEntryModule.test.tsx` with:

```tsx
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
```

- [ ] **Step 2: Add jest-dom import for tests**

Create `src/testSetup.ts` with:

```ts
import '@testing-library/jest-dom/vitest';
```

Modify `vite.config.ts` test config:

```ts
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: ['./src/testSetup.ts'],
},
```

- [ ] **Step 3: Run module test and watch it fail**

Run:

```bash
npm test src/modules/order-entry/OrderEntryModule.test.tsx
```

Expected: FAIL because `OrderEntryModule` does not exist yet.

- [ ] **Step 4: Implement ModuleGate**

Create `src/modules/order-entry/components/ModuleGate.tsx` with:

```tsx
import type { PropsWithChildren } from 'react';
import { hasModulePermission } from '../../../domain/permissions';
import type { User } from '../../../domain/types';

interface ModuleGateProps extends PropsWithChildren {
  user: User;
}

export function ModuleGate({ user, children }: ModuleGateProps) {
  if (!hasModulePermission(user, 'Order Entry')) {
    return (
      <section className="module-blocked">
        <h1>Order Entry permission required</h1>
        <p>This module is not enabled for {user.name}.</p>
      </section>
    );
  }

  return <>{children}</>;
}
```

- [ ] **Step 5: Implement initial OrderEntryModule**

Create `src/modules/order-entry/OrderEntryModule.tsx` with:

```tsx
import { sampleOrder } from '../../data/seed';
import type { User } from '../../domain/types';
import { ModuleGate } from './components/ModuleGate';

interface OrderEntryModuleProps {
  currentUser: User;
}

export function OrderEntryModule({ currentUser }: OrderEntryModuleProps) {
  return (
    <ModuleGate user={currentUser}>
      <section className="order-entry-module">
        <header className="window-title">
          <h1>Order Entry</h1>
          <span>Order {sampleOrder.id}</span>
        </header>
      </section>
    </ModuleGate>
  );
}
```

- [ ] **Step 6: Wire App to module**

Modify `src/App.tsx` with:

```tsx
import { users } from './data/seed';
import { OrderEntryModule } from './modules/order-entry/OrderEntryModule';

export default function App() {
  return (
    <main className="app-shell">
      <OrderEntryModule currentUser={users[0]} />
    </main>
  );
}
```

- [ ] **Step 7: Run module test and watch it pass**

Run:

```bash
npm test src/modules/order-entry/OrderEntryModule.test.tsx
```

Expected: PASS with 2 tests passing.

- [ ] **Step 8: Commit permission-gated shell**

Run:

```bash
git add src/App.tsx src/testSetup.ts vite.config.ts src/modules/order-entry
git commit -m "feat: add order entry module gate"
```

## Task 5: Implement Toolbar, Tabs, Status, And Readiness UI

**Files:**
- Create: `src/modules/order-entry/components/OrderToolbar.tsx`
- Create: `src/modules/order-entry/components/OrderTabs.tsx`
- Create: `src/modules/order-entry/components/OrderHeaderStatus.tsx`
- Create: `src/modules/order-entry/components/ReadinessChecklist.tsx`
- Modify: `src/modules/order-entry/OrderEntryModule.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Extend module test for core screen regions**

Append this test to `src/modules/order-entry/OrderEntryModule.test.tsx`:

```tsx
it('renders toolbar, five tabs, and readiness checklist', () => {
  render(<OrderEntryModule currentUser={users[0]} />);
  expect(screen.getByRole('button', { name: /new order/i })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Order Top' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Detail' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Parts' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Process' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Steps' })).toBeInTheDocument();
  expect(screen.queryByRole('tab', { name: 'Assembly' })).not.toBeInTheDocument();
  expect(screen.queryByRole('tab', { name: 'Inventory' })).not.toBeInTheDocument();
  expect(screen.getByText('Ready to Release')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the screen-region test and watch it fail**

Run:

```bash
npm test src/modules/order-entry/OrderEntryModule.test.tsx
```

Expected: FAIL because toolbar, tabs, and checklist are not implemented.

- [ ] **Step 3: Implement OrderToolbar**

Create `src/modules/order-entry/components/OrderToolbar.tsx` with:

```tsx
import { Check, Eraser, FileSearch, MessageSquare, Plus, Save, X } from 'lucide-react';

interface OrderToolbarProps {
  onNew: () => void;
  onSearch: () => void;
  onCheck: () => void;
  onSave: () => void;
  onCancel: () => void;
  onErase: () => void;
  onAddNote: () => void;
  onAddComment: () => void;
}

export function OrderToolbar(props: OrderToolbarProps) {
  return (
    <div className="order-toolbar" aria-label="Order Entry actions">
      <button type="button" onClick={props.onNew}><Plus size={18} />New Order</button>
      <button type="button" onClick={props.onSearch}><FileSearch size={18} />Search</button>
      <button type="button" onClick={props.onCheck}><Check size={18} />Check</button>
      <button type="button" onClick={props.onSave}><Save size={18} />Save</button>
      <button type="button" onClick={props.onCancel}><X size={18} />Cancel</button>
      <button type="button" onClick={props.onErase}><Eraser size={18} />Erase</button>
      <button type="button" onClick={props.onAddNote}><MessageSquare size={18} />Order Note</button>
      <button type="button" onClick={props.onAddComment}><MessageSquare size={18} />Comments</button>
      <button type="button" disabled>Part Picture Maint.</button>
      <button type="button" disabled>View Invoice</button>
    </div>
  );
}
```

- [ ] **Step 4: Implement OrderTabs**

Create `src/modules/order-entry/components/OrderTabs.tsx` with:

```tsx
import type { OrderEntryTab } from '../../../domain/readiness';

export const orderEntryTabs: OrderEntryTab[] = ['Order Top', 'Detail', 'Parts', 'Process', 'Steps'];

interface OrderTabsProps {
  activeTab: OrderEntryTab;
  onTabChange: (tab: OrderEntryTab) => void;
}

export function OrderTabs({ activeTab, onTabChange }: OrderTabsProps) {
  return (
    <div className="order-tabs" role="tablist" aria-label="Order Entry sections">
      {orderEntryTabs.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={activeTab === tab}
          className={activeTab === tab ? 'active' : ''}
          onClick={() => onTabChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Implement status and checklist components**

Create `src/modules/order-entry/components/OrderHeaderStatus.tsx` with:

```tsx
import type { Order } from '../../../domain/types';

interface OrderHeaderStatusProps {
  order: Order;
  customerName: string;
  ready: boolean;
}

export function OrderHeaderStatus({ order, customerName, ready }: OrderHeaderStatusProps) {
  return (
    <section className="order-header-status">
      <div>
        <strong>Order Id:</strong> {order.id}
      </div>
      <div>
        <strong>Customer:</strong> {customerName || 'Unassigned'}
      </div>
      <div>
        <strong>Order Status:</strong> {order.status || 'Draft'}
      </div>
      <div>
        <strong>Receiving Status:</strong> {ready ? 'Order Entry Complete' : 'Incomplete'}
      </div>
    </section>
  );
}
```

Create `src/modules/order-entry/components/ReadinessChecklist.tsx` with:

```tsx
import type { MissingReadinessItem, ReadinessResult } from '../../../domain/readiness';

const checklist: MissingReadinessItem[] = [
  { key: 'customer', label: 'Assigned customer', tab: 'Order Top' },
  { key: 'container', label: 'At least one container', tab: 'Parts' },
  { key: 'part', label: 'At least one part', tab: 'Parts' },
  { key: 'quantityOrWeight', label: 'Quantity or weight', tab: 'Parts' },
  { key: 'processMaster', label: 'Existing process master', tab: 'Process' },
  { key: 'clearance', label: 'Order Entry permission', tab: 'Order Top' },
];

interface ReadinessChecklistProps {
  result: ReadinessResult;
  onSelectTab: (tab: MissingReadinessItem['tab']) => void;
}

export function ReadinessChecklist({ result, onSelectTab }: ReadinessChecklistProps) {
  const missingKeys = new Set(result.missing.map((item) => item.key));

  return (
    <aside className={result.ready ? 'readiness ready' : 'readiness blocked'}>
      <h2>Ready to Release</h2>
      {checklist.map((item) => {
        const missing = missingKeys.has(item.key);
        return (
          <button key={item.key} type="button" className={missing ? 'missing' : 'complete'} onClick={() => onSelectTab(item.tab)}>
            <span>{missing ? 'Missing' : 'OK'}</span>
            {item.label}
          </button>
        );
      })}
    </aside>
  );
}
```

- [ ] **Step 6: Compose shell in OrderEntryModule**

Modify `src/modules/order-entry/OrderEntryModule.tsx` so it owns `order`, `activeTab`, and readiness:

```tsx
import { useMemo, useState } from 'react';
import { customers, sampleOrder } from '../../data/seed';
import { validateOrderReadiness, type OrderEntryTab } from '../../domain/readiness';
import type { Order, User } from '../../domain/types';
import { ModuleGate } from './components/ModuleGate';
import { OrderHeaderStatus } from './components/OrderHeaderStatus';
import { OrderTabs } from './components/OrderTabs';
import { OrderToolbar } from './components/OrderToolbar';
import { ReadinessChecklist } from './components/ReadinessChecklist';

interface OrderEntryModuleProps {
  currentUser: User;
}

export function OrderEntryModule({ currentUser }: OrderEntryModuleProps) {
  const [order, setOrder] = useState<Order>(sampleOrder);
  const [activeTab, setActiveTab] = useState<OrderEntryTab>('Order Top');
  const readiness = validateOrderReadiness(order, currentUser);
  const customerName = useMemo(
    () => customers.find((customer) => customer.id === order.customerId)?.name ?? '',
    [order.customerId],
  );

  function addEvent(code: string, description: string) {
    setOrder((current) => ({
      ...current,
      events: [
        {
          id: crypto.randomUUID(),
          date: new Date().toLocaleString(),
          code,
          description,
        },
        ...current.events,
      ],
    }));
  }

  return (
    <ModuleGate user={currentUser}>
      <section className="order-entry-module">
        <header className="window-title">
          <h1>Order Entry</h1>
          <span>Order {order.id}</span>
        </header>
        <OrderToolbar
          onNew={() => setOrder({ ...sampleOrder, id: 'New', status: 'Draft', receivingStatus: 'Incomplete', containers: [], parts: [], processMasterId: '', events: [] })}
          onSearch={() => setOrder(sampleOrder)}
          onCheck={() => addEvent(readiness.ready ? 'Ready Check' : 'Blocked Check', readiness.ready ? 'Order is ready to release' : 'Order is missing required receiving data')}
          onSave={() => addEvent('Saved', 'Order saved from Order Entry')}
          onCancel={() => setOrder(sampleOrder)}
          onErase={() => setOrder({ ...sampleOrder, id: 'Draft', containers: [], parts: [], processMasterId: '', events: [] })}
          onAddNote={() => addEvent('Order Note', 'Order note action opened')}
          onAddComment={() => addEvent('Comments', 'Comments action opened')}
        />
        <div className="order-workspace">
          <div className="order-left-rail">Order<br />{order.id}</div>
          <main className="order-main-panel">
            <OrderTabs activeTab={activeTab} onTabChange={setActiveTab} />
            <OrderHeaderStatus order={order} customerName={customerName} ready={readiness.ready} />
            <div className="tab-panel">Current tab: {activeTab}</div>
          </main>
          <ReadinessChecklist result={readiness} onSelectTab={setActiveTab} />
        </div>
      </section>
    </ModuleGate>
  );
}
```

- [ ] **Step 7: Add shell styles**

Append these selectors to `src/styles.css`:

```css
.window-title {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 28px;
  padding: 4px 8px;
  background: #f7f0e8;
  border-bottom: 1px solid #b7b7b7;
}

.window-title h1 {
  margin: 0;
  font-size: 14px;
}

.order-toolbar {
  display: flex;
  gap: 4px;
  padding: 6px;
  background: #efe4d8;
  border-bottom: 1px solid #c7b6a6;
}

.order-toolbar button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 74px;
  height: 46px;
  border: 1px solid #c7c7c7;
  background: #f8f8f8;
}

.order-workspace {
  display: grid;
  grid-template-columns: 96px minmax(680px, 1fr) 310px;
  gap: 8px;
  padding: 8px;
}

.order-left-rail,
.order-main-panel,
.readiness {
  border: 1px solid #b7b7b7;
  background: #f4f4f4;
}

.order-left-rail {
  min-height: 680px;
  padding: 12px;
  text-align: center;
  font-weight: 700;
}

.order-tabs {
  display: flex;
  gap: 3px;
  border-bottom: 1px solid #999;
}

.order-tabs button {
  border: 1px solid #999;
  border-bottom: 0;
  background: #e6e6f8;
  padding: 5px 10px;
}

.order-tabs button.active {
  background: #ffffff;
  font-weight: 700;
}

.order-header-status {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 6px;
  padding: 8px;
  border-bottom: 1px solid #c9c9c9;
  background: #ffffff;
}

.tab-panel {
  min-height: 460px;
  padding: 10px;
}

.readiness {
  padding: 10px;
}

.readiness h2 {
  margin: 0 0 10px;
  font-size: 16px;
}

.readiness button {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 6px;
  padding: 7px;
  border: 1px solid #bbb;
}

.readiness .complete {
  background: #e8f7e8;
}

.readiness .missing {
  background: #fff7cc;
}
```

- [ ] **Step 8: Run module test and watch it pass**

Run:

```bash
npm test src/modules/order-entry/OrderEntryModule.test.tsx
```

Expected: PASS with toolbar, tabs, and checklist assertions passing.

- [ ] **Step 9: Commit shell components**

Run:

```bash
git add src/modules/order-entry src/styles.css
git commit -m "feat: add order entry shell"
```

## Task 6: Implement Order Top, Detail, Process, Steps, And Activity Panels

**Files:**
- Create: `src/modules/order-entry/tabs/OrderTopTab.tsx`
- Create: `src/modules/order-entry/tabs/DetailTab.tsx`
- Create: `src/modules/order-entry/tabs/ProcessTab.tsx`
- Create: `src/modules/order-entry/tabs/StepsTab.tsx`
- Create: `src/modules/order-entry/components/ActivityPanels.tsx`
- Modify: `src/modules/order-entry/OrderEntryModule.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Add interaction test for customer and process selection**

Append this test to `src/modules/order-entry/OrderEntryModule.test.tsx`:

```tsx
import userEvent from '@testing-library/user-event';

it('lets the user change customer and process master', async () => {
  const user = userEvent.setup();
  render(<OrderEntryModule currentUser={users[0]} />);

  await user.selectOptions(screen.getByLabelText('Customer'), 'cust-amz');
  expect(screen.getByDisplayValue('AMZ Manufacturing Corporation')).toBeInTheDocument();

  await user.click(screen.getByRole('tab', { name: 'Process' }));
  await user.selectOptions(screen.getByLabelText('Process master'), '12-496783-HT');
  expect(screen.getByText('Carburize')).toBeInTheDocument();

  await user.click(screen.getByRole('tab', { name: 'Steps' }));
  expect(screen.getByText('Oil quench')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run interaction test and watch it fail**

Run:

```bash
npm test src/modules/order-entry/OrderEntryModule.test.tsx
```

Expected: FAIL because tab panel components are not implemented.

- [ ] **Step 3: Implement OrderTopTab**

Create `src/modules/order-entry/tabs/OrderTopTab.tsx` with controlled fields for customer, PO, packing number, dates, carrier, and status:

```tsx
import { customers } from '../../../data/seed';
import type { Order } from '../../../domain/types';

interface OrderTopTabProps {
  order: Order;
  onOrderChange: (order: Order) => void;
}

export function OrderTopTab({ order, onOrderChange }: OrderTopTabProps) {
  const selectedCustomer = customers.find((customer) => customer.id === order.customerId);

  function update<K extends keyof Order>(key: K, value: Order[K]) {
    onOrderChange({ ...order, [key]: value });
  }

  return (
    <section className="form-grid">
      <label>
        Customer
        <select
          aria-label="Customer"
          value={order.customerId}
          onChange={(event) => {
            const customer = customers.find((item) => item.id === event.target.value);
            onOrderChange({
              ...order,
              customerId: event.target.value,
              phone: customer?.phone ?? '',
              receivedFrom: customer?.receivedFrom ?? '',
              shipTo: customer?.shipTo ?? '',
            });
          }}
        >
          <option value="">Select customer</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>{customer.name}</option>
          ))}
        </select>
      </label>
      <label>
        Customer Name
        <input value={selectedCustomer?.name ?? ''} readOnly />
      </label>
      <label>
        PO No.
        <input value={order.poNumber} onChange={(event) => update('poNumber', event.target.value)} />
      </label>
      <label>
        Packing #
        <input value={order.packingNumber} onChange={(event) => update('packingNumber', event.target.value)} />
      </label>
      <label>
        Certification
        <select value={order.certificationRequired ? 'yes' : 'no'} onChange={(event) => update('certificationRequired', event.target.value === 'yes')}>
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </label>
      <label>
        Request Date
        <input type="date" value={order.requestDate} onChange={(event) => update('requestDate', event.target.value)} />
      </label>
      <label>
        Target Ship
        <input type="date" value={order.targetShipDate} onChange={(event) => update('targetShipDate', event.target.value)} />
      </label>
      <label>
        Carrier In
        <input value={order.carrierIn} onChange={(event) => update('carrierIn', event.target.value)} />
      </label>
      <label>
        Received From
        <input value={order.receivedFrom} onChange={(event) => update('receivedFrom', event.target.value)} />
      </label>
      <label>
        Ship To
        <input value={order.shipTo} onChange={(event) => update('shipTo', event.target.value)} />
      </label>
    </section>
  );
}
```

- [ ] **Step 4: Implement DetailTab**

Create `src/modules/order-entry/tabs/DetailTab.tsx` with:

```tsx
import type { Order } from '../../../domain/types';

interface DetailTabProps {
  order: Order;
}

export function DetailTab({ order }: DetailTabProps) {
  return (
    <section className="detail-panel">
      <dl>
        <dt>Order Type</dt>
        <dd>{order.orderType}</dd>
        <dt>Phone</dt>
        <dd>{order.phone || 'None entered'}</dd>
        <dt>Freight Out</dt>
        <dd>${order.freightOut.toFixed(2)}</dd>
        <dt>In Route Id</dt>
        <dd>{order.inRouteId || 'None entered'}</dd>
        <dt>Order Is At</dt>
        <dd>{order.orderLocation || 'Receiving'}</dd>
      </dl>
    </section>
  );
}
```

- [ ] **Step 5: Implement ProcessTab and StepsTab**

Create `src/modules/order-entry/tabs/ProcessTab.tsx` with:

```tsx
import { processMasters } from '../../../data/seed';
import type { Order } from '../../../domain/types';

interface ProcessTabProps {
  order: Order;
  onOrderChange: (order: Order) => void;
}

export function ProcessTab({ order, onOrderChange }: ProcessTabProps) {
  const process = processMasters.find((item) => item.id === order.processMasterId);

  return (
    <section className="process-panel">
      <label>
        Process master
        <select
          aria-label="Process master"
          value={order.processMasterId}
          onChange={(event) => onOrderChange({ ...order, processMasterId: event.target.value })}
        >
          <option value="">Select process master</option>
          {processMasters.map((item) => (
            <option key={item.id} value={item.id}>{item.id} - {item.processCode}</option>
          ))}
        </select>
      </label>
      {process && (
        <dl>
          <dt>Process Code</dt>
          <dd>{process.processCode}</dd>
          <dt>Revision</dt>
          <dd>{process.revision}</dd>
          <dt>Material</dt>
          <dd>{process.material}</dd>
          <dt>Certification ID</dt>
          <dd>{process.certificationId || 'None'}</dd>
          <dt>Spec</dt>
          <dd>{process.spec}</dd>
          <dt>Comments</dt>
          <dd>{process.comments}</dd>
        </dl>
      )}
    </section>
  );
}
```

Create `src/modules/order-entry/tabs/StepsTab.tsx` with:

```tsx
import { processMasters } from '../../../data/seed';
import type { Order } from '../../../domain/types';

interface StepsTabProps {
  order: Order;
}

export function StepsTab({ order }: StepsTabProps) {
  const process = processMasters.find((item) => item.id === order.processMasterId);

  if (!process) {
    return <section className="empty-state">Select a process master to view steps.</section>;
  }

  return (
    <section>
      <table className="data-table">
        <thead>
          <tr>
            <th>Seq</th>
            <th>Step</th>
            <th>Furnace</th>
            <th>Temp F</th>
            <th>Minutes</th>
          </tr>
        </thead>
        <tbody>
          {process.steps.map((step) => (
            <tr key={step.id}>
              <td>{step.sequence}</td>
              <td>{step.name}</td>
              <td>{step.furnace}</td>
              <td>{step.temperatureF}</td>
              <td>{step.minutes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
```

- [ ] **Step 6: Implement ActivityPanels**

Create `src/modules/order-entry/components/ActivityPanels.tsx` with:

```tsx
import type { Order } from '../../../domain/types';

interface ActivityPanelsProps {
  order: Order;
}

export function ActivityPanels({ order }: ActivityPanelsProps) {
  return (
    <aside className="activity-panels">
      <section>
        <h2>Order Notes</h2>
        {order.orderNotes.length === 0 ? <p>No order notes.</p> : order.orderNotes.map((note) => <p key={note.id}>{note.note}</p>)}
      </section>
      <section>
        <h2>Customer Notes</h2>
        {order.customerNotes.length === 0 ? <p>No customer notes.</p> : order.customerNotes.map((note) => <p key={note.id}>{note.note}</p>)}
      </section>
      <section>
        <h2>Order Events</h2>
        <table className="data-table">
          <tbody>
            {order.events.map((event) => (
              <tr key={event.id}>
                <td>{event.date}</td>
                <td>{event.code}</td>
                <td>{event.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h2>Customer Documents</h2>
        {order.documents.length === 0 ? <p>No customer documents.</p> : order.documents.map((doc) => <p key={doc.id}>{doc.fileName}</p>)}
      </section>
    </aside>
  );
}
```

- [ ] **Step 7: Wire tab panels and activity panels**

Update `OrderEntryModule.tsx` imports and replace the current tab-panel area with tab-specific components plus `ActivityPanels`.

Use this render helper inside `OrderEntryModule`:

```tsx
function renderActiveTab() {
  if (activeTab === 'Order Top') return <OrderTopTab order={order} onOrderChange={setOrder} />;
  if (activeTab === 'Detail') return <DetailTab order={order} />;
  if (activeTab === 'Process') return <ProcessTab order={order} onOrderChange={setOrder} />;
  if (activeTab === 'Steps') return <StepsTab order={order} />;
  return <div className="empty-state">Parts entry will be added in the next task.</div>;
}
```

Update the workspace grid so the right column renders:

```tsx
<div className="right-column">
  <ReadinessChecklist result={readiness} onSelectTab={setActiveTab} />
  <ActivityPanels order={order} />
</div>
```

- [ ] **Step 8: Add form and panel styles**

Append to `src/styles.css`:

```css
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(260px, 1fr));
  gap: 10px;
  padding: 10px;
}

.form-grid label,
.process-panel label {
  display: grid;
  gap: 4px;
  font-weight: 700;
}

.form-grid input,
.form-grid select,
.process-panel select {
  height: 26px;
  border: 1px solid #a8a8a8;
  background: #fff;
}

.detail-panel,
.process-panel,
.empty-state {
  padding: 10px;
}

dl {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 6px 12px;
}

dt {
  font-weight: 700;
}

.right-column {
  display: grid;
  gap: 8px;
  align-content: start;
}

.activity-panels {
  display: grid;
  gap: 8px;
}

.activity-panels section {
  min-height: 110px;
  border: 1px solid #c7b6a6;
  background: #ffffff;
}

.activity-panels h2 {
  margin: 0;
  padding: 5px 8px;
  font-size: 14px;
  background: #fbf3eb;
  border-bottom: 1px solid #c7b6a6;
}

.activity-panels p {
  margin: 8px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
}

.data-table th,
.data-table td {
  border: 1px solid #c8c8c8;
  padding: 4px 6px;
  text-align: left;
}
```

- [ ] **Step 9: Run interaction test and watch it pass**

Run:

```bash
npm test src/modules/order-entry/OrderEntryModule.test.tsx
```

Expected: PASS including customer/process/steps interaction.

- [ ] **Step 10: Commit tab and activity panels**

Run:

```bash
git add src/modules/order-entry src/styles.css
git commit -m "feat: add order entry tabs and activity panels"
```

## Task 7: Implement Parts Tab, Totals, And Release Blocking

**Files:**
- Create: `src/modules/order-entry/tabs/PartsTab.tsx`
- Modify: `src/modules/order-entry/OrderEntryModule.tsx`
- Modify: `src/styles.css`
- Modify: `src/modules/order-entry/OrderEntryModule.test.tsx`

- [ ] **Step 1: Add parts interaction test**

Append this test to `src/modules/order-entry/OrderEntryModule.test.tsx`:

```tsx
it('adds container rows, updates totals, and blocks release when required data is missing', async () => {
  const user = userEvent.setup();
  render(<OrderEntryModule currentUser={users[0]} />);

  await user.click(screen.getByRole('button', { name: /new order/i }));
  await user.click(screen.getByRole('button', { name: /check/i }));
  expect(screen.getByText('Assigned customer')).toBeInTheDocument();

  await user.click(screen.getByRole('tab', { name: 'Parts' }));
  await user.click(screen.getByRole('button', { name: /add container/i }));
  expect(screen.getByText('Container Totals')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test and watch it fail**

Run:

```bash
npm test src/modules/order-entry/OrderEntryModule.test.tsx
```

Expected: FAIL because `PartsTab` is not implemented.

- [ ] **Step 3: Implement PartsTab**

Create `src/modules/order-entry/tabs/PartsTab.tsx` with:

```tsx
import { calculateContainerNetWeight, calculateOrderWeights } from '../../../domain/weights';
import type { Container, Order, PartLine } from '../../../domain/types';

interface PartsTabProps {
  order: Order;
  onOrderChange: (order: Order) => void;
}

const emptyContainer = (): Container => ({
  id: crypto.randomUUID(),
  type: 'Skid',
  count: 1,
  quantity: 0,
  grossWeight: 0,
  tareWeight: 0,
  containerId: '',
});

const emptyPart = (): PartLine => ({
  id: crypto.randomUUID(),
  partNumber: '',
  customerPartNumber: '',
  description: '',
  quantity: 0,
  eachWeight: 0,
  material: '',
  thickness: 0,
  verified: false,
});

export function PartsTab({ order, onOrderChange }: PartsTabProps) {
  const totals = calculateOrderWeights(order);

  function updateContainer(id: string, patch: Partial<Container>) {
    onOrderChange({
      ...order,
      containers: order.containers.map((container) => (container.id === id ? { ...container, ...patch } : container)),
    });
  }

  function updatePart(id: string, patch: Partial<PartLine>) {
    onOrderChange({
      ...order,
      parts: order.parts.map((part) => (part.id === id ? { ...part, ...patch } : part)),
    });
  }

  return (
    <section className="parts-tab">
      <div className="parts-actions">
        <button type="button" onClick={() => onOrderChange({ ...order, containers: [...order.containers, emptyContainer()] })}>Add Container</button>
        <button type="button" onClick={() => onOrderChange({ ...order, parts: [...order.parts, emptyPart()] })}>Add Part</button>
      </div>
      <h2>Containers</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Type</th>
            <th># of cont.</th>
            <th>Qty</th>
            <th>Gross Wt</th>
            <th>Tare</th>
            <th>Net Wt</th>
            <th>Container Id No.</th>
            <th>Remove</th>
          </tr>
        </thead>
        <tbody>
          {order.containers.map((container) => (
            <tr key={container.id}>
              <td><input value={container.type} onChange={(event) => updateContainer(container.id, { type: event.target.value })} /></td>
              <td><input type="number" value={container.count} onChange={(event) => updateContainer(container.id, { count: Number(event.target.value) })} /></td>
              <td><input type="number" value={container.quantity} onChange={(event) => updateContainer(container.id, { quantity: Number(event.target.value) })} /></td>
              <td><input type="number" value={container.grossWeight} onChange={(event) => updateContainer(container.id, { grossWeight: Number(event.target.value) })} /></td>
              <td><input type="number" value={container.tareWeight} onChange={(event) => updateContainer(container.id, { tareWeight: Number(event.target.value) })} /></td>
              <td>{calculateContainerNetWeight(container).toFixed(2)}</td>
              <td><input value={container.containerId} onChange={(event) => updateContainer(container.id, { containerId: event.target.value })} /></td>
              <td><button type="button" onClick={() => onOrderChange({ ...order, containers: order.containers.filter((item) => item.id !== container.id) })}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Parts</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Part #</th>
            <th>Customer #</th>
            <th>Description</th>
            <th>Qty</th>
            <th>Each Wt</th>
            <th>Total Wt</th>
            <th>Material</th>
            <th>Thickness</th>
            <th>Verified</th>
            <th>Remove</th>
          </tr>
        </thead>
        <tbody>
          {order.parts.map((part) => (
            <tr key={part.id}>
              <td><input value={part.partNumber} onChange={(event) => updatePart(part.id, { partNumber: event.target.value })} /></td>
              <td><input value={part.customerPartNumber} onChange={(event) => updatePart(part.id, { customerPartNumber: event.target.value })} /></td>
              <td><input value={part.description} onChange={(event) => updatePart(part.id, { description: event.target.value })} /></td>
              <td><input type="number" value={part.quantity} onChange={(event) => updatePart(part.id, { quantity: Number(event.target.value) })} /></td>
              <td><input type="number" value={part.eachWeight} onChange={(event) => updatePart(part.id, { eachWeight: Number(event.target.value) })} /></td>
              <td>{(part.quantity * part.eachWeight).toFixed(2)}</td>
              <td><input value={part.material} onChange={(event) => updatePart(part.id, { material: event.target.value })} /></td>
              <td><input type="number" value={part.thickness} onChange={(event) => updatePart(part.id, { thickness: Number(event.target.value) })} /></td>
              <td><input type="checkbox" checked={part.verified} onChange={(event) => updatePart(part.id, { verified: event.target.checked })} /></td>
              <td><button type="button" onClick={() => onOrderChange({ ...order, parts: order.parts.filter((item) => item.id !== part.id) })}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <section className="totals-panel">
        <h2>Container Totals</h2>
        <p>Qty: {totals.containerQuantity}</p>
        <p>Gross: {totals.containerGrossWeight.toFixed(2)}</p>
        <p>Tare: {totals.containerTareWeight.toFixed(2)}</p>
        <p>Net: {totals.containerNetWeight.toFixed(2)}</p>
        <h2>Total Parts</h2>
        <p>Qty: {totals.partQuantity}</p>
        <p>Pounds: {totals.partWeight.toFixed(2)}</p>
        {totals.hasMismatch && <p className="warning">Container totals and part totals do not match.</p>}
      </section>
    </section>
  );
}
```

- [ ] **Step 4: Wire PartsTab and release messages**

In `OrderEntryModule.tsx`, import `PartsTab` and change the `renderActiveTab` fallback:

```tsx
if (activeTab === 'Parts') return <PartsTab order={order} onOrderChange={setOrder} />;
```

Change `onCheck` to add a detailed blocked event:

```tsx
onCheck={() => {
  const description = readiness.ready
    ? 'Order is ready to release'
    : `Missing: ${readiness.missing.map((item) => item.label).join(', ')}`;
  addEvent(readiness.ready ? 'Ready Check' : 'Blocked Check', description);
}}
```

- [ ] **Step 5: Add parts styles**

Append to `src/styles.css`:

```css
.parts-tab {
  padding: 10px;
}

.parts-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.parts-tab input {
  width: 100%;
  min-width: 70px;
  border: 1px solid #aaa;
}

.totals-panel {
  display: grid;
  grid-template-columns: repeat(4, minmax(120px, 1fr));
  gap: 8px;
  margin-top: 12px;
  padding: 8px;
  border: 1px solid #aaa;
  background: #fffdf2;
}

.totals-panel h2 {
  margin: 0;
  font-size: 14px;
}

.warning {
  grid-column: 1 / -1;
  color: #8a4b00;
  font-weight: 700;
}
```

- [ ] **Step 6: Run module tests and domain tests**

Run:

```bash
npm test src/domain src/modules/order-entry/OrderEntryModule.test.tsx
```

Expected: PASS for domain and module tests.

- [ ] **Step 7: Commit parts tab and release blocking**

Run:

```bash
git add src/modules/order-entry src/styles.css
git commit -m "feat: add order entry parts workflow"
```

## Task 8: Finalize Visual Fit, Build, And Commit

**Files:**
- Modify: `src/styles.css`
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-06-29-order-entry-design.md` only if implementation reveals a confirmed spec correction.

- [ ] **Step 1: Add README**

Create `README.md` with:

````md
# HeatSynQ

HeatSynQ is a heat-treating-first ERP prototype. The first module is Order Entry, modeled from the Visual Shop receiving/order-entry workflow.

## Local Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run lint
npm test
npm run build
```

## First Module

The first interactive module is `Order Entry`. Access is controlled by the module permission named `Order Entry`.
````

- [ ] **Step 2: Run full verification**

Run:

```bash
npm run lint
npm test
npm run build
```

Expected:

- `npm run lint` exits 0.
- `npm test` exits 0.
- `npm run build` exits 0.

- [ ] **Step 3: Run the dev server for visual review**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Expected: Vite prints a local URL. Open the URL and verify:

- Toolbar is visible.
- Tabs are `Order Top`, `Detail`, `Parts`, `Process`, and `Steps`.
- `Assembly` and `Inventory` are absent.
- Right-side readiness and activity panels are visible.
- Parts totals update after editing container or part rows.
- Check action records blocked or ready events.

- [ ] **Step 4: Commit final prototype**

Run:

```bash
git add README.md src package.json package-lock.json index.html tsconfig.json vite.config.ts
git commit -m "feat: complete order entry prototype"
```

- [ ] **Step 5: Push branch**

Run:

```bash
git push
```

Expected: `main` pushes to `origin/main`.

## Plan Self-Review

- Spec coverage: the plan implements module permission gating, Visual Shop-style toolbar/tabs/panels, five active tabs, readiness validation, weight totals, seeded process master selection, events, tests, and excludes the named non-goals.
- Ambiguity resolved: process master selection is order-level for the first slice.
- Type consistency: `Order`, `Container`, `PartLine`, `ProcessMaster`, `OrderEvent`, `Note`, and `DocumentReference` are introduced in Task 2 and reused consistently in later tasks.
