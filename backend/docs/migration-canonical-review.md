# Migration vs Canonical Schema Review

This review compares:

- canonical architecture (`ai-system-architecture.md`)
- active Sequelize models under `backend/models`
- historical migrations under `backend/migrations`

## Key Findings

1. **Conflicting historical create-table migrations exist** for the same logical tables (`goods`, `locations`, `movement_requests`, `audit_logs`, `categories`, `vendors`).
2. **Canonical stock table is `stock`**, but an earlier migration creates legacy `stocks`.
3. `stock_adjustments.stock_id` was originally defined to reference **`stocks.id`**, while services and models use **`stock.id`**.
4. A reconciliation migration (`20260310000001-reconcile-stock-table.js`) merges rows but does **not** re-point the foreign key on `stock_adjustments.stock_id`.

## Why FK Errors Happen

In environments where both `stocks` and `stock` exist, inserts into `stock_adjustments` may fail with FK violations if `stock_id` points to `stock.id` rows while the FK still references `stocks.id`.

## Remediation Implemented

Migration `20260310000004-align-stock-adjustments-fk-with-stock-table.js` now:

1. Merges missing rows from `stocks` into `stock` when both tables are present.
2. Detects and removes existing FK constraints on `stock_adjustments.stock_id` (constraint names vary by MySQL environment).
3. Recreates the FK so `stock_adjustments.stock_id -> stock.id`.

This aligns migrations with the canonical schema used by services/models.
