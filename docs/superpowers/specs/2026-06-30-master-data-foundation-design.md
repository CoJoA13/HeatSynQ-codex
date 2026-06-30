# HeatSynQ Master Data Foundation Design

Date: 2026-06-30

## Summary

The next HeatSynQ slice is `Master Data Foundation`: two separate but linked modules named `Customer Maintenance` and `Part Maintenance`. This slice gives Order Entry a shared source of customer and customer-part truth before HeatSynQ moves deeper into process masters, tracking, shipping, certifications, invoicing, A/R, and reporting.

The design uses Visual Shop as workflow and data source material, not as a UI clone target. Visual Shop's customer and part screens are dense and powerful, but they also spread related decisions across many tabs, side buttons, program defaults, and custom fields. HeatSynQ should keep the useful operating concepts while regrouping the first slice around faster search, clearer status, fewer duplicate fields, and obvious readiness for Order Entry.

## Source References

Primary local references:

- `Visual Shop REFERENCES/VisualShopTraining.pdf`
- `Visual Shop REFERENCES/Maintain/Customer/Customer Landing.png`
- `Visual Shop REFERENCES/Maintain/Customer/Customer Selected.png`
- `Visual Shop REFERENCES/Maintain/Customer/Customer Control Left Nav 1.png`
- `Visual Shop REFERENCES/Maintain/Customer/Customer Control Left Nav 2.png`
- `Visual Shop REFERENCES/Maintain/Customer/Customer Control Left Nav 3.png`
- `Visual Shop REFERENCES/Maintain/Customer/Customer Control Left Nav 4.png`
- `Visual Shop REFERENCES/Maintain/Customer/Customer Control Left Nav 5.png`
- `Visual Shop REFERENCES/Part Maintenance/Part Maintenance after selecting part.png`
- `Visual Shop REFERENCES/Part Maintenance/Part Maintenance description tab.png`
- `Visual Shop REFERENCES/Part Maintenance/Part Maintenance Information tab.png`
- `Visual Shop REFERENCES/Part Maintenance/Part Maintenance Price tab.png`
- `Visual Shop REFERENCES/Part Maintenance/Part Maintenance Quote tab.png`
- `docs/superpowers/specs/2026-06-30-visual-shop-replacement-roadmap.md`

Relevant Visual Shop patterns:

- Customer Maintenance has a searchable customer list, selectable columns, customer identity fields, customer type/status flags, address/contact access, control rules, notes, requirements, documents, invoice controls, and customer-specific shipping/certification behavior.
- Customer Control includes order-facing rules such as default received-from and ship-to addresses, request and target day defaults, route/carrier defaults, PO requirements, process/material validation, certification defaults, weight/quantity deviation rules, shipping requirements, and customer notes/instructions.
- Part Maintenance has a list/detail workflow with retrieval options, filters for inactive parts and quote status, and search by part, name, process, or material.
- A normal part record requires part ID, customer, and process master. It can include part name, description, outgoing part number, revision, material, specification, certification format, pricing, quote information, inspections, process notes, user fields, part hold, shipping hold, inactive state, pictures, PDFs, and step overlays.
- Part records feed Order Entry: verified parts can bring in customer, part, process master, material, cert, weight, and pricing context.

## Goals

- Build `Customer Maintenance` and `Part Maintenance` as separate modules with their own named permissions.
- Link customers and parts through customer-specific part records.
- Give Order Entry a future-compatible path to use shared customer and part data instead of isolated seeded records.
- Include the customer and part fields needed for receiving, lookup, readiness, process selection, and heat-treating context.
- Make status and blocking conditions visible: inactive customers, customer review/COD/credit flags, inactive parts, part hold, shipping hold, and order readiness blockers.
- Include read-only or selectable process master and plant support references without building process editing yet.
- Keep the first master-data slice shallow enough to implement, test, and validate before backend persistence and production concurrency are added.

## Non-Goals

- No direct replication of Visual Shop's customer or part UI.
- No backend database, API, authentication, audit persistence, or multi-user conflict handling in this prototype slice. Those remain production architecture requirements.
- No full Process Foundation editing. Process masters and plant support options are read-only seeded references for this slice.
- No deep customer invoice control, A/R, customer-specific form designer, email automation, or Customer Expediting hub.
- No deep part pricing engines, bracket pricing, step pricing, assembly pricing, formulas, part step overlays, pictures/PDF upload, custom tab designer, required-field table maintenance, mass price changes, or part rework workflow.
- No full document archive. Seeded document references can be displayed as non-uploadable reference rows only.
- No action-level permission model beyond module access.

