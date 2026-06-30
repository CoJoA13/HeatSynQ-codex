import { describe, expect, it } from 'vitest';
import {
  filterPartsForCustomer,
  getPartOrderEntryStatus,
  validateCustomer,
  validateCustomerPart,
} from './masterData';
import type { Customer, CustomerPart, ProcessMaster } from './types';

const processMasters: ProcessMaster[] = [
  {
    id: '15-29900-003',
    name: 'Ductile Iron Austemper Route',
    activeRevisionId: 'proc-rev-austemper-16',
    draftRevisionId: '',
  },
];

function customer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 'cust-gfmco',
    name: 'GFMCO - Columbus LLC',
    phone: '800-328-8379',
    receivedFrom: 'GFMCO - Columbus LLC',
    shipTo: 'Max Coating',
    alphaKey: 'GFMCO',
    customerType: 'Production',
    plant: 'Columbus',
    terms: 'Net 30',
    attention: 'Receiving',
    region: 'Midwest',
    rank: 'A',
    active: true,
    reviewRequired: false,
    cod: false,
    creditHold: false,
    orderRules: {
      defaultReceivedFrom: 'GFMCO - Columbus LLC',
      defaultShipTo: 'Max Coating',
      requestDays: 5,
      targetDays: 7,
      poRequired: true,
      validateProcessCode: true,
      validateMaterial: true,
      defaultRoute: 'GFMCO Truck',
      defaultCarrier: 'Customer Pickup',
      defaultCertFormat: 'Standard C of C',
      certEveryOrder: false,
      notes: 'Use customer truck when available.',
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
    id: 'part-gfmco-tow',
    customerId: 'cust-gfmco',
    partId: '15-29900-010',
    processMasterId: '15-29900-003',
    processRevisionId: 'proc-rev-austemper-16',
    partName: 'CNTR TOW',
    description: 'Machined center tow component',
    outgoingPartNumber: '15-29900-010-OUT',
    blanketPo: '49499',
    revision: 'A',
    material: 'Ductile Iron',
    specification: 'ASTM A897',
    customerSpecification: 'Eq: 180; Gr: IQ',
    certFormat: 'Standard C of C',
    certRequired: false,
    eachWeight: 127,
    thickness: 0.25,
    inactive: false,
    partHold: false,
    shippingHold: false,
    price: {
      setup: 25,
      amount: 12.5,
      pricePer: 'Each',
      minimum: 75,
    },
    quote: {
      quoteId: 'Q-100',
      quotedQuantity: 100,
      effectiveDate: '2026-05-15',
      expirationDate: '2026-12-31',
      contact: 'Alex Morgan',
      salesPerson: 'Jordan Lee',
    },
    notes: '',
    ...overrides,
  };
}

describe('validateCustomer', () => {
  it('requires nonblank customer ID and name', () => {
    const result = validateCustomer(customer({ id: ' ', name: '' }), []);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(['Customer ID is required.', 'Customer name is required.']);
  });

  it('blocks duplicate customer ID case-insensitively and warns when order defaults are missing', () => {
    const result = validateCustomer(
      customer({
        id: 'CUST-GFMCO',
        orderRules: { ...customer().orderRules, defaultReceivedFrom: '', defaultShipTo: ' ' },
      }),
      [customer({ id: 'cust-gfmco' })],
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Customer ID must be unique.');
    expect(result.warnings).toContain('Missing order defaults: received-from and ship-to.');
  });
});

describe('validateCustomerPart', () => {
  it('requires part ID and customer', () => {
    const result = validateCustomerPart(part({ partId: '', customerId: ' ' }), [], processMasters);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(['Part ID is required.', 'Customer is required.']);
  });

  it('allows a draft part without a process master and returns a warning', () => {
    const result = validateCustomerPart(part({ processMasterId: '' }), [], processMasters);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual(['Draft part is missing process master.']);
  });

  it('blocks duplicate part ID for the same customer and invalid process references', () => {
    const result = validateCustomerPart(
      part({ id: 'part-copy', partId: '15-29900-010', processMasterId: 'missing-process' }),
      [part({ id: 'part-original', partId: '15-29900-010', customerId: 'CUST-GFMCO' })],
      processMasters,
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      'Part ID must be unique for this customer.',
      'Process master reference is invalid.',
    ]);
  });

  it('allows the same record id to keep its customer part ID', () => {
    const result = validateCustomerPart(
      part({ id: 'part-gfmco-tow', partId: '15-29900-010', customerId: 'cust-gfmco' }),
      [part({ id: 'part-gfmco-tow', partId: '15-29900-010', customerId: 'CUST-GFMCO' })],
      processMasters,
    );

    expect(result.valid).toBe(true);
    expect(result.errors).not.toContain('Part ID must be unique for this customer.');
  });
});

describe('getPartOrderEntryStatus', () => {
  it('reports a ready part without blockers or warnings', () => {
    expect(getPartOrderEntryStatus(part(), processMasters)).toEqual({
      ready: true,
      blockers: [],
      warnings: [],
    });
  });

  it('reports blockers and warnings that affect Order Entry release', () => {
    const result = getPartOrderEntryStatus(
      part({
        inactive: true,
        partHold: true,
        shippingHold: true,
        processMasterId: 'missing-process',
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
      'Process master reference is invalid.',
    ]);
    expect(result.warnings).toEqual([
      'Shipping hold will block shipping readiness.',
      'Material is missing.',
      'Cert format is missing.',
      'Each weight is missing.',
    ]);
  });

  it('blocks Order Entry release when the process master is blank', () => {
    const result = getPartOrderEntryStatus(part({ processMasterId: '' }), processMasters);

    expect(result.ready).toBe(false);
    expect(result.blockers).toContain('Missing process master.');
  });
});

describe('filterPartsForCustomer', () => {
  it('filters active parts for a customer by default', () => {
    const parts = [
      part({ id: 'active', inactive: false }),
      part({ id: 'inactive', inactive: true }),
      part({ id: 'other-customer', customerId: 'cust-amz' }),
    ];

    expect(filterPartsForCustomer(parts, 'CUST-GFMCO').map((entry) => entry.id)).toEqual(['active']);
  });

  it('includes inactive parts when requested', () => {
    const parts = [part({ id: 'active', inactive: false }), part({ id: 'inactive', inactive: true })];

    expect(filterPartsForCustomer(parts, 'cust-gfmco', { includeInactive: true }).map((entry) => entry.id)).toEqual([
      'active',
      'inactive',
    ]);
  });
});
