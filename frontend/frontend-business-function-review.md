# Frontend Business Function Support Review

## Scope
Reviewed frontend implementation against `ai-system-architecture.md` and current backend service contracts.

Reviewed folders:
- `frontend/src/pages`
- `frontend/src/services`
- `frontend/src/components`
- `frontend/src/layouts`
- `frontend/src/utils`

---

## Executive Summary

Frontend has strong route/module coverage for all core areas (dashboard, goods, stock, stock adjustments, movement requests, movements, users, locations, categories, vendors, audit logs), but there are important **contract drift issues** that can block canonical business flows at runtime.

Primary risk theme: several UI/service paths still use legacy field names or status names (`itemId`, `sku`, `code`, `PENDING_DESTINATION_APPROVAL` in movement request page context) that are inconsistent with canonical backend entities (`goodsId`, `productId`, `location.name`, `MovementRequest` statuses).

---

## Coverage Matrix

| Core module | Frontend coverage | Status | Notes |
|---|---|---|---|
| Goods | `GoodsPage`, `goodsService` | ✅ Covered | Uses `/goods` endpoints and canonical productId naming in service payload comments. |
| Locations | `LocationsPage`, `locationService` | ✅ Covered | Admin route protection aligns with architecture admin module access. |
| Users | `admin/UsersPage`, `userService` | ✅ Covered | CRUD and impact endpoint wired. |
| Roles & Permissions | `AdminRoute`, `utils/permissions.js`, sidebar gating | ✅ Covered | Client-side mirror exists; backend remains source of truth. |
| Stock | `StockPage`, `stockService` | ✅ Covered | Includes period summary usage via dashboard service. |
| Stock Adjustments | `StockAdjustmentsPage`, `stockAdjustmentService` | ⚠️ Partial drift | UI still renders location `code` that canonical location model does not expose. |
| Movement Requests (simple) | `MovementRequestsPage`, `movementRequestService` | ⚠️ Drift | Page uses MovementHeader-style statuses in places where MovementRequest statuses differ. |
| Movements (full workflow) | movement pages + `movementService` | ⚠️ Drift | New movement form still sends `itemId` rows while backend expects `goodsId`. |
| Approval System | movement detail/list pages | ✅ Mostly covered | Recall/reject/finalize flows are present in UI. |
| Audit Log | `AuditLogPage`, `auditLogService` | ✅ Mostly covered | `/audit-logs/modules` naming still legacy but backend route currently supports it. |
| Dashboard | `DashboardPage`, filters/charts/services | ⚠️ Partial drift | Some view fields still use legacy `good.sku` assumptions. |
| Admin panel modules | routed via `AdminRoute` | ✅ Covered | Includes users, locations, categories, vendors, audit log routes. |
| Categories | `CategoriesPage`, `categoryService` | ✅ Covered | Present and routed. |
| Vendors | `VendorsPage`, `vendorService` | ✅ Covered | Present and routed. |

---

## Detailed Findings (High Priority)

1. **Movement creation UI still uses legacy `itemId` model**
   - `MovementNewPage` row shape is `itemId`, stock lookup uses `stock.itemId`, and submission sends `items: [{ itemId, quantity }]`.
   - Canonical backend movement payload requires `goodsId` in each item row.
   - Impact: movement creation can fail validation / produce "not found" behavior.

2. **Movement service reference-data endpoints are legacy-shaped**
   - `movementService.listItems()` calls `/items` at root; canonical reference data is served under `/reference-data` (with goods semantics).
   - `movementService.listLocations()` and `getStocksByLocation()` also call root paths instead of reference-data scoped endpoints.
   - Impact: endpoint mismatch risk and inconsistent response shape assumptions.

3. **Movement request page status mapping mixes wrong workflow statuses**
   - `MovementRequestsPage` contains `PENDING_DESTINATION_APPROVAL` status label/style usage, which belongs to MovementHeader workflow, not MovementRequest status enum.
   - Impact: incorrect action button visibility and status rendering for simple movement-request workflow.

4. **Frontend still reads non-canonical location and goods display fields in key pages**
   - Multiple pages render `location.code` and dashboard table renders `good.sku`, while canonical models emphasize `name` and `productId`.
   - Impact: blank UI values, wrong assumptions, and fragile rendering.

---

## Medium Priority Findings

5. **Audit log frontend naming remains module-oriented**
   - Service function name `fetchAuditModules` and page naming still imply module lists, while backend now conceptually returns entities.
   - Impact: semantic drift (not necessarily runtime breakage).

6. **Contract consistency checks are missing on frontend**
   - There is no automated guard similar to backend legacy-model checker to prevent reintroduction of legacy response-field usage (`sku`, `itemId`, `code`).

---

## Recommended Improvements

### P0 (Correctness)
1. Refactor movement creation frontend to canonical payload and fields:
   - `itemId` -> `goodsId`
   - stock lookup by `goodsId`
   - selectors using `goods.name` + `goods.productId`
2. Update movement service reference-data calls to canonical paths:
   - `/reference-data/goods`
   - `/reference-data/locations`
   - `/reference-data/stocks?locationId=`
3. Fix `MovementRequestsPage` status map/buttons to only use MovementRequest statuses:
   - `PENDING`, `IN_TRANSIT`, `APPROVED`, `COMPLETED`, `CANCELLED`, `REJECTED`

### P1 (Alignment)
4. Replace lingering `code`/`sku` display dependencies with canonical fields (`name`, `productId`).
5. Rename audit log UI helpers from modules -> entities to match backend semantics.

### P2 (Regression Guard)
6. Add a frontend contract-check script to flag legacy fields/usages in `pages/services` (e.g., `itemId` for movements, `good.sku`, `location.code`, MovementHeader-only statuses inside movement-request pages).

---

## Final Assessment

Frontend supports the majority of required business modules and route-level access controls, but **full support for canonical business functions is currently partial due to request/field contract drift in movement-related and display paths**. Addressing the P0 items will materially improve end-to-end compatibility with backend services and architecture rules.
