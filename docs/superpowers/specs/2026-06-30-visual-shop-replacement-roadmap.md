# HeatSynQ Visual Shop Replacement Roadmap

Date: 2026-06-30

## Summary

HeatSynQ is intended to replace Visual Shop as a heat-treating-first ERP. The local training manual, `Visual Shop REFERENCES/VisualShopTraining.pdf`, shows that Visual Shop is not a single order-entry program. It is a connected system of setup tables, customer records, process recipes, part records, order intake, tracking, expediting, shipping, certifications, billing, A/R, documents, reporting, security, and external integrations.

The first implemented HeatSynQ module is `Order Entry`. That remains a useful first prototype, but the PDF changes the planning lens: future work must be organized around shared data dependencies, not isolated screens. Customer and Part Maintenance are still the right next product area, but they should be designed as linked master-data modules that prepare the ground for process masters, tracking, shipping, certifications, invoicing, and reporting.

## Source Material

Primary source:

- `Visual Shop REFERENCES/VisualShopTraining.pdf`

The PDF covers these major areas:

- Visual Shop setup, operator security, plant setup, plant support tables, process codes, equipment, groups, cost centers, inspection codes, material lists, containers, table keys, and standard steps.
- Process masters, process inspections, process steps, process master revisions, and process master creation.
- Customer Maintenance, Customer Control, addresses, contacts, invoice controls, customer documents, customer requirements, billing/shipping/cert defaults, and customer-specific overrides.
- Part Maintenance, customer-specific part records, process master links, pricing, quotes, certifications, inspection requirements, step overlays, pictures/PDFs, custom tabs, required fields, history, part holds, and reworks.
- Quotes, Order Entry, order top, containers, parts, serial numbers, process selection, steps, load splitting, certifications, and order-level charges.
- Tracking, Visual Track, tracking types, templates, areas, schedules, order-load-step tracking, inspection capture, batch tracking, furnace/load prompts, and barcode/operator workflows.
- Expediting, order search, order top, process, parts, shipping, tracking, history, rush, load, inspection, inventory, split load, order reworks, part reworks, and order charges.
- Shipping, multi-order shippers, certifications, certification formats, certification results, and shipper/cert document output.
- Invoicing, pricing sources, invoice dashboard, multi-order invoices, invoice locking, credits, A/R batches, payments, finance charges, A/R reports, and month-end procedures.
- Customer Expediting, a customer-centered hub that gathers customer detail, control, operations, history, sales, addresses/contacts, statements, quotes, communications, documents, parts, orders, expediting, invoices, A/R, collections, and turnaround data.
- Visual Archive, Visual Truck, Visual UPS, analytics/data discovery, accounting, SSI/SuperDATA furnace integration, and consulting/customization.

## Product Principles

- Favor heat-treating workflows first. The most important long-term path is receiving/order entry into process recipes, tracking, inspection, shipping, certifications, and customer visibility.
- Build shared data before deep workflow automation. Customers, parts, process masters, plant support dictionaries, permissions, and audit history must be coherent before tracking or billing can be trustworthy.
- Keep module permissions explicit. Users are not assigned roles; users are granted named permissions that enable modules and later specific actions.
- Preserve Visual Shop muscle memory where it helps. Dense lists, toolbar actions, tabs, customer/part/process lookup, and status-oriented workflow are familiar and should remain recognizable.
- Improve clarity around readiness, dependencies, and missing information. Visual Shop often hides required setup in many places; HeatSynQ should surface why an order, part, process, shipment, invoice, or tracking step is not ready.
- Plan for a centralized on-prem database. The production system must support multiple simultaneous users working against shared records.
- Treat custom fields and configuration as first-class design concerns. Visual Shop relies heavily on program defaults, custom tabs, user-defined fields, and plant-specific behavior. HeatSynQ should support configurable fields and plant settings without letting the core model become unclear.

## Core Dependency Chain

The PDF shows this practical dependency chain:

