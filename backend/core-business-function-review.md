# Backend Database Compatibility & Business-Function Verification

## Scope
This review verifies whether the current **controllers, models, migrations, routers, and utils** support a database schema that can run the business functions defined in `ai-system-architecture.md`.

Reviewed folders:
- `backend/controllers`
- `backend/models`
- `backend/migrations`
- `backend/routes`
- `backend/services`
- `backend/utils`

---

## Executive Summary

The backend business logic is mostly aligned with the architecture, but the **migration layer is not reliable as a canonical database source** in its current state.

Main issue categories:
1. **Duplicate/competing migrations** for the same tables (`goods`, `locations`, `movement_requests`, `audit_logs`, `vendors`, `categories`, `movements`) can cause migration-chain breakage or drift.
2. **Legacy schema artifacts** (`items`, `movements`, `stocks`) conflict with current service/model usage (`goods`, `movement_headers`/`movement_details`, `stock`).
3. **Controller/service API mismatches** can produce runtime failures that look like DB/data issues.
4. **Some services still use legacy models/fields** not represented in active model registration.

Net result: a DB created from the current migration history can easily diverge from what active services expect, producing `not found` and invalid-association errors.

---

## Verification Matrix (DB Readiness)

| Area | Status | Verification |
|---|---|---|
| Models vs current business workflows | ⚠️ Partial | Core workflow models are correct (`MovementHeader`, `MovementDetail`, `Goods`, `Stock`), but legacy models still exist and leak into active services/routes. |
| Migrations produce canonical schema consistently | ❌ Not reliable | Multiple duplicated `createTable` migrations target the same tables with different definitions/timestamps. |
| Controllers + services + routes align on API contracts | ⚠️ Partial | Several naming/signature mismatches exist (audit log module/entity filters, missing service method names). |
| Utils/constants support workflow guards | ✅ Mostly aligned | Active movement status constants match business guard usage. |

---

## Detailed Findings

### 1) Migration chain has duplicate table-creation definitions (high risk)
The migration folder contains repeated `createTable(...)` operations for the same table names, which can fail on clean environments or leave environments in different states depending on which migration failed/was skipped.

Examples:
- `goods` table created in multiple migrations.
- `locations` table created in multiple migrations.
- `movement_requests` table created in multiple migrations.
- `audit_logs` table created in multiple migrations.
- `categories` and `vendors` duplicated.
- `movements` (legacy) appears multiple times.

This is the strongest reason a fresh DB may not match service expectations.

### 2) Stock table naming inconsistency: `stock` vs `stocks` (high risk)
- Active `Stock` model points to table `stock`.
- Another migration creates `stocks`.

If an environment applies one path but not the other, services reading `stock` will fail with table/record mismatch symptoms.

### 3) User migration sequence is internally conflicting (high risk)
- One migration adds `users.location_id` and changes role enum to include legacy roles (`operator`, `requester`).
- A later migration again adds `location_id` plus `role_id` and `status`.

Depending on migration order/state, this can fail (`column already exists`) or leave role enums inconsistent with active role checks in services/routes.

### 4) Movement detail transitioned from `itemId` to `goods_id` but legacy footprint remains (medium/high risk)
- Earlier movement-detail schema references `items`.
- Later migration attempts to convert to `goods_id`.

Any environment with partial migration history can fail on FK/rename steps, causing movement detail queries to break.

### 5) Active services still reference legacy model concepts (high risk)
- `referenceDataService` uses `Item` and `isActive` assumptions that do not match active model registration and canonical Goods/Location status behavior.
- `dashboardService.getMovementTrends` uses legacy `Movement` model pattern instead of `MovementHeader`.

These can manifest as “not found” or undefined model errors even with an otherwise valid DB.

### 6) Audit log controller-service contract mismatch (medium risk)
- Controller passes `moduleName` filter while service expects `entity`.
- Controller calls `getModuleNames()` but service exports `getEntityNames()`.

This causes runtime errors on audit endpoints regardless of DB correctness.

### 7) Router/docs drift around legacy reference-data naming (low/medium risk)
`reference-data` routes and comments still refer to `/items` and old semantics, reinforcing legacy paths that are no longer canonical.

### 8) Utils/constants are mostly correct for active movement guards (good)
`ACTIVE_MOVEMENT_STATUSES` aligns with location/user/adjustment guard logic and is consistently reused.

---

## Why this causes “not found” in practice

Your observed “not found” behavior is consistent with this pattern:
- App services query **current canonical tables/columns**.
- The DB (from the migration chain) may contain **legacy/duplicate/partially upgraded** versions.
- Queries then return missing rows or fail joins because records are created in an alternate table/shape.

Common examples:
- Services query `stock` while DB has data in `stocks`.
- Movement detail expects `goods_id`, but historical schema left `itemId` relationship.
- Role/location constraints fail because enum/column setup diverged during migrations.

---

## Recommended Improvements (Prioritized)

### P0 — Make schema deterministic (must do first)
1. **Create a single canonical baseline migration set** for current architecture (users/roles/permissions/categories/vendors/locations/goods/stock/stock_adjustments/movement_headers/movement_details/movement_requests/audit_logs/location_logs).
2. **Archive or disable duplicate legacy create-table migrations** to prevent re-creating the same tables.
3. **Unify stock table naming** (`stock` only) and provide one idempotent data-move migration from `stocks` if needed.
4. **Enforce one canonical movement detail FK** (`goods_id -> goods.id`) and remove residual `items` dependencies.

### P1 — Align application contracts
5. Fix audit log contract mismatch:
   - controller filter key should match service (`entity`),
   - controller should call `getEntityNames()`.
6. Replace legacy references in active services:
   - `referenceDataService`: use `Goods`, `Location.status`, `Stock` + `goods` association.
   - `dashboardService.getMovementTrends`: source from `MovementHeader`.

### P2 — Guard against regression
7. Add a CI schema-conformance check that fails if active services reference legacy models (`Item`, `Movement`, `Good`) in runtime paths.
8. Add an integration smoke test that boots app against a fresh migrated DB and validates core endpoints:
   - auth login,
   - locations/goods lookup,
   - create movement preview,
   - create stock adjustment request.

---

## Practical rollout plan

1. Freeze migration folder changes.
2. Generate a clean canonical migration pack (or squashed baseline + forward diffs).
3. Validate with `sequelize-cli db:migrate` on an empty DB.
4. Run service-level smoke tests against this fresh DB.
5. Cut over environments with data migration scripts where legacy table names differ (`stocks` -> `stock`, `itemId` -> `goods_id`).

---

## Final Assessment

- **Business-function logic in services is mostly mature.**
- **Database creation path is the main instability point.**
- To stop recurring `not found` errors, the highest ROI is to **stabilize migrations into one deterministic, canonical schema path** and remove legacy model/table references from active service code.
