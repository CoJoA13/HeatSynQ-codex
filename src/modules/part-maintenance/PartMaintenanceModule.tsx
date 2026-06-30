import { useMemo, useState } from 'react';
import { ModuleGate } from '../../components/ModuleGate';
import {
  customerParts as seededCustomerParts,
  customers,
  plantSupportDictionaryEntries as seededPlantSupportDictionaryEntries,
  processMasters as seededProcessMasters,
  processRevisions as seededProcessRevisions,
} from '../../data/seed';
import { getPartOrderEntryStatus, validateCustomerPart } from '../../domain/masterData';
import type {
  CustomerPart,
  PartPriceSummary,
  PartQuoteSummary,
  PlantSupportDictionaryEntry,
  ProcessMaster,
  ProcessRevision,
  User,
} from '../../domain/types';

interface PartMaintenanceModuleProps {
  currentUser: User;
  parts?: CustomerPart[];
  onPartsChange?: (parts: CustomerPart[]) => void;
  processMasters?: ProcessMaster[];
  processRevisions?: ProcessRevision[];
  plantSupportDictionaryEntries?: PlantSupportDictionaryEntry[];
}

type PartTextField = Pick<
  CustomerPart,
  | 'partId'
  | 'customerId'
  | 'processMasterId'
  | 'partName'
  | 'description'
  | 'outgoingPartNumber'
  | 'blanketPo'
  | 'revision'
  | 'material'
  | 'specification'
  | 'customerSpecification'
  | 'certFormat'
  | 'notes'
>;

type PartBooleanField = Pick<CustomerPart, 'inactive' | 'partHold' | 'shippingHold' | 'certRequired'>;

type PriceTextField = Pick<PartPriceSummary, 'pricePer'>;
type QuoteTextField = Pick<PartQuoteSummary, 'quoteId'>;

const cloneParts = (): CustomerPart[] => structuredClone(seededCustomerParts);

function createBlankPart(): CustomerPart {
  return {
    id: `part-${crypto.randomUUID()}`,
    partId: '',
    customerId: '',
    processMasterId: '',
    processRevisionId: '',
    partName: '',
    description: '',
    outgoingPartNumber: '',
    blanketPo: '',
    revision: '',
    material: '',
    specification: '',
    customerSpecification: '',
    certFormat: '',
    certRequired: false,
    eachWeight: 0,
    thickness: 0,
    inactive: false,
    partHold: false,
    shippingHold: false,
    price: {
      setup: 0,
      amount: 0,
      pricePer: 'Lb',
      minimum: 0,
    },
    quote: {
      quoteId: '',
      quotedQuantity: 0,
      effectiveDate: '',
      expirationDate: '',
      contact: '',
      salesPerson: '',
    },
    notes: '',
  };
}

function getCustomerName(customerId: string): string {
  return customers.find((customer) => customer.id === customerId)?.name ?? 'Unassigned customer';
}