1. Plant and security setup define company information, users, permissions, defaults, and shared lookup tables.
2. Plant support tables define process codes, equipment, groups, cost centers, inspection codes, scales, materials, containers, and table keys.
3. Standard steps are written against table keys.
4. Process masters assemble standard steps and process inspections into reusable recipes.
5. Customers define commercial, shipping, certification, invoicing, contact, document, and requirement context.
6. Parts link customers to process masters, material/cert/inspection/pricing details, pictures/PDFs, quotes, and optional step overlays.
7. Order Entry uses customer, part, process, container, certification, and quote data to create orders and loads.
8. Tracking and scheduling operate on order-load-step records created from process steps and tracking templates.
9. Expediting exposes order status, tracking, shipping, inspection, rush, load, rework, and invoice visibility.
10. Shipping and certifications use order, customer, part, load, container, inspection, and result data.
11. Invoicing uses shipped orders, part pricing, process pricing, order-level charges, quotes, and billing controls.
12. A/R uses locked invoices, credits, batches, payments, finance charges, aging, and month-end close workflows.
13. Archive, trucking, UPS, accounting, analytics, and furnace/SCADA integrations sit around the core transaction flow.

## Module Map

### Platform And Administration

Purpose:

- Manage users, permissions, plant/company setup, program settings, lookup dictionaries, audit history, and future system-level configuration.

Visual Shop source areas:

- Operator Security
- Plant Setup
- Plant Support
- Program Defaults
- Advanced Security
- Schedule Jobs

HeatSynQ notes:

- Use named permissions instead of role assignment.
- Keep module permissions simple early, then add action-level permissions when a workflow proves the need.
- Model settings deliberately. Visual Shop has many defaults; HeatSynQ should expose configuration in grouped, documented settings rather than hidden string keys.
- Plant support dictionaries should be reusable across process masters, parts, order entry, tracking, shipping, invoicing, and reports.

### Customer Maintenance

Purpose:

- Maintain customers and their operational, shipping, billing, certification, quote, reporting, contact, address, document, and requirement settings.

Visual Shop source areas:

- Customer Maintenance
- Customer Control
- Addr/Cont
- Invoice Control
- Customer Documents
- Customer Expediting

Important concepts:

- Customer list/search with configurable columns.
- Customer detail with customer ID, alpha key, customer type, plant, name, address, phone, fax, terms, attention, region, rank, active/review/COD flags, and credit status.
- Customer control fields for default received-from and ship-to addresses, request/target days, default route/carrier, PO requirements, process/material validation, certification settings, deviation rules, billing options, shipping options, customer-specific forms, email text, customer notes, shipping instructions, process instructions, quote instructions, and inspection instructions.
- Addresses and contacts split into address records, contact records, and email groups.
- Customer documents and communication history.
- Customer Expediting as a customer-centered hub.

HeatSynQ notes:

- Customer Maintenance should be its own module permission.
- The first implementation should include searchable list/detail, address/contact summaries, customer status flags, notes/requirements, and relationships to linked parts.
- Deep invoice control, A/R, forms, and email automation can be deferred but the data model should leave room for them.

### Part Maintenance

Purpose:

- Maintain customer-specific part records that connect customer work to process recipes, inspection/cert requirements, pricing, quotes, documents, pictures, and Order Entry lookup.

Visual Shop source areas:

- Setup Process Masters and Parts
- Part Maintenance
- Part Maintenance advanced tabs
- Part reworks
- Part PDFs and pictures
- Step overlays
- Part quotes and pricing

Important concepts:

- Part ID is required and is the primary part identity.
- Customer and process master are required for normal part records.
- Part records can include part name, description, outgoing part number, blanket/static PO, revision, inactive flag, part hold, shipping hold, material, specifications, cert format, inspection requirements, dimensions, each weight, quote data, pricing, process notes, user-defined fields, pictures, PDFs, and formula/custom-tab fields.
- Part step overlays can make a generic process master part-specific by replacing or appending step text/comments.
- Part pricing can feed invoicing through simple pricing, assembly pricing, PPG/bracket/step pricing, or other pricing structures.
- Part records can be used in Order Entry; verified parts can bring a process master into an order.

HeatSynQ notes:

- Part Maintenance should be its own module permission.
- The first implementation should include searchable list/detail, customer link, process master reference, key description/information/price/quote/cert fields, active/hold indicators, and a visible relationship back to Order Entry.
- Deep pricing, custom tabs, formula application, pictures/PDF storage, step overlays, part reworks, and mass changes can be separate future slices.

### Process Foundation

Purpose:

- Define the recipes, steps, inspections, and process-related dictionaries that drive heat-treating production.

Visual Shop source areas:

- Plant Support
- Process Codes
- Equipment
- Groups
- Cost Centers
- Inspection Codes
- Inspection Scales
- Table Keys
- Standard Steps
- Process Masters
- Process Master inspections

Important concepts:

- Table keys connect what is done to where it is done: process code plus equipment, group, or cost center.
- Standard steps are reusable operating instructions tied to table keys.
- Process masters assemble steps into a recipe and require at least one inspection record.
- Process masters can be created through an original flow or a newer integrated flow that allows creating supporting table records on the fly.
- Process master data feeds parts, order entry, tracking, certifications, pricing, and reporting.

HeatSynQ notes:

- Process Foundation should be planned before deep production tracking.
- The first Process Foundation slice should support read-only process masters and dictionaries for Customer/Part/Order Entry, then add process editing once the model is clear.
- Heat-treating-specific process structure is a priority because it underpins shop-floor work.

### Order Intake

Purpose:

- Receive customer work, create orders, attach customer and part data, define containers/parts/serials, select process masters, create order steps, and make the order ready for tracking/shipping.

Visual Shop source areas:

- Quotes and Order Entry
- Advanced Order Entry
- Order-level charges
- Digital Order Approval
- Order reworks
- Load splitting
- Attachments

Important concepts:

- Order Entry begins with customer selection and order top data.
- Customer defaults can set addresses, request dates, target dates, carrier/route, PO rules, certification defaults, and instructions.
- Every order needs quantity or weight.
- Part selection can pull customer-specific parts from Part Maintenance.
- Parts on the same order may need compatible process masters.
- Verified parts can automatically select process masters.
- Order steps can be modified for one order without changing the process master.
- Load splitting creates multiple loads for tracking and printing.
- Certifications can originate at order level or process/shipper/load level depending on cert format.
- Attachments may show customer, process, part, and order documents on wide screens.

HeatSynQ notes:

- The existing Order Entry prototype should later be refactored to use shared customer, part, and process records.
- Order readiness should expand from simple prototype checks to include customer control rules, part holds, process compatibility, PO requirements, certification requirements, and tracking/shipping readiness.

### Production Tracking And Scheduling

Purpose:

- Track work through heat-treating operations at the order-load-step level, capture operator/time/area/process/inspection data, support scheduling, and feed expediting and reports.

Visual Shop source areas:

- Visual Track Tablet
- Tracking Types
- Tracking Templates
- Areas
- Schedules
- Order Tracking Maintenance
- Quick Track
- Expediting tracking tab
- SSI/SuperDATA furnace integration

Important concepts:

- Tracking requires areas, tracking types, tracking templates, and table key assignments.
- Tracking operates on order-load-step records.
- Operators select or scan an area, then scan/select an order-load or order-load-step.
- Tracking prompts can capture weight, quantity, furnace/load identifiers, time, temperature, barrel IDs, inspection results, accept/reject quantities, and custom process data.
- Tracking templates control mandatory entries, load splitting, no-track steps, multiple repeats, overlap tracking, accepted/rejected quantity behavior, and security.
- Schedules operate at the order-load-step level, support drag/drop priority, unscheduled retrieval, batch creation, and schedule reporting.
- Expediting displays tracking history and completed steps.
- SSI/SuperDATA integration can mark furnace steps complete and provide process charts/data for certification and expediting.

HeatSynQ notes:

- This is a major heat-treating phase and should be high priority after the data foundation is strong.
- The first tracking slice should be intentionally small: one tracking route, one or two areas, track-in/track-out, basic operator capture, and expediting visibility.
- Furnace/SCADA integration should be designed as an external integration boundary, not hard-coded into early tracking UI.

### Expediting And Customer Visibility

Purpose:

- Provide operational visibility across orders, customers, parts, process, shipping, tracking, history, rush dates, load, inspection, inventory, rework, and invoice data.

Visual Shop source areas:

- Expediting
- Customer Expediting
- Rush
- History
- Documents button
- Order charges in Expediting

Important concepts:

- Expediting is the operational search and status hub after receiving.
- Search can be by order top, part, container, serial, PO, packing slip, customer, process/material, or due-date status.
- Due-date statuses include on target, may miss, will miss, and did miss.
- Expediting can expose order top, process, parts, shipping, tracking, history, rush, load, inspection, inventory, split load, order reworks, and part reworks.
- Customer Expediting provides a customer-focused workspace for customer detail, control, operations, history, sales, addresses, statements, quotes, communications, documents, parts, orders, expediting, invoices, A/R, collections, and turnaround.

HeatSynQ notes:

- Expediting is likely the first major dashboard after Order Entry and Tracking.
- The design should avoid becoming a giant dumping ground. Build it as a status/search shell with focused subviews that reuse module data.

### Shipping And Certifications

Purpose:

- Ship completed work, create shippers, handle multi-order shippers, print/email ship documents, collect results for certifications, and produce certification documents.

