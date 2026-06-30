# HeatSynQ

HeatSynQ is a heat-treating-first ERP prototype intended to grow into a Visual Shop replacement. The first module is Order Entry, modeled from the Visual Shop receiving/order-entry workflow.

## System Direction

Order Entry is the first module, not the full product boundary. Future modules should expand HeatSynQ across the heat-treating ERP workflows currently handled in Visual Shop, with access controlled by named permissions per module.

The production system should use a centralized database hosted on the on-prem server. Multiple users must be able to work in the system at the same time against the same shared data.

## Local Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run lint
npm test
npm run build
```

## First Module

The first interactive module is `Order Entry`. Access is controlled by the module permission named `Order Entry`.
