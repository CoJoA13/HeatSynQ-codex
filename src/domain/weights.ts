import type { Order } from './types';

const WEIGHT_MATCH_TOLERANCE = 0.000001;

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

export function hasNegativeContainerNetWeight(input: WeightInput): boolean {
  return input.grossWeight - input.tareWeight < 0;
}

function valuesMatch(left: number, right: number): boolean {
  return Math.abs(left - right) <= WEIGHT_MATCH_TOLERANCE;
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
    hasMismatch: !valuesMatch(containerQuantity, partQuantity) || !valuesMatch(containerNetWeight, partWeight),
  };
}
