import { useMemo, useState } from 'react';
import { ModuleGate } from '../../components/ModuleGate';
import { customerParts, customers as seededCustomers } from '../../data/seed';
import { filterPartsForCustomer, validateCustomer } from '../../domain/masterData';
import type { Customer, CustomerOrderRules, CustomerPart, User } from '../../domain/types';

interface CustomerMaintenanceModuleProps {
  currentUser: User;
}

type CustomerTextField = Pick<
  Customer,
  'id' | 'name' | 'customerType' | 'plant' | 'phone' | 'terms' | 'receivedFrom' | 'shipTo'
>;

type CustomerBooleanField = Pick<Customer, 'active' | 'reviewRequired' | 'cod' | 'creditHold'>;

type OrderRuleTextField = Pick<
  CustomerOrderRules,
  'defaultReceivedFrom' | 'defaultShipTo' | 'defaultCarrier' | 'defaultCertFormat'
>;

type OrderRuleBooleanField = Pick<
  CustomerOrderRules,
  'poRequired' | 'validateProcessCode' | 'validateMaterial' | 'certEveryOrder'
>;

const cloneCustomers = (): Customer[] => structuredClone(seededCustomers);

function getLinkedPartStatus(part: CustomerPart): string {
  if (part.inactive) return 'Inactive';
  if (part.partHold) return 'Part hold';
  if (part.shippingHold) return 'Shipping hold';
  return 'Active';
}

function createBlankCustomer(): Customer {
  return {
    id: '',
    name: '',
    phone: '',
    receivedFrom: '',
    shipTo: '',
    alphaKey: '',
    customerType: '',
    plant: '',
    terms: '',
    attention: '',
    region: '',
    rank: '',
    active: true,
    reviewRequired: false,
    cod: false,
    creditHold: false,
    orderRules: {
      defaultReceivedFrom: '',
      defaultShipTo: '',
      requestDays: 0,
      targetDays: 0,
      poRequired: false,
      validateProcessCode: false,
      validateMaterial: false,
      defaultRoute: '',
      defaultCarrier: '',
      defaultCertFormat: '',
      certEveryOrder: false,
      notes: '',
    },
    addresses: [],
    contacts: [],
    requirements: [],
    documents: [],
  };
}

