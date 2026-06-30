# HeatSynQ Process Foundation Design

Date: 2026-06-30

## Summary

The next HeatSynQ slice is `Process Foundation`: an editable process recipe module named `Process Maintenance`. This slice gives HeatSynQ a shared heat-treating recipe layer before deeper shop-floor tracking, inspection result entry, shipping certifications, invoicing, and reporting.

The design uses Visual Shop as workflow and data source material, not as a UI clone target. HeatSynQ should keep the useful process concepts: process masters, revisions, table keys, standard steps, inspection requirements, and process-to-part assignment. It should reduce Visual Shop-style setup overload by grouping recipe editing, readiness, dictionaries, inspections, and part assignment into a clearer operational workspace.

## Source References

Primary local references:

- `Visual Shop REFERENCES/VisualShopTraining.pdf`
- `docs/superpowers/specs/2026-06-29-order-entry-design.md`
- `docs/superpowers/specs/2026-06-30-master-data-foundation-design.md`
- `docs/superpowers/specs/2026-06-30-visual-shop-replacement-roadmap.md`

Relevant Visual Shop patterns:

- Plant support dictionaries define process codes, equipment, groups, cost centers, inspection codes, inspection scales, table keys, standard steps, materials, and other setup records.
- Table keys connect what is done to where it is done: process code plus equipment, group, or cost center.
- Standard steps are reusable operating instructions tied to table keys.
- Process masters assemble standard steps and inspection requirements into reusable heat-treating recipes.
- Process masters have revisions, and revision visibility matters when parts and orders reference a process.
- A process created from a process master can be assigned and saved to one part number or multiple part numbers.
- Process master data feeds Part Maintenance, Order Entry, Tracking, certifications, pricing, and reporting.

## Goals

- Add `Process Maintenance` as a new module with its own named permission.
- Build an editable recipe-builder-centered Process Maintenance prototype.
- Support a revision-aware model with one active revision and one editable draft revision per process master.
- Allow active process revisions to be assigned to one or more customer part records.
- Define recipe steps with heat-treating fields: equipment/furnace, temperature, time, tolerance, atmosphere, quench/media, hardness target, case-depth target, and instructions.
- Define inspection requirements with acceptance targets, min/max ranges, frequency, required flags, and cert visibility.
- Add lightweight editable plant support dictionaries needed by process recipes.
- Let Part Maintenance and Order Entry display/read active process revision data for readiness and context.
- Keep the slice shallow enough to implement, test, and validate before production persistence and multi-user concurrency are added.

## Non-Goals

- No direct replication of Visual Shop's Process Master UI.
- No backend database, API, authentication, audit persistence, or multi-user conflict handling in this prototype slice.
- No live shop-floor tracking, operator confirmations, load status, or actual start/stop capture.
- No measured inspection result entry or pass/fail result workflow.
- No full revision history, revision comparison, restore, obsolete flow, or complete revision audit trail.
- No deep Order Entry refactor, process auto-selection from verified customer parts, or compatibility checking across multiple order parts.
- No deep Plant Support module for all setup tables and validation rules.
- No delete workflow for setup records. Prototype records should use inactive flags where removal-like behavior is needed.

## Permission Model

Permissions stay user-assigned and module based:

- A user with `Process Maintenance` permission can open the Process Maintenance module.
- A user without `Process Maintenance` permission sees a module-specific blocked state.
- A user can have any combination of `Order Entry`, `Customer Maintenance`, `Part Maintenance`, and `Process Maintenance`.
- Users do not receive roles.

Later phases can add action-level permissions only when workflow pressure proves the need, such as promoting revisions, assigning processes to parts, editing dictionaries, overriding holds, or changing production-critical fields.

## Module Shape

HeatSynQ should grow from the current module shell into:

- `Order Entry`
- `Customer Maintenance`
- `Part Maintenance`
- `Process Maintenance`

The module shell should keep the same operational ERP feel. `Process Maintenance` should use the same permission gate pattern and dense workspace language as the existing master-data modules.

## Scope And Core Workflow

`Process Maintenance` centers on the process recipe lifecycle:

1. User opens `Process Maintenance`.
2. Module gate checks for `Process Maintenance` permission.
3. User searches or filters process masters.
4. User selects an existing process master or creates a new process master.
5. User edits the draft revision's header, recipe steps, inspection requirements, and dictionary references.
6. User saves the draft while incomplete, seeing warnings as needed.
7. User promotes the draft to active when readiness passes.
8. User assigns the active process revision to one or more customer part records.
9. Part Maintenance and Order Entry display the shared active process revision data.