## Permission Model

Permissions stay user-assigned and module based:

- A user with `Customer Maintenance` permission can open the Customer Maintenance module.
- A user with `Part Maintenance` permission can open the Part Maintenance module.
- A user with both permissions can move between customer and part records.
- A user with `Order Entry` permission keeps access to the existing Order Entry module.
- Users do not receive roles. A user can have any combination of named permissions.

The first implementation should extend the existing permission type from `Order Entry` to include `Customer Maintenance` and `Part Maintenance`. Later phases can add action-level permissions only when a real workflow requires them, such as deleting records, changing financial fields, overriding holds, or editing process masters.

## Module Shape

HeatSynQ should grow from a single-module prototype into a small module shell:

- `Order Entry`
- `Customer Maintenance`
- `Part Maintenance`

Each module should use the same permission gate pattern. The shell should make module switching clear without turning the app into a marketing or landing page. The first screen after load should still feel like an operational ERP workspace.

### Customer Maintenance

Customer Maintenance should be organized around a searchable customer list and an editable customer detail workspace.

Core screen regions:

- Search/list pane with customer ID, name, customer type, plant, status flags, phone, default ship-to, and default received-from.
- Customer header showing customer ID, name, active/review/COD/credit status, and last changed metadata when available.
- `Overview` section for identity, contact summary, customer type, plant, address summary, phone, terms, attention, region, rank, and customer status.
- `Order Rules` section for defaults that affect receiving: default received-from, default ship-to, request days, target days, PO required, process/material validation, default route, default carrier, certification defaults, and key customer notes/instructions.
- `Addresses And Contacts` section showing address summaries, contact summaries, and email groups without building the full Visual Shop address editor yet.
- `Requirements And Notes` section for customer requirements, customer notes displayed during order entry/invoicing, shipping instructions, process instructions, inspection instructions, and quote instructions.
- `Linked Parts` section showing parts assigned to the customer, including part ID, part name, process master, material, cert format, inactive state, part hold, and shipping hold.

### Part Maintenance

Part Maintenance should be organized around a searchable customer-part list and an editable part detail workspace.

Core screen regions:

- Search/list pane with part ID, part name, customer, process master, material, cert format, price summary, quote status, inactive state, part hold, and shipping hold.
- Part header showing part ID, part name, customer, process master, revision, active/hold status, and Order Entry readiness.
- `Overview` section for part ID, part name, description, outgoing part number, customer, blanket/static PO, revision, active/inactive, part hold, shipping hold, and basic dimensional/weight fields.
- `Process And Requirements` section for process master reference, process code, group, equipment/cost-center reference labels, material, specification, customer specification, cert format, cert required flag, inspection summary, process notes, and customer requirements inherited from the linked customer.
- `Pricing And Quote Summary` section for simple price, setup, price per, minimum, quote ID, quote quantity, effective date, expiration date, sales/contact summary, and clear messaging that advanced pricing is deferred.
- `Order Entry Use` section showing whether the part can be selected in Order Entry and why not if blocked.

The first version should not copy Visual Shop's many part tabs one-for-one. The initial grouping should prioritize the questions a receiver or office user needs answered quickly: What is the part, who is the customer, what process does it use, what material/spec/cert rules apply, is it on hold, and can Order Entry use it?

## Workflow

### Customer Workflow

1. User opens `Customer Maintenance`.
2. Module gate checks for `Customer Maintenance` permission.
3. User searches or filters the customer list.
4. User selects an existing customer or creates a new customer.
5. User edits customer overview, order rules, addresses/contact summaries, notes, and requirements.
6. User saves or cancels changes.
7. The linked parts section updates from the shared customer-part relationship.

The first prototype can use seeded data and in-browser state. It should still model save/cancel behavior so the later backend can preserve the same interaction contract.

### Part Workflow

1. User opens `Part Maintenance`.
2. Module gate checks for `Part Maintenance` permission.
3. User searches or filters the part list by part ID, name, customer, process master, material, inactive state, hold state, or quote status.
4. User selects an existing part or creates a new customer-specific part.
5. User links the part to a customer and, when available, a process master reference.
6. User edits part overview, process/requirement basics, pricing/quote summary, and Order Entry readiness fields.
7. User saves or cancels changes.