export function CustomerMaintenanceModule({ currentUser }: CustomerMaintenanceModuleProps) {
  const [customers, setCustomers] = useState<Customer[]>(cloneCustomers);
  const [selectedCustomerId, setSelectedCustomerId] = useState(seededCustomers[0]?.id ?? '');
  const [draft, setDraft] = useState<Customer>(() => structuredClone(seededCustomers[0] ?? createBlankCustomer()));
  const [searchQuery, setSearchQuery] = useState('');
  const [validationMessages, setValidationMessages] = useState<string[]>([]);
  const [saveSummary, setSaveSummary] = useState('');

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();

    if (!normalizedQuery) return customers;

    return customers.filter((customer) => {
      const searchableText = `${customer.id} ${customer.name}`.toLocaleLowerCase();
      return searchableText.includes(normalizedQuery);
    });
  }, [customers, searchQuery]);

  const linkedParts = useMemo(
    () => filterPartsForCustomer(customerParts, draft.id, { includeInactive: true }),
    [draft.id],
  );

  function selectCustomer(customer: Customer) {
    setSelectedCustomerId(customer.id);
    setDraft(structuredClone(customer));
    setValidationMessages([]);
    setSaveSummary('');
  }

  function createCustomer() {
    const blankCustomer = createBlankCustomer();
    setSelectedCustomerId('');
    setDraft(blankCustomer);
    setValidationMessages([]);
    setSaveSummary('');
  }

  function cancelEdits() {
    const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId);
    setDraft(structuredClone(selectedCustomer ?? createBlankCustomer()));
    setValidationMessages([]);
    setSaveSummary('');
  }

  function updateDraftField<FieldName extends keyof CustomerTextField>(fieldName: FieldName, value: Customer[FieldName]) {
    setDraft((currentDraft) => ({ ...currentDraft, [fieldName]: value }));
    setSaveSummary('');
  }

  function updateDraftBoolean<FieldName extends keyof CustomerBooleanField>(
    fieldName: FieldName,
    value: Customer[FieldName],
  ) {
    setDraft((currentDraft) => ({ ...currentDraft, [fieldName]: value }));
    setSaveSummary('');
  }

  function updateOrderRule<FieldName extends keyof OrderRuleTextField>(
    fieldName: FieldName,
    value: CustomerOrderRules[FieldName],
  ) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      orderRules: { ...currentDraft.orderRules, [fieldName]: value },
    }));
    setSaveSummary('');
  }

  function updateOrderRuleNumber(fieldName: 'requestDays' | 'targetDays', value: number) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      orderRules: { ...currentDraft.orderRules, [fieldName]: value },
    }));
    setSaveSummary('');
  }

  function updateOrderRuleBoolean<FieldName extends keyof OrderRuleBooleanField>(
    fieldName: FieldName,
    value: CustomerOrderRules[FieldName],
  ) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      orderRules: { ...currentDraft.orderRules, [fieldName]: value },
    }));
    setSaveSummary('');
  }

  function saveCustomer() {
    const otherCustomers = customers.filter((customer) => customer.id !== selectedCustomerId);
    const result = validateCustomer(draft, otherCustomers);
    const messages = [...result.errors, ...result.warnings];

    if (!result.valid) {
      setValidationMessages(messages);
      setSaveSummary('');
      return;
    }

    const savedCustomer = structuredClone(draft);
    setCustomers((currentCustomers) => {
      const existingIndex = currentCustomers.findIndex((customer) => customer.id === selectedCustomerId);
      if (existingIndex === -1) return [...currentCustomers, savedCustomer];

      return currentCustomers.map((customer, index) => (index === existingIndex ? savedCustomer : customer));
    });
    setSelectedCustomerId(savedCustomer.id);
    setValidationMessages(result.warnings);
    setSaveSummary('Customer saved.');
  }

  return (
    <ModuleGate user={currentUser} permission="Customer Maintenance" moduleName="Customer Maintenance">
      <section className="master-data-module customer-maintenance-module" aria-labelledby="customer-maintenance-title">
        <header className="master-data-header">
          <div>
            <p className="module-label">Master Data</p>
            <h1 id="customer-maintenance-title">Customer Maintenance</h1>
          </div>
          <div className="toolbar-group">
            <button className="toolbar-button" type="button" onClick={createCustomer}>
              New Customer
            </button>
            <button className="toolbar-button" type="button" onClick={cancelEdits}>
              Cancel Edits
            </button>
            <button className="toolbar-button toolbar-button-primary" type="button" onClick={saveCustomer}>
              Save Customer
            </button>
          </div>
        </header>

        <div className="master-data-workspace">
          <aside className="master-list-panel" aria-label="Customer list">
            <label className="master-search-field">
              Search customers
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="ID or name"
              />
            </label>
            <div className="simple-list">
              {filteredCustomers.map((customer) => (
                <button
                  className="simple-list-row"
                  type="button"
                  key={customer.id}
                  onClick={() => selectCustomer(customer)}
                  aria-current={selectedCustomerId === customer.id ? 'true' : undefined}
                  aria-label={`${customer.name} ${customer.id}`}
                >
                  <strong>{customer.name}</strong>
                  <span>{customer.id}</span>
                </button>
              ))}
            </div>
          </aside>

          <section className="master-detail-panel" aria-label="Customer detail">
            {validationMessages.length > 0 && (
              <div className="validation-summary" role="alert">
                {validationMessages.map((message) => (
                  <p key={message}>{message}</p>
                ))}
              </div>
            )}
            {saveSummary && <p className="save-summary">{saveSummary}</p>}

            <section className="master-section" aria-labelledby="customer-overview-heading">
              <h2 id="customer-overview-heading">Overview</h2>
              <div className="master-form-grid">
                <label>
                  Customer ID
                  <input
                    value={draft.id}
                    readOnly={selectedCustomerId !== ''}
                    onChange={(event) => updateDraftField('id', event.target.value)}
                  />
                </label>
                <label>
                  Customer name
                  <input value={draft.name} onChange={(event) => updateDraftField('name', event.target.value)} />
                </label>
                <label>
                  Customer type
                  <input
                    value={draft.customerType}
                    onChange={(event) => updateDraftField('customerType', event.target.value)}
                  />
                </label>
                <label>
                  Plant
                  <input value={draft.plant} onChange={(event) => updateDraftField('plant', event.target.value)} />
                </label>
                <label>
                  Phone
                  <input value={draft.phone} onChange={(event) => updateDraftField('phone', event.target.value)} />
                </label>
                <label>
                  Terms
                  <input value={draft.terms} onChange={(event) => updateDraftField('terms', event.target.value)} />
                </label>
              </div>
              <div className="checkbox-strip">
                <label>
                  <input
                    type="checkbox"
                    checked={draft.active}
                    onChange={(event) => updateDraftBoolean('active', event.target.checked)}
                  />
                  Active customer
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={draft.reviewRequired}
                    onChange={(event) => updateDraftBoolean('reviewRequired', event.target.checked)}
                  />
                  Review required
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={draft.cod}
                    onChange={(event) => updateDraftBoolean('cod', event.target.checked)}
                  />
                  COD customer
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={draft.creditHold}
                    onChange={(event) => updateDraftBoolean('creditHold', event.target.checked)}
                  />
                  Credit hold
                </label>
              </div>
            </section>

            <section className="master-section" aria-label="Order Rules">
              <h2>Order Rules</h2>
              <div className="master-form-grid">
                <label>
                  Default received from
                  <input
                    value={draft.orderRules.defaultReceivedFrom}
                    onChange={(event) => updateOrderRule('defaultReceivedFrom', event.target.value)}
                  />
                </label>
                <label>
                  Default ship to
                  <input
                    value={draft.orderRules.defaultShipTo}
                    onChange={(event) => updateOrderRule('defaultShipTo', event.target.value)}
                  />
                </label>
                <label>
                  Request days
                  <input
                    type="number"
                    value={draft.orderRules.requestDays}
                    onChange={(event) => updateOrderRuleNumber('requestDays', event.target.valueAsNumber || 0)}
                  />
                </label>
                <label>
                  Target days
                  <input
                    type="number"
                    value={draft.orderRules.targetDays}
                    onChange={(event) => updateOrderRuleNumber('targetDays', event.target.valueAsNumber || 0)}
                  />
                </label>
                <label>
                  Default carrier
                  <input
                    value={draft.orderRules.defaultCarrier}
                    onChange={(event) => updateOrderRule('defaultCarrier', event.target.value)}
                  />
                </label>
                <label>
                  Default cert format
                  <input
                    value={draft.orderRules.defaultCertFormat}
                    onChange={(event) => updateOrderRule('defaultCertFormat', event.target.value)}
                  />
                </label>
              </div>
              <div className="checkbox-strip">
                <label>
                  <input
                    type="checkbox"
                    checked={draft.orderRules.poRequired}
                    onChange={(event) => updateOrderRuleBoolean('poRequired', event.target.checked)}
                  />
                  PO required
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={draft.orderRules.validateProcessCode}
                    onChange={(event) => updateOrderRuleBoolean('validateProcessCode', event.target.checked)}
                  />
                  Validate process code
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={draft.orderRules.validateMaterial}
                    onChange={(event) => updateOrderRuleBoolean('validateMaterial', event.target.checked)}
                  />
                  Validate material
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={draft.orderRules.certEveryOrder}
                    onChange={(event) => updateOrderRuleBoolean('certEveryOrder', event.target.checked)}
                  />
                  Cert every order
                </label>
              </div>
            </section>

            <section className="master-section">
              <h2>Addresses And Contacts</h2>
              <div className="status-strip">
                <span>{draft.addresses.length} addresses</span>
                <span>{draft.contacts.length} contacts</span>
              </div>
            </section>

            <section className="master-section">
              <h2>Requirements And Notes</h2>
              {draft.requirements.length > 0 ? (
                <ul className="simple-note-list">
                  {draft.requirements.map((requirement) => (
                    <li key={requirement.id}>
                      <strong>{requirement.category}</strong>
                      <span>{requirement.text}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-copy">No requirements recorded.</p>
              )}
            </section>

            <section className="master-section">
              <h2>Linked Parts</h2>
              {linkedParts.length > 0 ? (
                <div className="table-scroll">
                  <table className="data-table linked-parts-table">
                    <thead>
                      <tr>
                        <th scope="col">Part ID</th>
                        <th scope="col">Part name</th>
                        <th scope="col">Process</th>
                        <th scope="col">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linkedParts.map((part) => (
                        <tr key={part.id}>
                          <td>{part.partId}</td>
                          <td>{part.partName}</td>
                          <td>{part.processMasterId || 'Unassigned'}</td>
                          <td>{getLinkedPartStatus(part)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-copy">No linked parts found.</p>
              )}
            </section>
          </section>
        </div>
      </section>
    </ModuleGate>
  );
}