Only active revisions can be assigned to parts. Draft revisions cannot be assigned until promoted.

## Revision Model

Each process master can have:

- One active revision.
- One editable draft revision.

The active revision is the process version that downstream modules can use. The draft revision is the working copy for editing. Promoting a draft replaces the active revision for this prototype. Full revision history, compare, restore, and obsolete flows are deferred.

Revision fields should include:

- Revision number.
- Status: `Active` or `Draft`.
- Effective date.
- Process code.
- Material.
- Specification.
- Certification format.
- Notes.
- Steps.
- Inspection requirements.
- Readiness state.

Part and order displays should show which active revision they reference.

## Recipe Steps

Process steps should use a core route model plus selected engineering fields.

Step fields:

- Sequence.
- Step name.
- Table key.
- Process code reference.
- Equipment/furnace reference.
- Group reference.
- Cost center reference.
- Temperature.
- Time.
- Tolerance.
- Atmosphere.
- Quench/media.
- Hardness target.
- Case-depth target.
- Operator/process instructions.

The first UI should support:

- Add step.
- Duplicate step.
- Move step up.
- Move step down.
- Remove step from the draft.

Live tracking fields are out of scope. Steps should not include actual start/stop, operator signoff, load status, or measured production actuals in this slice.

## Inspection Requirements

Inspection requirements define what must be inspected and what counts as acceptable. They do not capture measured results in this slice.

Inspection requirement fields:

- Inspection code/type.
- Inspection scale.
- Timing or frequency.
- Required flag.
- Target value.
- Minimum value.
- Maximum value.
- Cert-visible flag.
- Notes/instructions.

These requirements should feed readiness and future certification/inspection workflows.

## Plant Support Dictionaries

This slice should include lightweight editing for the core dictionaries needed by Process Maintenance:

- Process codes.
- Equipment/furnaces.
- Groups.
- Cost centers.
- Inspection codes.
- Inspection scales.
- Table keys.
- Standard step templates.

Each dictionary entry should stay shallow:

- ID.
- Code.
- Name.
- Description.
- Active flag.
- Category/type only when required by the recipe editor.

Inactive entries cannot be selected for new edits, but existing records should still display them. A full Plant Support module with deep metadata and global validation rules is deferred.

## Process To Part Assignment

A process created from a process master can be assigned and saved to one part number or multiple part numbers.

This slice should model that relationship with `ProcessPartAssignment`:

- Active process revision ID.
- Customer part IDs.
- Assigned date or in-memory event timestamp.
- Assignment note or warning summary.

Process Maintenance owns assignment actions. Part Maintenance owns customer part details but should display and receive assigned active process revision references.

Assignment rules:

- Only active process revisions can be assigned.
- Draft revisions cannot be assigned.
- Invalid or incomplete active revisions cannot be assigned.
- Users can select one or many eligible customer parts.
- Assignment should warn when selected parts already reference another active process revision.
- In this prototype, assignment updates in-browser customer part state only.

## UI And Workflow

`Process Maintenance` should follow the current dense ERP module pattern:

- Searchable list on the left.
- Editable detail workspace on the right.
- Toolbar actions at the top.
- Clear readiness feedback near the top.
- Grouped sections or tabs instead of a single overloaded form.

Primary screen regions:

- `Process list`: search by process ID, process code, material, specification, equipment/furnace, active/draft status, and linked part usage.
- `Revision header`: process master ID/name, active revision, draft revision, status, effective date, process code, material, specification, cert format, and notes.
- `Recipe steps`: editable ordered table for route and engineering fields.
- `Inspection requirements`: editable table for required inspections and acceptance targets.
- `Dictionaries`: compact maintenance panel or tab for shallow add/edit/inactivate of core plant support dictionaries.
- `Part assignments`: panel for eligible customer parts and currently assigned parts.
- `Readiness`: checklist for draft promotion and active revision assignment.

Toolbar actions:

- New Process.
- New Draft Revision.
- Save Draft.
- Promote Draft.
- Assign To Parts.
- Cancel Edits.

The UI should avoid Visual Shop-style overload by grouping related work into sections while still feeling like real setup work for heat-treating recipes.

