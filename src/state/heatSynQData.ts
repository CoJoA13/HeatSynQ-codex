import {
  customerParts,
  plantSupportDictionaryEntries,
  processMasters,
  processRevisions,
} from '../data/seed';
import type {
  CustomerPart,
  PlantSupportDictionaryEntry,
  ProcessMaster,
  ProcessRevision,
} from '../domain/types';

export interface HeatSynQDataState {
  customerParts: CustomerPart[];
  processMasters: ProcessMaster[];
  processRevisions: ProcessRevision[];
  plantSupportDictionaryEntries: PlantSupportDictionaryEntry[];
}

export function createInitialHeatSynQDataState(): HeatSynQDataState {
  return {
    customerParts: structuredClone(customerParts),
    processMasters: structuredClone(processMasters),
    processRevisions: structuredClone(processRevisions),
    plantSupportDictionaryEntries: structuredClone(plantSupportDictionaryEntries),
  };
}