export function PartMaintenanceModule({
  currentUser,
  parts,
  onPartsChange,
  processMasters,
  processRevisions,
  plantSupportDictionaryEntries,
}: PartMaintenanceModuleProps) {
  const [localParts, setLocalParts] = useState<CustomerPart[]>(cloneParts);
  const [selectedPartId, setSelectedPartId] = useState(seededCustomerParts[0]?.id ?? '');
  const [draft, setDraft] = useState<CustomerPart>(() =>
    structuredClone(seededCustomerParts[0] ?? createBlankPart()),
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [validationMessages, setValidationMessages] = useState<string[]>([]);
  const [saveSummary, setSaveSummary] = useState('');
  const effectiveParts = parts ?? localParts;
  const updateParts = onPartsChange ?? setLocalParts;
  const effectiveProcessMasters = processMasters ?? seededProcessMasters;
  const effectiveProcessRevisions = processRevisions ?? seededProcessRevisions;
  const effectiveDictionaries = plantSupportDictionaryEntries ?? seededPlantSupportDictionaryEntries;

  const filteredParts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();

    return effectiveParts.filter((part) => {
      if (!includeInactive && part.inactive) return false;
      if (!normalizedQuery) return true;

      const searchableText =
        `${part.partId} ${part.partName} ${part.description} ${getCustomerName(part.customerId)}`.toLocaleLowerCase();
      return searchableText.includes(normalizedQuery);
    });
  }, [effectiveParts, includeInactive, searchQuery]);

  const orderEntryStatus = useMemo(
    () => getPartOrderEntryStatus(draft, effectiveProcessMasters),
    [draft, effectiveProcessMasters],
  );

  function selectPart(part: CustomerPart) {
    setSelectedPartId(part.id);
    setDraft(structuredClone(part));
    setValidationMessages([]);
    setSaveSummary('');
  }

  function createPart() {
    const blankPart = createBlankPart();
    setSelectedPartId('');
    setDraft(blankPart);
    setValidationMessages([]);
    setSaveSummary('');
  }

  function clearDraftFeedback() {
    setValidationMessages([]);
    setSaveSummary('');
  }

  function updateDraftField<FieldName extends keyof PartTextField>(
    fieldName: FieldName,
    value: CustomerPart[FieldName],
  ) {
    setDraft((currentDraft) => ({ ...currentDraft, [fieldName]: value }));
    clearDraftFeedback();
  }

  function updateDraftBoolean<FieldName extends keyof PartBooleanField>(
    fieldName: FieldName,
    value: CustomerPart[FieldName],
  ) {
    setDraft((currentDraft) => ({ ...currentDraft, [fieldName]: value }));
    clearDraftFeedback();
  }

  function updateDraftNumber(fieldName: 'eachWeight' | 'thickness', value: number) {
    setDraft((currentDraft) => ({ ...currentDraft, [fieldName]: value }));
    clearDraftFeedback();
  }

  function updatePrice<FieldName extends keyof PriceTextField>(fieldName: FieldName, value: PartPriceSummary[FieldName]) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      price: { ...currentDraft.price, [fieldName]: value },
    }));
    clearDraftFeedback();
  }

  function updatePriceNumber(fieldName: 'setup' | 'amount' | 'minimum', value: number) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      price: { ...currentDraft.price, [fieldName]: value },
    }));
    clearDraftFeedback();
  }

  function updateQuote<FieldName extends keyof QuoteTextField>(fieldName: FieldName, value: PartQuoteSummary[FieldName]) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      quote: { ...currentDraft.quote, [fieldName]: value },
    }));
    clearDraftFeedback();
  }

  function updateQuoteNumber(fieldName: 'quotedQuantity', value: number) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      quote: { ...currentDraft.quote, [fieldName]: value },
    }));
    clearDraftFeedback();
  }

  function savePart() {
    const result = validateCustomerPart(draft, effectiveParts, effectiveProcessMasters);
    const messages = [...result.errors, ...result.warnings];

    if (!result.valid) {
      setValidationMessages(messages);
      setSaveSummary('');
      return;
    }

    const savedPart = structuredClone(draft);
    const existingPartId = selectedPartId || savedPart.id;
    const existingIndex = effectiveParts.findIndex((part) => part.id === existingPartId);
    const nextParts =
      existingIndex === -1
        ? [...effectiveParts, savedPart]
        : effectiveParts.map((part, index) => (index === existingIndex ? savedPart : part));

    updateParts(nextParts);
    setSelectedPartId(savedPart.id);
    setValidationMessages(result.warnings);
    setSaveSummary('Part saved.');
  }

  return (
    <ModuleGate user={currentUser} permission="Part Maintenance" moduleName="Part Maintenance">
      <section className="master-data-module part-maintenance-module" aria-labelledby="part-maintenance-title">
        <header className="master-data-header">
          <div>
            <p className="module-label">Master Data</p>
            <h1 id="part-maintenance-title">Part Maintenance</h1>
          </div>
          <div className="toolbar-group">
            <button className="toolbar-button" type="button" onClick={createPart}>
              New Part
            </button>
            <button className="toolbar-button toolbar-button-primary" type="button" onClick={savePart}>
              Save Part
            </button>
          </div>
        </header>

        <div className="master-data-workspace">
          <aside className="master-list-panel" aria-label="Part list">
            <label className="master-search-field">
              Search parts
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="ID, name, or customer"
              />
            </label>
            <label className="show-inactive-toggle">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(event) => setIncludeInactive(event.target.checked)}
              />
              Include inactive
            </label>
            <div className="simple-list">
              {filteredParts.map((part) => (
                <button
                  className="simple-list-row"
                  type="button"
                  key={part.id}
                  onClick={() => selectPart(part)}
                  aria-current={selectedPartId === part.id ? 'true' : undefined}
                  aria-label={`${part.partId} ${part.partName}`}
                >
                  <strong>{part.partId}</strong>
                  <span>{part.partName || 'Unnamed part'}</span>
                </button>
              ))}
            </div>
          </aside>

          <section className="master-detail-panel" aria-label="Part detail">
            {validationMessages.length > 0 && (
              <div className="validation-summary" role="alert">
                {validationMessages.map((message) => (
                  <p key={message}>{message}</p>
                ))}
              </div>
            )}
            {saveSummary && <p className="save-summary">{saveSummary}</p>}

            <section className="master-section" aria-labelledby="part-overview-heading">
              <h2 id="part-overview-heading">Overview</h2>
              <div className="master-form-grid">
                <label>
                  Part ID
                  <input value={draft.partId} onChange={(event) => updateDraftField('partId', event.target.value)} />
                </label>
                <label>
                  Part name
                  <input
                    value={draft.partName}
                    onChange={(event) => updateDraftField('partName', event.target.value)}
                  />
                </label>
                <label>
                  Description
                  <input
                    value={draft.description}
                    onChange={(event) => updateDraftField('description', event.target.value)}
                  />
                </label>
                <label>
                  Customer
                  <select value={draft.customerId} onChange={(event) => updateDraftField('customerId', event.target.value)}>
                    <option value="">Select customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Blanket PO
                  <input
                    value={draft.blanketPo}
                    onChange={(event) => updateDraftField('blanketPo', event.target.value)}
                  />
                </label>
                <label>
                  Revision
                  <input value={draft.revision} onChange={(event) => updateDraftField('revision', event.target.value)} />
                </label>
                <label>
                  Outgoing part number
                  <input
                    value={draft.outgoingPartNumber}
                    onChange={(event) => updateDraftField('outgoingPartNumber', event.target.value)}
                  />
                </label>
              </div>
              <div className="checkbox-strip">
                <label>
                  <input
                    type="checkbox"
                    checked={draft.inactive}
                    onChange={(event) => updateDraftBoolean('inactive', event.target.checked)}
                  />
                  Inactive
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={draft.partHold}
                    onChange={(event) => updateDraftBoolean('partHold', event.target.checked)}
                  />
                  Part hold
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={draft.shippingHold}
                    onChange={(event) => updateDraftBoolean('shippingHold', event.target.checked)}
                  />
                  Shipping hold
                </label>
              </div>
            </section>

            <section className="master-section" aria-labelledby="part-process-heading">
              <h2 id="part-process-heading">Process And Requirements</h2>
              <div className="master-form-grid">
                <label>
                  Process master
                  <select
                    value={draft.processMasterId}
                    onChange={(event) => updateDraftField('processMasterId', event.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {effectiveProcessMasters.map((processMaster) => (
                      <option key={processMaster.id} value={processMaster.id}>
                        {processMaster.id} - {processMaster.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Material
                  <input value={draft.material} onChange={(event) => updateDraftField('material', event.target.value)} />
                </label>
                <label>
                  Specification
                  <input
                    value={draft.specification}
                    onChange={(event) => updateDraftField('specification', event.target.value)}
                  />
                </label>
                <label>
                  Customer specification
                  <input
                    value={draft.customerSpecification}
                    onChange={(event) => updateDraftField('customerSpecification', event.target.value)}
                  />
                </label>
                <label>
                  Cert format
                  <input
                    value={draft.certFormat}
                    onChange={(event) => updateDraftField('certFormat', event.target.value)}
                  />
                </label>
                <label>
                  Each weight
                  <input
                    type="number"
                    value={draft.eachWeight}
                    onChange={(event) => updateDraftNumber('eachWeight', event.target.valueAsNumber || 0)}
                  />
                </label>
                <label>
                  Thickness
                  <input
                    type="number"
                    value={draft.thickness}
                    onChange={(event) => updateDraftNumber('thickness', event.target.valueAsNumber || 0)}
                  />
                </label>
              </div>
              <div className="checkbox-strip">
                <label>
                  <input
                    type="checkbox"
                    checked={draft.certRequired}
                    onChange={(event) => updateDraftBoolean('certRequired', event.target.checked)}
                  />
                  Cert required
                </label>
              </div>
            </section>

            <section className="master-section" aria-labelledby="part-pricing-heading">
              <h2 id="part-pricing-heading">Pricing And Quote Summary</h2>
              <div className="master-form-grid">
                <label>
                  Setup
                  <input
                    type="number"
                    value={draft.price.setup}
                    onChange={(event) => updatePriceNumber('setup', event.target.valueAsNumber || 0)}
                  />
                </label>
                <label>
                  Simple price
                  <input
                    type="number"
                    value={draft.price.amount}
                    onChange={(event) => updatePriceNumber('amount', event.target.valueAsNumber || 0)}
                  />
                </label>
                <label>
                  Price per
                  <input value={draft.price.pricePer} onChange={(event) => updatePrice('pricePer', event.target.value)} />
                </label>
                <label>
                  Minimum
                  <input
                    type="number"
                    value={draft.price.minimum}
                    onChange={(event) => updatePriceNumber('minimum', event.target.valueAsNumber || 0)}
                  />
                </label>
                <label>
                  Quote ID
                  <input value={draft.quote.quoteId} onChange={(event) => updateQuote('quoteId', event.target.value)} />
                </label>
                <label>
                  Quoted quantity
                  <input
                    type="number"
                    value={draft.quote.quotedQuantity}
                    onChange={(event) => updateQuoteNumber('quotedQuantity', event.target.valueAsNumber || 0)}
                  />
                </label>
              </div>
            </section>

            <section className="master-section part-readiness-panel" aria-labelledby="part-order-entry-heading">
              <h2 id="part-order-entry-heading">Order Entry Use</h2>
              <p className={orderEntryStatus.ready ? 'readiness-ready' : 'readiness-blocked'}>
                {orderEntryStatus.ready ? 'Ready for Order Entry' : 'Not ready for Order Entry'}
              </p>
              {[...orderEntryStatus.blockers, ...orderEntryStatus.warnings].length > 0 ? (
                <ul className="simple-note-list">
                  {[...orderEntryStatus.blockers, ...orderEntryStatus.warnings].map((message) => (
                    <li key={message}>
                      <span>{message}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-copy">No readiness issues found.</p>
              )}
            </section>
          </section>
        </div>
      </section>
    </ModuleGate>
  );
}
