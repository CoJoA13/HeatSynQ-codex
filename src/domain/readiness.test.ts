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

  it('reports whitespace-only customer as missing', () => {
    const result = validateOrderReadiness({ ...readyOrder, customerId: '   ' }, user);
    expect(result.ready).toBe(false);
    expect(result.missing).toContainEqual({ key: 'customer', label: 'Assigned customer', tab: 'Order Top' });
  });

  it('reports missing container with the Parts tab', () => {
    const result = validateOrderReadiness({ ...readyOrder, containers: [] }, user);
    expect(result.ready).toBe(false);
    expect(result.missing).toContainEqual({ key: 'container', label: 'At least one container', tab: 'Parts' });
  });

  it('reports missing part with the Parts tab', () => {
    const result = validateOrderReadiness({ ...readyOrder, parts: [] }, user);
    expect(result.ready).toBe(false);
    expect(result.missing).toContainEqual({ key: 'part', label: 'At least one part', tab: 'Parts' });
  });

  it('reports missing quantity or weight with the Parts tab', () => {
    const result = validateOrderReadiness(
      {
        ...readyOrder,
        containers: [{ ...readyOrder.containers[0], quantity: 0, grossWeight: 0, tareWeight: 0 }],
        parts: [{ ...readyOrder.parts[0], quantity: 0, eachWeight: 0 }],
      },
      user,
    );
    expect(result.ready).toBe(false);
    expect(result.missing).toContainEqual({ key: 'quantityOrWeight', label: 'Quantity or weight', tab: 'Parts' });
  });

  it('reports missing process master with the Process tab', () => {
    const result = validateOrderReadiness({ ...readyOrder, processMasterId: '' }, user);
    expect(result.ready).toBe(false);
    expect(result.missing).toContainEqual({ key: 'processMaster', label: 'Existing process master', tab: 'Process' });
  });

  it('reports whitespace-only process master as missing', () => {
    const result = validateOrderReadiness({ ...readyOrder, processMasterId: '   ' }, user);
    expect(result.ready).toBe(false);
    expect(result.missing).toContainEqual({ key: 'processMaster', label: 'Existing process master', tab: 'Process' });
  });

  it('reports missing module permission', () => {
    const result = validateOrderReadiness(readyOrder, { id: 'u2', name: 'Viewer', permissions: [] });
    expect(result.ready).toBe(false);
    expect(result.missing).toContainEqual({ key: 'clearance', label: 'Order Entry permission', tab: 'Order Top' });
  });
});