Part records should be allowed to save as draft master data if they have a part ID and customer but no process master. They should not be considered `Order Entry ready` until the required Order Entry fields are present and no active blockers exist.

### Order Entry Integration Outcome

This slice does not need to refactor Order Entry immediately, but it must leave a clear contract for the next implementation phase:

- Order Entry customer lookup should eventually read from shared `Customer` records.
- Order Entry part lookup should eventually filter to parts linked to the selected customer.
- Inactive parts should not appear in normal Order Entry part search.
- Parts on part hold should show as blocked for release.
- Parts on shipping hold should show as blocked or warned for shipping readiness later.
- A part with a process master reference should be able to provide the process master to an order.
- Customer order rules should later feed readiness checks, including PO required, default dates, default addresses, process/material validation, certification defaults, and customer notes.

## Data Model

This spec describes the domain shape, not final database tables.

- `User`: existing application user with a set of enabled module permissions.
- `ModulePermission`: named permission union extended to `Order Entry`, `Customer Maintenance`, and `Part Maintenance`.
- `Customer`: customer identity, plant, customer type, active/review/COD/credit flags, billing/shipping status summary, phone, address summary, terms, attention, region, rank, and notes.
- `CustomerOrderRules`: order-facing defaults and requirements for a customer, including default received-from, default ship-to, request days, target days, PO required, process/material validation, default route, default carrier, certification defaults, deviation summary, and order-entry notes.
- `CustomerAddress`: address record linked to a customer with type such as ship-to, bill-to, received-from, or other.
- `CustomerContact`: contact record linked to a customer with name, title, phone, email, and notification flags.
- `CustomerRequirement`: customer-specific instruction or requirement with category such as shipping, process, inspection, quote, order, or certification.
- `CustomerDocumentReference`: seeded document reference linked to a customer for display only in the first prototype.
- `CustomerPart`: customer-specific part record with part ID, customer ID, process master ID, part name, description, outgoing part number, PO, revision, material, specification, cert format, each weight, dimensions, active/hold fields, pricing summary, quote summary, and notes.
- `PartStatus`: computed status for active, inactive, part hold, shipping hold, draft, and Order Entry readiness.
- `ProcessMasterReference`: read-only process master summary used by Part Maintenance and Order Entry.
- `PlantSupportOption`: read-only lookup option for material, specification, cert format, process code, group, equipment, cost center, carrier, route, price unit, and inspection codes.
- `MasterDataEvent`: in-memory event generated by saves, cancels, validation blocks, and status changes in the first prototype.

## Validation And Error Handling

Customer validation:

- Customer ID is required.
- Customer name is required.
- Customer ID must be unique.
- Active status must be explicit.
- Default received-from and ship-to can be empty in the first prototype, but the customer should show `Missing order defaults` when either is absent.
- PO required, process validation, material validation, and certification defaults should be visible as order-facing rules even if they are not enforced until the Order Entry refactor.

Part validation:

- Part ID is required.
- Customer is required.
- Customer plus part ID must be unique.
- Process master is required for `Order Entry ready`, but not for saving a draft part record.
- Inactive parts are not Order Entry ready.
- Part hold blocks Order Entry release readiness.
- Shipping hold should be visible now and feed shipping readiness later.
- Missing material, specification, cert format, each weight, pricing, or quote data should show warnings, not block saving.
- A process master reference must point to an existing seeded process master.

Errors should be direct and local to the section that needs attention. A persistent status/readiness area should summarize blockers and warnings so users do not have to hunt across tabs.

## UI And UX Principles

- Keep the workspace dense enough for office/admin work, but reduce Visual Shop's field overload by grouping related decisions into clear sections.
- Use searchable lists, sortable columns, and compact status chips for fast scanning.
- Keep action buttons predictable: new, search, save, cancel, erase/delete where safe, history, notes, and related-record navigation.
- Avoid nested card layouts. Use full-width work areas, grids, tabs or segmented sections, and compact panels.
- Avoid copying Visual Shop's color-heavy forms. Use restrained status color for active, review, COD, credit hold, inactive, part hold, shipping hold, missing defaults, and Order Entry ready.
- Prefer a read-only relationship panel over duplicating the same fields in multiple places.
- Show why a customer or part is not ready for Order Entry in plain language.
- Keep keyboard and screen-reader behavior in mind from the start: labeled controls, stable tab order, accessible validation text, and no reliance on color alone.

