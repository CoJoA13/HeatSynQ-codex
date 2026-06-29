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
