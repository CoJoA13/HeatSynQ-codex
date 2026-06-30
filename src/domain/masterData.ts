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

interface FilterPartsOptions {
  includeInactive?: boolean;
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

function hasProcessMaster(processMasterId: string, processMasters: ProcessMaster[]): boolean {
  const normalizedProcessId = normalize(processMasterId);
  return processMasters.some((process) => normalize(process.id) === normalizedProcessId);
}

export function validateCustomer(customer: Customer, otherCustomers: Customer[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (isBlank(customer.id)) errors.push('Customer ID is required.');
  if (isBlank(customer.name)) errors.push('Customer name is required.');

  const customerId = normalize(customer.id);
  if (customerId && otherCustomers.some((otherCustomer) => normalize(otherCustomer.id) === customerId)) {
    errors.push('Customer ID must be unique.');
  }

  if (isBlank(customer.orderRules.defaultReceivedFrom) || isBlank(customer.orderRules.defaultShipTo)) {
    warnings.push('Missing order defaults: received-from and ship-to.');
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateCustomerPart(
  part: CustomerPart,
  existingParts: CustomerPart[],
  processMasters: ProcessMaster[],
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (isBlank(part.partId)) errors.push('Part ID is required.');
  if (isBlank(part.customerId)) errors.push('Customer is required.');

  const partId = normalize(part.partId);
  const customerId = normalize(part.customerId);
  if (
    partId &&
    customerId &&
    existingParts.some(
      (existingPart) =>
        existingPart.id !== part.id &&
        normalize(existingPart.partId) === partId &&
        normalize(existingPart.customerId) === customerId,
    )
  ) {
    errors.push('Part ID must be unique for this customer.');
  }

  if (isBlank(part.processMasterId)) {
    warnings.push('Draft part is missing process master.');
  } else if (!hasProcessMaster(part.processMasterId, processMasters)) {
    errors.push('Process master reference is invalid.');
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function getPartOrderEntryStatus(part: CustomerPart, processMasters: ProcessMaster[]): PartOrderEntryStatus {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (part.inactive) blockers.push('Inactive parts do not appear in normal Order Entry search.');
  if (part.partHold) blockers.push('Part hold blocks Order Entry release.');

  if (isBlank(part.processMasterId)) {
    blockers.push('Missing process master.');
  } else if (!hasProcessMaster(part.processMasterId, processMasters)) {
    blockers.push('Process master reference is invalid.');
  }

  if (part.shippingHold) warnings.push('Shipping hold will block shipping readiness.');
  if (isBlank(part.material)) warnings.push('Material is missing.');
  if (isBlank(part.certFormat)) warnings.push('Cert format is missing.');
  if (part.eachWeight <= 0) warnings.push('Each weight is missing.');

  return { ready: blockers.length === 0, blockers, warnings };
}

export function filterPartsForCustomer(
  parts: CustomerPart[],
  customerId: string,
  options: FilterPartsOptions = {},
): CustomerPart[] {
  const normalizedCustomerId = normalize(customerId);

  return parts.filter((part) => {
    if (normalize(part.customerId) !== normalizedCustomerId) return false;
    return options.includeInactive === true || !part.inactive;
  });
}