## Components

Expected implementation components:

- `AppShell`: module navigation and current user fixture.
- `ModuleGate`: reusable permission gate for module access.
- `CustomerMaintenanceModule`: owns customer list/detail state.
- `CustomerSearchList`: searchable customer table.
- `CustomerDetail`: customer edit workspace.
- `CustomerOverviewSection`
- `CustomerOrderRulesSection`
- `CustomerAddressContactSummary`
- `CustomerRequirementsSection`
- `LinkedPartsPanel`
- `PartMaintenanceModule`: owns part list/detail state.
- `PartSearchList`: searchable part table.
- `PartDetail`: part edit workspace.
- `PartOverviewSection`
- `PartProcessRequirementsSection`
- `PartPricingQuoteSection`
- `PartOrderEntryReadiness`
- `validateCustomer`
- `validateCustomerPart`
- `getPartOrderEntryStatus`
- `filterPartsForCustomer`

The implementation plan can adjust component names to fit the existing codebase, but the boundaries should stay clear: shared domain logic belongs in `src/domain`, seeded reference data belongs in `src/data`, and module UI belongs under `src/modules`.

## Testing Plan

Test coverage should include:

- Permission gate allows and blocks `Customer Maintenance` independently from `Order Entry`.
- Permission gate allows and blocks `Part Maintenance` independently from `Order Entry`.
- A user with multiple permissions can switch between enabled modules.
- Customer search filters by ID/name and preserves selected customer state.
- Customer validation blocks missing ID, missing name, and duplicate customer ID.
- Customer linked parts panel shows only parts for the selected customer.
- Part search filters by part ID, name, customer, process master, material, inactive state, and hold state.
- Part validation blocks missing part ID, missing customer, duplicate customer plus part ID, and invalid process master references.
- A part can save as a draft without process master but is not Order Entry ready.
- Inactive parts, part holds, and missing process masters produce the correct Order Entry readiness state.
- `filterPartsForCustomer` excludes inactive parts from normal Order Entry lookup.
- Existing Order Entry tests continue to pass after permission type and shared data changes.

## First Prototype Scope

The first implementation after this spec should be a browser prototype using seeded data and in-browser state:

- Add a simple module shell with `Order Entry`, `Customer Maintenance`, and `Part Maintenance`.
- Extend module permissions for the two new modules.
- Add seeded customers with order rules, address/contact summaries, requirements, and linked document references.
- Add seeded customer-specific parts with process master references, material/spec/cert basics, simple pricing/quote summaries, inactive and hold states, and readiness metadata.
- Build searchable list/detail screens for Customer Maintenance and Part Maintenance.
- Add shared pure domain logic for validation, customer-part linking, and Order Entry readiness.
- Keep the existing Order Entry module working.

Backend persistence, centralized on-prem database setup, authentication, audit storage, and multi-user conflict handling should be planned in an architecture slice before real production data is stored.

## Open Decisions

- Which customer fields are required by the plant today beyond customer ID and name?
- Which customer order rules must be enforced before Order Entry can be trusted with live work?
- Which part fields are required locally for heat treating beyond part ID, customer, and process master?
- Which material/spec/cert fields should be required versus warning-only?
- Should the first implementation expose customer and part history as a visible seeded panel, or defer it until persistence exists?
- Which backend and database stack should support the on-prem production architecture?

## Approved Design Decisions

- HeatSynQ should grow into a broader Visual Shop replacement, not stop at Order Entry.
- The next product area is Master Data Foundation.
- `Customer Maintenance` and `Part Maintenance` should be separate modules.
- The first Master Data Foundation slice should build both modules shallowly together.
- Users are granted named permissions, not roles.
- `Customer Maintenance` and `Part Maintenance` each need their own module permission.
- Customers and parts should be linked through customer-specific part records.
- Process masters and plant support data are read-only references in this slice.
- Order Entry integration should be an explicit outcome of the design.
- HeatSynQ should not copy Visual Shop's UI one-for-one; UI/UX changes should reduce redundancy, improve ease of use, and improve readability.
