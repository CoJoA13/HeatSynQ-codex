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
