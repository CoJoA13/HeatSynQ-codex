import { describe, expect, it } from 'vitest';
import { calculateContainerNetWeight, calculateOrderWeights, hasNegativeContainerNetWeight } from './weights';
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

  it('detects negative net weight before clamping display totals', () => {
    expect(hasNegativeContainerNetWeight({ grossWeight: 20, tareWeight: 30 })).toBe(true);
    expect(hasNegativeContainerNetWeight({ grossWeight: 30, tareWeight: 20 })).toBe(false);
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

  it('does not flag tiny decimal precision differences as mismatches', () => {
    const totals = calculateOrderWeights({
      ...baseOrder,
      containers: [{ id: 'c1', type: 'Box', count: 1, quantity: 3, grossWeight: 0.3, tareWeight: 0, containerId: '' }],
      parts: [
        {
          id: 'p1',
          partNumber: 'A',
          customerPartNumber: 'A',
          description: 'Part A',
          quantity: 3,
          eachWeight: 0.1,
          material: 'Steel',
          thickness: 1,
          verified: true,
        },
      ],
    });

    expect(totals.containerNetWeight).toBe(0.3);
    expect(totals.partWeight).toBe(0.1 * 3);
    expect(totals.hasMismatch).toBe(false);
  });
});