Visual Shop source areas:

- Certifications
- Shipping
- Multi-order shippers
- Certification Control
- Shipping results tab
- Shipper/cert word inserts

Important concepts:

- Certification formats can be assigned from part, customer, process master, order selection, or default settings.
- Certification types can be shipper, load, or order level.
- Shipping uses order, customer, ship-to, carrier/route, part, load, container, serial, and inspection/cert result data.
- Shipping can fully or partially ship by quantity/weight.
- Multi-order shippers group multiple orders for the same customer.
- Certifications can include freeform results, inspection code, scale, min/max/value, and comments.

HeatSynQ notes:

- Shipping and certs should come after enough tracking/inspection state exists to make cert generation meaningful.
- Certification format design should be treated as a document/template subsystem.

### Billing, Pricing, And A/R

Purpose:

- Convert shipped work into invoices, price line items, lock invoices into A/R, create credits, receive payments, apply credits/on-account amounts, and support financial reporting.

Visual Shop source areas:

- Invoicing
- Create Invoices from Shipped Orders
- Part Maintenance pricing
- Billing Quotations
- Step/customer step pricing
- Invoice locking
- Credits
- Accounts Receivable
- Finance charges
- Month-end procedures

Important concepts:

- Create Invoices from Shipped Orders creates invoice records from shipping.
- Invoice pricing can come from part simple pricing, assembly pricing, process/step pricing, customer process pricing, quotes, order-level charges, and manual rows.
- Unpriced rows block invoice readiness.
- Printing flags invoices as printed; locking posts invoices to A/R and sales reports.
- Locked invoices require credits for correction.
- A/R uses batches, payment application, credits, write-offs, discounts, adjustments, on-account credits, finance charges, reports, and close-period workflows.

HeatSynQ notes:

- Billing/A/R should be delayed until core operational workflow is represented.
- Data structures should leave room for pricing source traceability and invoice lock immutability.

### Documents, Attachments, And Archive

Purpose:

- Store, retrieve, index, and audit documents tied to orders, customers, parts, shippers, invoices, certifications, pictures, signatures, and attachments.

Visual Shop source areas:

- Customer Documents
- Order attachments
- Part PDFs and pictures
- Visual Archive
- Visual Truck pictures and proof of delivery
- Documents button in Expediting/Invoicing

Important concepts:

- Visual Archive is a separate application with its own users and database.
- Documents can be auto-saved from Visual Shop output or manually scanned/stored.
- Barcodes can index orders, shippers, certifications, and multi-order shippers.
- Document search supports indexing, viewing, printing, saving, and activity logging.

HeatSynQ notes:

- HeatSynQ should eventually have first-class attachments and document audit history.
- Early prototypes can show document references; actual document storage can wait for backend architecture.

### Integrations And Extras

Purpose:

- Connect HeatSynQ to delivery devices, UPS shipping, customer portals, document archive, analytics/reporting, accounting, and furnace/SCADA systems.

Visual Shop source areas:

- Visual Truck
- Visual UPS
- Visual Net
- Visual Archive
- Advizor data discovery
- CSI Accounting
- SSI/SuperDATA furnace integration

Important concepts:

- Visual Truck manages delivery lists, signatures, pictures, pickup requests, and offline tablet use.
- Visual UPS creates shipments for UPS WorldShip and sends tracking emails.
- Visual Net quote/pickup requests can feed Visual Shop workflows.
- Analytics focuses on orders, processes, parts, throughput, utilization, downtime, quality, revenue, invoices, receivables, and pricing.
- SSI/SuperDATA can share furnace recipe, timestamp, load, and process data with tracking and certification.

HeatSynQ notes:

- Treat these as later integration modules unless a specific operational pain makes one urgent.
- The on-prem backend should expose clean integration boundaries so these can be added without rewriting core modules.

## Recommended Build Sequence

### Phase 0: Architecture Backbone

Design the production architecture before the prototype grows too far:

- On-prem centralized database.
- API/backend layer for all shared data.
- Multiple simultaneous users.
- Authentication and named permissions.
- Audit history for important records and workflow events.
- Record locking or conflict handling for concurrent edits.
- Attachment/document storage strategy.
- Seed/test data strategy separate from production persistence.

This phase can begin as an architecture spike while UI modules continue as prototypes.

### Phase 1: Master Data Foundation

Build two shallow but linked modules:

- `Customer Maintenance`
- `Part Maintenance`

Include:

- Separate module permissions.
- Searchable list/detail screens for customers and parts.
- Shared customer-part link.
- Customer status, contact/address summary, notes, and requirements summary.
- Part status, customer, process master reference, material/spec/cert basics, simple pricing/quote placeholders, and active/hold indicators.
- Read-only lookup data for process masters and plant support dictionaries.
- Compatibility path for Order Entry to use shared customers and linked customer parts.

Defer:

- Deep pricing.
- Part step overlays.
- Custom tab designer.
- Pictures/PDF upload.
- Part reworks.
- Invoice controls.
- Customer Expediting.
- Backend persistence unless Phase 0 has already selected the stack.

### Phase 2: Process Foundation

Add process and recipe structure:

- Plant support dictionaries used by process masters.
- Table keys.
- Standard steps.
- Process masters.
- Process inspections.
- Process master selection and revision visibility.
- Read-only process step consumption by Order Entry and Part Maintenance.

This phase gives tracking something real to operate on.

### Phase 3: Order Entry Refactor

Refactor the existing Order Entry prototype to consume the shared foundation:

- Customer lookup from Customer Maintenance.
- Part lookup from customer-specific Part Maintenance records.
- Process master auto-selection from verified/linked parts.
- Customer control rules that affect readiness.
- Part hold and shipping hold awareness.
- Expanded readiness checks.
- Order events/audit.

### Phase 4: Tracking And Expediting Core

Build the first heat-treating production workflow:

- Order-load-step model.
- A small set of areas.
- Track-in and track-out.
- Operator capture.
- Basic inspection capture.
- Basic scheduling or priority list.
- Expediting search/status view.
- Tracking history visible from orders.

This is the first major shop-floor phase.

### Phase 5: Shipping And Certifications

Add:

- Shipping by quantity/weight.
- Partial/complete shipping.
- Certification result entry.
- Certification formats as selectable templates.
- Shipper/cert document preview.
- Multi-order shipper concept if needed early.

### Phase 6: Pricing, Invoicing, And A/R

Add:

- Pricing sources and traceability.
- Create invoices from shipped work.
- Invoice readiness and unpriced-row blocking.
- Invoice print/lock lifecycle.
- Credits.
- A/R batches and payment application.
- Month-end reports.

### Phase 7: Documents, Reports, And Integrations

Add:

- Document archive and attachment management.
- Reporting and analytics dashboards.
- Customer Expediting.
- Visual Truck-style delivery workflow.
- UPS/shipper integrations.
- Furnace/SCADA integration boundary.
- Accounting exports or accounting module integration.

## Immediate Next Recommendation

The next spec should be `Master Data Foundation`, but it should be written with the PDF dependency map in mind:

- Keep `Customer Maintenance` and `Part Maintenance` as separate modules.
- Build both shallowly together.
- Include the shared customer-part relationship.
- Include read-only/selectable process master and plant support references.
- Make Order Entry integration an explicit outcome.
- Defer deep pricing, tracking, billing, and document storage.

This preserves the user's selected path while making it source-grounded and safer for the larger Visual Shop replacement.

## Risks

- Visual Shop has many custom defaults and plant-specific behaviors. HeatSynQ should not try to clone every option before the core workflow is understood.
- Part Maintenance can become too large if pricing, overlays, pictures, formulas, custom tabs, and reworks are all included at once.
- Tracking depends on process and order-load-step models. Building tracking before process foundation risks rework.
- Billing and A/R require financial correctness and lock/close behavior. They should not be prototyped casually once real data is involved.
- Document/archive workflows need a storage, indexing, and permission model. Seeded document references are fine early; real file storage should wait for backend design.

## Open Decisions

- Which database and backend stack should HeatSynQ use for the on-prem production architecture?
- Which Visual Shop fields are truly used at the plant today versus present in the training manual but irrelevant locally?
- Which customer control rules are required before Order Entry can be trusted?
- Which part fields are required for heat treating at this plant?
- Which process master fields and tracking prompts matter for the first production tracking slice?
- How much of billing and A/R should HeatSynQ own versus export to accounting software?

## Approved Direction So Far

- HeatSynQ should replace Visual Shop over time, not stop at Order Entry.
- Order Entry is the first implemented module.
- Users receive permissions, not roles.
- Modules should be permission-gated.
- Production should use a centralized on-prem database.
- The app must support multiple simultaneous users.
- The next product area is Master Data Foundation.
- Customer Maintenance and Part Maintenance should be separate but linked modules.
- The first Master Data slice should build both modules shallowly together.
- The PDF roadmap should guide future planning before the Master Data spec is finalized.