## Order Entry And Part Maintenance Integration

Integration should be shared but shallow.

Part Maintenance should display richer active process revision details when a part references one:

- Revision status.
- Revision number.
- Process code.
- Material.
- Specification.
- Certification format.
- Step summary.
- Inspection requirement summary.

If a process assignment is made from Process Maintenance, the linked customer part record should update in browser state.

Order Entry should continue selecting process masters, but the displayed process and steps should come from the new active process revision data. Readiness should still block missing or invalid process references. Deep auto-selection from customer parts and compatibility checks across multiple order parts are deferred to the next Order Entry refactor.

## Prototype State Strategy

The current prototype uses seeded data and in-browser state. This slice should make process, dictionary, and customer-part assignment state shared at the module-shell level or through a small local state provider so modules do not maintain disconnected copies of the same records.

Shared in-browser state should include:

- Process masters.
- Process revisions.
- Plant support dictionary entries.
- Customer parts and their active process revision references.

`Process Maintenance` can own the editing interactions, but `Part Maintenance` and `Order Entry` should read from the same active process revision state. This preserves the future backend contract without adding backend persistence in this slice.

## Data Model

This spec describes the domain shape, not final database tables.

- `ModulePermission`: named permission union extended to include `Process Maintenance`.
- `ProcessMaster`: stable identity for a process recipe family.
- `ProcessRevision`: active or draft version of a process recipe.
- `ProcessStep`: ordered step inside a process revision.
- `ProcessInspectionRequirement`: required inspection definition for a process revision.
- `PlantSupportDictionaryEntry`: shallow setup record used by recipe editors.
- `ProcessPartAssignment`: relationship between an active process revision and one or more customer part records.
- `ProcessReadiness`: computed blockers and warnings for draft promotion and active assignment.
- `CustomerPart`: existing customer-specific part record updated to reference active process revision data.
- `Order`: existing Order Entry record updated to display active process revision details.

## Validation And Error Handling

Draft process revision validation:

- Draft revisions can be saved while incomplete.
- Missing process code, material, specification, steps, inspections, or dictionary references should produce warnings.
- Invalid dictionary references should be visible next to affected fields.

Promotion validation:

- Process code is required.
- Material is required.
- Specification is required.
- At least one step is required.
- At least one required inspection is required.
- Referenced dictionary entries must exist.
- New selections cannot use inactive dictionary entries.

Assignment validation:

- Active revision is required.
- Active revision must pass assignment readiness.
- At least one customer part must be selected.
- Draft revisions cannot be assigned.
- Incomplete revisions cannot be assigned.
- Existing part process references should produce warnings before overwrite.

Errors should be direct and local to the relevant section, with a persistent readiness summary for blockers and warnings.

## Testing

Domain tests should cover:

- Process readiness blockers and warnings.
- Draft save rules.
- Promotion eligibility.
- Dictionary filtering and inactive handling.
- Assignment eligibility.
- Draft revision assignment blocking.
- Multiple-part assignment.

Module tests should cover:

- Permission blocking for users without `Process Maintenance`.
- Process search and selection.
- Editing and saving a draft revision.
- Adding, duplicating, reordering, and removing process steps.
- Adding inspection requirements with acceptance targets.
- Promoting a ready draft.
- Blocking promotion when required data is missing.
- Assigning an active revision to multiple customer parts.
- Warning when assigning over an existing process reference.
- AppShell navigation showing the new module and disabled state.
- Part Maintenance display of shared active process revision details.
- Order Entry display of shared active process revision steps.

## Future Work

Deferred Process Foundation and downstream work:

- Full revision history, compare, restore, obsolete, and audit trail.
- Backend persistence and centralized on-prem database modeling.
- Multi-user conflict handling and record locking.
- Deep Plant Support module.
- Process auto-selection from verified customer parts in Order Entry.
- Compatibility warnings across multiple order parts.
- Live shop-floor tracking and operator confirmations.
- Measured inspection result entry.
- Certification generation from inspection results.
- Pricing/reporting logic driven by process recipes.

## Open Questions For Later

- What backend and database stack should store process masters, revisions, dictionary records, and assignments for production?
- How should HeatSynQ handle process revision history once real orders reference older revisions?
- Which users should eventually be allowed to promote revisions or overwrite part assignments?
- How should order-specific step overrides relate to process master revisions?
- Which inspection requirements should flow onto certifications automatically?
