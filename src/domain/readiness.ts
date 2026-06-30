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
