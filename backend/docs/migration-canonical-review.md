# Migration vs Canonical Schema Review

This review compares:

- canonical architecture (`ai-system-architecture.md`)
- active Sequelize models under `backend/models`
- historical migrations under `backend/migrations`

## What was wrong

Historically, migrations contained multiple `createTable` definitions for the same logical tables (`goods`, `locations`, `movement_requests`, `audit_logs`, `categories`, `vendors`, `movements`, and stock variants). This caused two practical problems:

1. **Fresh migration instability** (`table already exists`), depending on execution order.
2. **Schema drift** from canonical models/services because different variants created different columns and constraints.

A critical mismatch also existed around stock:

- canonical runtime uses `stock` (model/service level)
- historical chain could keep FK `stock_adjustments.stock_id -> stocks.id`

## Cleanup performed

Removed redundant/legacy migrations that recreated already-defined tables with conflicting schemas:

- `20240101000003-create-goods.js`
- `20240101000003-create-locations.js`
- `20240101000003-create-movement-requests.js`
- `20240101000005-create-movements.js`
- `20240101000006-create-movement-requests.js`
- `20240102000001-create-audit-logs.js`
- `20240102000001-create-movements.js`
- `20240102000002-create-audit-logs.js`
- `20240102000002-create-categories.js`
- `20240102000003-create-vendors.js`
- `20240102000004-create-locations.js`
- `20240102000007-create-goods.js`
- `20240102000008-create-stock.js`

Kept a single migration path per table family, then relied on later normalization/reconciliation migrations for convergence to canonical schema.

## FK remediation retained

Migration `20260310000004-align-stock-adjustments-fk-with-stock-table.js` is retained and required. It:

1. merges missing legacy rows from `stocks` into `stock` (when both exist),
2. drops existing FK constraints on `stock_adjustments.stock_id` regardless of generated constraint name,
3. recreates FK as `stock_adjustments.stock_id -> stock.id`.

This aligns the database with canonical backend models and services.
