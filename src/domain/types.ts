export type ModulePermission = 'Order Entry' | 'Customer Maintenance' | 'Part Maintenance' | 'Process Maintenance';

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
  alphaKey: string;
  customerType: string;
  plant: string;
  terms: string;
  attention: string;
  region: string;
  rank: string;
  active: boolean;
  reviewRequired: boolean;
  cod: boolean;
  creditHold: boolean;
  orderRules: CustomerOrderRules;
  addresses: CustomerAddress[];
  contacts: CustomerContact[];
  requirements: CustomerRequirement[];
  documents: DocumentReference[];
}

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
  processRevisionId: string;
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

export type ProcessRevisionStatus = 'Active' | 'Draft';

export type PlantSupportDictionaryKind =
  | 'Process Code'
  | 'Equipment'
  | 'Group'
  | 'Cost Center'
  | 'Inspection Code'
  | 'Inspection Scale'
  | 'Table Key'
  | 'Standard Step Template';

export interface PlantSupportDictionaryEntry {
  id: string;
  kind: PlantSupportDictionaryKind;
  code: string;
  name: string;
  description: string;
  active: boolean;
  category: string;
}

export interface ProcessStep {
  id: string;
  sequence: number;
  name: string;
  tableKeyId: string;
  processCodeId: string;
  equipmentId: string;
  groupId: string;
  costCenterId: string;
  temperatureF: number;
  minutes: number;
  tolerance: string;
  atmosphere: string;
  quenchMedia: string;
  hardnessTarget: string;
  caseDepthTarget: string;
  instructions: string;
}

export interface ProcessInspectionRequirement {
  id: string;
  inspectionCodeId: string;
  inspectionScaleId: string;
  timing: string;
  frequency: string;
  required: boolean;
  targetValue: string;
  minimumValue: string;
  maximumValue: string;
  certVisible: boolean;
  notes: string;
}

export interface ProcessRevision {
  id: string;
  processMasterId: string;
  revision: number;
  status: ProcessRevisionStatus;
  effectiveDate: string;
  processCodeId: string;
  material: string;
  specification: string;
  certificationId: string;
  certFormat: string;
  notes: string;
  steps: ProcessStep[];
  inspections: ProcessInspectionRequirement[];
}

export interface ProcessMaster {
  id: string;
  name: string;
  activeRevisionId: string;
  draftRevisionId: string;
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
