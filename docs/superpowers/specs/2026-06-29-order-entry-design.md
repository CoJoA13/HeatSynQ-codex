# HeatSynQ Order Entry Module Design

Date: 2026-06-29

## Summary

HeatSynQ will start with an `Order Entry` module that replaces the Visual Shop receiving/order-entry workflow first. The first version will be a fully interactive prototype focused on receiving: entering customer/order details, containers, parts, weights, process master selection, process steps, notes, events, documents, and release readiness.

The design intentionally keeps Visual Shop muscle memory where it helps: toolbar actions, tabbed order sections, and persistent right-side activity panels. The main improvement is a visible readiness layer that shows whether an order can be released/printed and exactly what is missing when it cannot.

## Reference Sources

Primary local references:

- `Visual Shop REFERENCES/Order Entry/Order Entry_0.png`
- `Visual Shop REFERENCES/Order Entry/Order Entry_1.png`
- `Visual Shop REFERENCES/Order Entry/Order Entry_2.png`
- `Visual Shop REFERENCES/Order Entry/Order Entry_3.png`
- `Visual Shop REFERENCES/Open App.png`
- `Visual Shop REFERENCES/Orders Menu.png`
- `Visual Shop REFERENCES/Process Menu.png`

Relevant Visual Shop patterns observed:

- Top menu and toolbar with large action buttons.
- Central tabbed order-entry work area.
- Right-side panels for order notes, customer notes, order events, and customer documents.
- Order readiness rules shown before a new/incomplete order can be treated as receiving complete and ready to print.

## Goals

- Build the first ERP module around receiving/order entry.
- Gate access by module permission, not by user role.
- Preserve the Visual Shop order-entry mental model while improving clarity.
- Make release/print readiness visible and testable.
- Keep the first slice small enough to implement and validate before expanding into other ERP modules.

## Non-Goals

- No billing, accounts receivable, shipping, inventory, assembly, customer maintenance, process-master editing, or production tracking in this first slice.
- No role-based access model.
- No action-level permission model in the first version.
- No actual document upload workflow in the first prototype; document references are displayed with seeded data only.

## Permission Model

Permissions are module based. A user with the `Order Entry` permission enabled can open and use the Order Entry module. A user without that permission cannot open the module.

For this first slice, the Visual Shop "user clearance" readiness rule is satisfied by having the `Order Entry` permission. Finer permissions, such as separate release or invoice permissions, are deferred until a later module or workflow requires them.

## Module Shape

The first module is named `Order Entry`.

Order Entry uses this screen structure:

- App shell and menu/toolbar.
- Left sidebar area for order identity and optional thumbnail area.
- Central order work area with tabs:
  - `Order Top`
  - `Detail`
  - `Parts`
  - `Process`
  - `Steps`
- Right-side panels:
  - `Order Notes`
  - `Customer Notes`
  - `Order Events`
  - `Customer Documents`
- Persistent readiness checklist for release/print.

The first module does not include `Assembly` or `Inventory` tabs.

## Workflow

An order begins in an incomplete receiving state. The user enters order data across the five tabs. The system continuously evaluates readiness and shows missing requirements. The user can save partial work, switch tabs freely, and return to complete missing information.

The order can be released/printed only when all readiness rules pass:

1. The order is assigned to a customer.
2. The order has at least one container.
3. The order has at least one part.
4. The order has either quantity or weight.
5. The order is based on an existing process master.
6. The user has the `Order Entry` permission.

If release/print is attempted before all checks pass, the system blocks release and shows the missing items with their related tab.

## Tab Behavior

### Order Top

`Order Top` captures customer and order header information. It includes customer selection, received-from and ship-to information, order status, receiving status, PO and packing information when available, certification flag, request date, target ship date, carrier fields, and order-level notes.

### Detail

`Detail` is reserved for secondary order information that does not belong in the faster receiving path. In the first prototype it shows a seeded supplemental panel with read-only secondary fields.

### Parts

`Parts` captures containers and part lines. Container rows include type, number of containers, quantity, gross weight, tare, net weight, and optional container ID. Part rows include part ID, part name/description, customer quantity, each weight, total weight, material, thickness, and verification state.

Weight calculations should be visible:

- `net weight = gross weight - tare`
- container totals aggregate across container rows
- part totals aggregate across part rows
- mismatched container and part totals produce a warning

### Process

`Process` requires selecting an existing process master. It shows process ID, revision, process code, material, certification/spec fields, comments, and related process metadata. Creating or editing process masters is outside this module.

### Steps

`Steps` shows the process steps pulled from the selected process master. In the first slice, steps are used for confirmation and visibility, not production tracking.

## Data Model

Core records for the first slice:

- `User`: application user with a set of enabled permissions.
- `Permission`: named module permission, starting with `Order Entry`.
- `Customer`: customer record used for order assignment.
- `Order`: receiving/order-entry record with status, customer, header fields, selected process master, readiness state, and links to related records.
- `Container`: container row linked to an order.
- `PartLine`: part row linked to an order.
- `ProcessMaster`: existing reference record selected by an order in the first slice.
- `ProcessStep`: existing reference step linked to a process master.
- `OrderEvent`: audit/event row generated by saves, release attempts, readiness changes, and print/release actions.
- `Note`: order or customer note.
- `DocumentReference`: visible reference to customer/order documents.

`Order` owns the working receiving state and links to containers, part lines, selected process master, notes, events, and document references.

## Components

The UI should be split into focused components:

- `ModuleGate`: checks whether the user has `Order Entry` permission.
- `OrderEntryModule`: top-level module composition.
- `OrderToolbar`: close, new, search, check, save, cancel, erase, order note, and comments actions. Part picture maintenance and view invoice can appear as disabled future actions to mirror Visual Shop, but they are not implemented in the first slice.
- `OrderTabs`: tab navigation for the five active tabs.
- `OrderHeaderStatus`: order ID, order status, receiving status, customer, and readiness summary.
- `OrderTopTab`
- `DetailTab`
- `PartsTab`
- `ProcessTab`
- `StepsTab`
- `ActivityPanels`: notes, customer notes, events, and document references.
- `ReadinessChecklist`: visual readiness state and missing-item guidance.
- `validateOrderReadiness`: pure business logic for release/print rules.
- `calculateWeights`: pure business logic for gross, tare, net, and totals.

## Error Handling

Errors and warnings should be direct and actionable:

- Release/print blocks with a checklist of missing readiness items.
- Each missing item points to its related tab.
- Invalid weight input is shown beside the affected row.
- Negative net weight is invalid.
- Container total and part total mismatches show a warning, not a hard block unless the readiness quantity/weight rule is not satisfied.
- Missing process master blocks release/print.
- Missing `Order Entry` permission blocks module access.

## First Prototype Scope

The first prototype should be fully interactive within this scope:

- Module permission gate for `Order Entry`.
- Functional toolbar actions for new order, search/select seeded order, check readiness, save, cancel unsaved edits, erase current draft, order note, and comments.
- Five tabs: `Order Top`, `Detail`, `Parts`, `Process`, and `Steps`.
- Editable seeded order data.
- Add/remove container rows.
- Add/remove part rows.
- Gross, tare, net, and total calculations.
- Process master selection from seeded reference data.
- Process steps populated from the selected process master.
- Right-side notes, events, and document reference panels.
- Save action that creates order events.
- Release/print readiness check that either succeeds or explains what is missing.

## Testing Plan

Test coverage should include:

- `validateOrderReadiness` passes only when all six readiness rules are satisfied.
- `calculateWeights` handles normal, zero, and invalid weight cases.
- Module gate blocks users without `Order Entry` permission.
- Tab switching preserves edited order data.
- Adding and removing containers updates totals and readiness.
- Adding and removing part lines updates totals and readiness.
- Process master selection updates process and steps display.
- Save creates an order event.
- Release/print creates a success event when ready.
- Release/print creates a blocked event and missing-item messages when not ready.

## Approved Design Decisions

- The first ERP slice is Order Entry/receiving.
- The first module is named `Order Entry`.
- Permissions are module based, not role based.
- A user with `Order Entry` permission can access the module.
- The first UI direction is guided Visual Shop tabs.
- Required release/print checks match the current Visual Shop rules.
- `Assembly` and `Inventory` tabs are excluded from the first module.
- The first prototype should be fully interactive within the scoped Order Entry workflow.
