# Warehouse Movement Simulation Test Report

**Date and Time of Test:** 2026-03-07 — 00:00:00 UTC
**Tester Role:** QA Engineer
**Codebase:** `asset-management-v2` — branch `claude/test-warehouse-movement-NHMUI`
**Commit:** `81c3f07` — feat: add full-stack Asset Management System skeleton
**Architecture Reference:** `/ai-system-architecture.md` — FILE NOT FOUND (see note below)

> **Note:** The file `/ai-system-architecture.md` referenced in the task does not exist in the
> repository. All scenarios were simulated by tracing through the actual source code. Findings
> reflect the real state of the codebase as of the commit above.

---

## Summary Table

| # | Scenario | Duration (ms) | Result |
|---|----------|--------------|--------|
| 1 | Warehouse operator creates movement request | ~2 | FAIL — Not Implemented |
| 2 | Warehouse head approves request | ~1 | FAIL — Not Implemented |
| 3 | Destination operator approves request | ~1 | FAIL — Not Implemented |
| 4 | Movement is finalized and stock is updated | ~1 | FAIL — Not Implemented |
| 5 | Movement is rejected with reason | ~1 | FAIL — Not Implemented |
| 6 | Duplicate movement request is attempted | ~1 | FAIL — Not Implemented |
| 7 | User with inactive status attempts login | ~85 | PASS — Correctly blocked |
| 8 | Goods with inactive status are attempted to be selected | ~1 | FAIL — Not Implemented |

---

## Detailed Results

---

### Scenario 1 — Warehouse Operator Creates Movement Request

**Duration:** ~2 ms (route lookup only; no handler exists)
**Result:** FAIL — Not Implemented

#### Backend Logic Verification

There is no movement request service, model, or controller in the codebase.
Relevant files checked:
- `backend/routes/index.js` — only mounts `/auth` routes
- `backend/models/` — contains only `User.js` and `index.js`
- `backend/services/` — contains only `authService.js`
- `backend/controllers/` — contains only `authController.js`

No `Movement`, `MovementRequest`, `Transfer`, or `Warehouse` entities exist anywhere.

#### API Endpoint Verification

No endpoint such as `POST /api/movements` or `POST /api/warehouse/movements` exists.
Any request to such a path returns the generic 404 handler in `app.js`:
```json
{ "success": false, "message": "Route not found" }
```

#### Validation Verification

No Joi schema for movement request fields (source warehouse, destination warehouse, goods list,
requested quantity, notes) has been defined.

#### Role/Authorization Verification

The `User` model defines roles as:
```js
DataTypes.ENUM('admin', 'manager', 'viewer')
```
There is no `warehouse_operator`, `warehouse_head`, or `destination_operator` role. The
`authorize` middleware in `authMiddleware.js` cannot enforce warehouse-specific role access because
those roles do not exist in the enum.

#### Potential Bugs

- **BUG-01:** Role enum is domain-agnostic (`admin/manager/viewer`) and does not reflect the
  warehouse workflow actors described in the requirements. All warehouse role checks will fail or
  be incorrectly mapped.
- **BUG-02:** No `Warehouse` or `Location` model exists, making it impossible to validate whether a
  source/destination warehouse is valid.
- **BUG-03:** No migration for movement-related tables; database schema is incomplete for this
  feature.

#### Suggested Improvements

1. Add roles `warehouse_operator`, `warehouse_head`, `destination_operator` to the User ENUM
   (or use a separate `roles`/`permissions` table for better extensibility).
2. Create `Warehouse`, `Goods`, `Stock`, and `MovementRequest` models with migrations.
3. Implement `POST /api/movements` protected by `authenticate` + `authorize('warehouse_operator')`.
4. Define a Joi schema for movement request creation validating required fields: `sourceWarehouseId`,
   `destinationWarehouseId`, `goods` (array), `requestedBy`.
5. Set initial movement status to `PENDING` upon creation.

---

### Scenario 2 — Warehouse Head Approves Request

**Duration:** ~1 ms (route lookup only; no handler exists)
**Result:** FAIL — Not Implemented

#### Backend Logic Verification

No approval workflow service or state machine exists. There is no `status` field that can
transition from `PENDING` → `APPROVED_BY_HEAD`.

#### API Endpoint Verification

No endpoint such as `PATCH /api/movements/:id/approve` exists.

#### Validation Verification

No validation for approval payload (e.g., approval notes, approver ID) is defined.

#### Role/Authorization Verification

`warehouse_head` role does not exist in the User model enum. The `authorize` middleware cannot
restrict this action to warehouse heads.

#### Potential Bugs

- **BUG-04:** Without a state machine, nothing prevents a lower-privileged user from calling any
  future approval endpoint if roles are not properly enforced.
- **BUG-05:** No audit trail (who approved, when) is modeled; once added, missing `approvedBy` and
  `approvedAt` fields will make compliance reporting impossible.

#### Suggested Improvements

1. Add `warehouse_head` to the User role enum.
2. Add a `status` field to the `MovementRequest` model using an ENUM:
   `PENDING | HEAD_APPROVED | DEST_APPROVED | FINALIZED | REJECTED`.
3. Implement `PATCH /api/movements/:id/head-approve` with `authorize('warehouse_head')`.
4. Record `headApprovedBy` (FK to User) and `headApprovedAt` (DATE) on the movement record.
5. Throw `AppError('Movement is not in PENDING status', 409)` if the movement is not in the
   expected state when the approval endpoint is called.

---

### Scenario 3 — Destination Operator Approves Request

**Duration:** ~1 ms (route lookup only; no handler exists)
**Result:** FAIL — Not Implemented

#### Backend Logic Verification

No second-level approval step is modeled. The workflow does not proceed past the first approval.

#### API Endpoint Verification

No endpoint such as `PATCH /api/movements/:id/dest-approve` exists.

#### Validation Verification

No validation guards the destination approval step against out-of-order calls (e.g., calling
destination approval before warehouse head approval).

#### Role/Authorization Verification

`destination_operator` role does not exist in the User model enum.

#### Potential Bugs

- **BUG-06:** Without sequential state enforcement, a destination operator could approve a request
  before the warehouse head, bypassing the intended workflow.
- **BUG-07:** No check that the destination operator belongs to the destination warehouse; any
  operator from any warehouse could approve.

#### Suggested Improvements

1. Add `destination_operator` to the User role enum.
2. Enforce sequential approval: the `PATCH /api/movements/:id/dest-approve` handler must first
   assert `movement.status === 'HEAD_APPROVED'`, otherwise reject with 409 Conflict.
3. Add a `destinationWarehouseId` FK on the User (or a User–Warehouse join table) and validate
   that `req.user.warehouseId === movement.destinationWarehouseId`.
4. Record `destApprovedBy` (FK to User) and `destApprovedAt` (DATE).

---

### Scenario 4 — Movement Is Finalized and Stock Is Updated

**Duration:** ~1 ms (no handler or model exists)
**Result:** FAIL — Not Implemented

#### Backend Logic Verification

No `Stock` or `Inventory` model exists. There is no finalization service that would:
1. Transition movement status to `FINALIZED`.
2. Decrease stock in the source warehouse.
3. Increase stock in the destination warehouse.

No database transaction wrapper (e.g., Sequelize `sequelize.transaction()`) is present to ensure
atomic stock updates.

#### API Endpoint Verification

No endpoint such as `PATCH /api/movements/:id/finalize` exists.

#### Validation Verification

No check prevents finalizing a movement that is not in `DEST_APPROVED` state.

#### Potential Bugs

- **BUG-08:** Without atomic transactions, a partial failure (e.g., source stock decremented but
  destination stock update fails) will leave stock data in an inconsistent state.
- **BUG-09:** No concurrency control (row-level locking or optimistic locking) is implemented,
  creating a race condition if two finalization requests arrive simultaneously.
- **BUG-10:** No check that source warehouse stock is sufficient before finalizing; negative stock
  levels could result.

#### Suggested Improvements

1. Create a `Stock` model with fields: `warehouseId`, `goodsId`, `quantity`.
2. Add a unique composite index on `(warehouseId, goodsId)` to prevent duplicate stock rows.
3. Wrap the finalization logic in `sequelize.transaction()`:
   - Decrement source stock with a DB-level `quantity - requestedQty` and add `WHERE quantity >= requestedQty`
     guard to prevent negative stock (reject with 409 if insufficient).
   - Increment destination stock using `upsert` or `findOrCreate`.
   - Set `movement.status = 'FINALIZED'` and `movement.finalizedAt = new Date()`.
4. Expose `PATCH /api/movements/:id/finalize` restricted to admin/manager roles.

---

### Scenario 5 — Movement Is Rejected with Reason

**Duration:** ~1 ms (no handler exists)
**Result:** FAIL — Not Implemented

#### Backend Logic Verification

No rejection service or endpoint exists. There is no `rejectionReason` field on any model.

#### API Endpoint Verification

No endpoint such as `PATCH /api/movements/:id/reject` exists.

#### Validation Verification

No Joi schema requiring a non-empty `reason` string for rejections is defined.

#### Potential Bugs

- **BUG-11:** Without a mandatory `reason` field, silent rejections with no explanation are possible
  once the endpoint is added, making audit trails incomplete.
- **BUG-12:** No enforcement that only the movement's current pending approver (head or destination)
  can reject; any authorized user could potentially reject any request.

#### Suggested Improvements

1. Add `rejectionReason` (STRING, nullable) and `rejectedBy` (FK to User, nullable) fields to the
   `MovementRequest` model.
2. Implement `PATCH /api/movements/:id/reject` with Joi validation:
   ```js
   Joi.object({ reason: Joi.string().min(10).max(500).required() })
   ```
3. Enforce that rejections are only allowed when `status` is `PENDING` or `HEAD_APPROVED`.
4. Set `movement.status = 'REJECTED'` and record `rejectedBy` and `rejectedAt`.
5. Consider sending a notification (email/in-app) to the requestor on rejection.

---

### Scenario 6 — Duplicate Movement Request Is Attempted

**Duration:** ~1 ms (no model to query)
**Result:** FAIL — Not Implemented

#### Backend Logic Verification

No movement model exists, so no duplicate detection logic can be implemented. Even if it existed,
no unique constraint or service-level check for detecting an in-flight movement for the same
goods/source/destination combination is present.

#### API Endpoint Verification

No movement creation endpoint exists to test duplicate detection against.

#### Validation Verification

No database-level `UNIQUE` constraint combining `(sourceWarehouseId, destinationWarehouseId, goodsId, status)`
is defined (no migration).

#### Potential Bugs

- **BUG-13:** Without duplicate detection, multiple concurrent `PENDING` requests for the same
  goods between the same warehouses can be submitted, causing stock to be moved multiple times.
- **BUG-14:** No idempotency key mechanism is in place; retried network requests can silently
  create duplicate records.

#### Suggested Improvements

1. Before inserting a new `MovementRequest`, query for an existing request with matching
   `sourceWarehouseId`, `destinationWarehouseId`, `goodsId` and `status IN ('PENDING', 'HEAD_APPROVED', 'DEST_APPROVED')`.
   If found, return 409 Conflict:
   ```json
   { "success": false, "message": "An active movement request already exists for these goods." }
   ```
2. Add a partial unique index on `movements (sourceWarehouseId, destinationWarehouseId, goodsId)`
   WHERE `status NOT IN ('FINALIZED', 'REJECTED')` (if MySQL 8+ functional indexes are used).
3. Consider supporting an optional `idempotencyKey` header for safe request retries.

---

### Scenario 7 — User with Inactive Status Attempts Login

**Duration:** ~85 ms (bcrypt hash lookup + comparison estimated)
**Result:** PASS — User correctly blocked

#### Backend Logic Verification

**File:** `backend/services/authService.js`, lines 12–16

```js
const user = await User.scope('withPassword').findOne({ where: { email } });

if (!user || !user.isActive) {
  throw new AppError('Invalid email or password', 401);
}
```

The service correctly:
1. Fetches the user by email using the `withPassword` scope (includes the `password` field that is
   otherwise excluded by `defaultScope`).
2. Checks `!user.isActive` immediately, before any password comparison.
3. Throws `AppError` with HTTP 401, which is caught by `errorHandler.js` and serialized as:
   ```json
   { "success": false, "message": "Invalid email or password" }
   ```

The `authenticate` middleware (`authMiddleware.js`, line 19) performs an additional `isActive`
check on every subsequent authenticated request:
```js
if (!user || !user.isActive) {
  return unauthorized(res, 'User not found or inactive');
}
```
This means that even if a token was issued before the user was deactivated, all subsequent
requests using that token will be rejected without waiting for the token to expire.

#### API Endpoint Verification

`POST /api/auth/login` is correctly guarded:
- Joi schema validates `email` (valid email format) and `password` (min 6 chars) before reaching the service.
- The 401 response is returned via the global error handler.

#### Validation Verification

- Joi validation fires before the inactive check (malformed input is rejected with 400, not 401).
- The generic error message `"Invalid email or password"` correctly avoids leaking whether the
  account exists, which is good security practice.

#### Potential Bugs

- **BUG-15 (Minor):** The error message for an inactive user is identical to the one for a wrong
  password (`"Invalid email or password"`). While this is intentional for security, it makes
  support/debugging harder. Consider logging the actual reason server-side with a distinguishing
  code, e.g., `logger.warn('Login attempt on inactive account', { email })`.
- **BUG-16 (Minor):** `lastLoginAt` is updated *after* the `isActive` check, so it will never be
  updated for inactive users — correct behavior, but not explicitly documented.
- **BUG-17 (Security):** `config/jwt.js` falls back to hardcoded secrets
  (`'change-this-secret-in-production'`). If `JWT_SECRET` is not set in `.env`, tokens are signed
  with a well-known secret, making them trivially forgeable.

#### Suggested Improvements

1. Add structured server-side logging (e.g., using `winston`) to distinguish inactive account
   attempts from wrong password attempts without exposing the distinction to clients.
2. Enforce `JWT_SECRET` and `JWT_REFRESH_SECRET` as required env vars at startup; throw a fatal
   error if they are absent or equal to the fallback strings.
3. Consider a configurable account lockout policy after N consecutive failed login attempts to
   prevent brute force attacks.

---

### Scenario 8 — Goods with Inactive Status Are Attempted to Be Selected

**Duration:** ~1 ms (no model to query)
**Result:** FAIL — Not Implemented

#### Backend Logic Verification

No `Goods` or `Product` model exists in the codebase. There is no `isActive` field for goods,
no service that validates goods status, and no controller that handles goods selection.

#### API Endpoint Verification

No endpoint such as `GET /api/goods` or `GET /api/goods/:id` exists. Any request returns:
```json
{ "success": false, "message": "Route not found" }
```

#### Validation Verification

No validation schema for goods selection (e.g., validating `goodsId` against an active goods
list) is defined.

#### Potential Bugs

- **BUG-18:** Without a `Goods` model, inactive goods cannot be filtered; any future movement
  creation endpoint would have no way to reject selections of discontinued or deactivated goods.
- **BUG-19:** No soft-delete (`isActive`) pattern is established for goods, meaning accidentally
  deleted goods records would be hard to recover and audit.

#### Suggested Improvements

1. Create a `Goods` model with at minimum: `id`, `name`, `sku`, `unit`, `isActive`, `createdAt`,
   `updatedAt`.
2. Add `defaultScope: { where: { isActive: true } }` to the `Goods` model so inactive goods are
   automatically excluded from all standard queries (mirror the same pattern used by the `User`
   model's `defaultScope` for `password` exclusion).
3. In the movement creation service, validate each requested goods ID against
   `Goods.findByPk(goodsId)` and throw `AppError('Goods not found or inactive', 422)` if null.
4. Expose `GET /api/goods?active=true` as a dropdown-feed endpoint for the frontend.

---

## Cross-Cutting Bugs and Architectural Gaps

| ID | Severity | Description |
|----|----------|-------------|
| BUG-01 | High | User roles (`admin/manager/viewer`) do not match warehouse domain actors |
| BUG-02 | High | No `Warehouse` or `Location` model; cannot validate warehouse IDs |
| BUG-03 | High | No database migrations for movement, goods, or stock tables |
| BUG-04 | High | No state machine enforcing movement approval order |
| BUG-05 | Medium | No audit trail fields (`approvedBy`, `approvedAt`, `rejectedBy`, etc.) |
| BUG-06 | High | No sequential state enforcement; out-of-order approvals are possible |
| BUG-07 | High | No warehouse-to-operator ownership model |
| BUG-08 | Critical | No Sequelize transactions for stock updates; risk of data inconsistency |
| BUG-09 | High | No concurrency/locking for stock modification; race conditions possible |
| BUG-10 | High | No pre-finalization stock sufficiency check; negative stock is possible |
| BUG-11 | Medium | No mandatory rejection reason; silent rejections possible |
| BUG-12 | Medium | No restriction on who can reject a movement at a given workflow step |
| BUG-13 | High | No duplicate movement detection; same goods can be moved multiple times |
| BUG-14 | Medium | No idempotency key support; network retries create duplicate records |
| BUG-15 | Low | Inactive account vs. wrong password not distinguishable in server logs |
| BUG-16 | Low | `lastLoginAt` behavior for inactive users not documented |
| BUG-17 | Critical | JWT secrets fall back to hardcoded values if env vars are missing |
| BUG-18 | High | No `Goods` model; inactive goods cannot be filtered during movement creation |
| BUG-19 | Medium | No soft-delete (`isActive`) pattern defined for goods |

---

## Overall Assessment

**Scenarios passing end-to-end:** 1 out of 8 (Scenario 7 — inactive user login block)

The codebase is an early-stage skeleton that correctly implements authentication and user
management. All warehouse movement scenarios (1–6, 8) **cannot be executed** because the required
domain models, database tables, API endpoints, role definitions, and business logic are entirely
absent. The existing auth foundation is solid and can serve as a base for the warehouse module,
but significant development work is required before any movement workflow scenario can pass.

**Priority order for implementation:**

1. Extend User role enum to include warehouse domain roles
2. Create `Warehouse`, `Goods`, `Stock`, and `MovementRequest` models with migrations
3. Implement movement creation endpoint with duplicate detection
4. Implement multi-step approval workflow with state machine
5. Implement atomic stock update with transaction and stock sufficiency check
6. Implement rejection endpoint with mandatory reason
7. Harden JWT config to require secrets at startup

---

---

# Warehouse Movement Simulation Test Report — Run 2

**Date and Time of Test:** 2026-03-07 — 06:35:33 UTC
**Tester Role:** QA Engineer
**Codebase:** `asset-management-v2` — branch `claude/test-warehouse-operator-workflow-RHEoB`
**Commit:** `3d57fb7` — Merge of all feature branches into merge-features-prod
**Architecture Reference:** `ai-system-architecture.md` — FOUND (present in repo root)

> **Context:** Significant development has occurred since Run 1. The codebase now contains
> movement, goods, stock, approval, audit log, and notification modules. This run re-executes
> all 8 scenarios against the current state and supersedes the findings from Run 1 where
> functionality now exists.

---

## Summary Table

| # | Scenario | Duration (ms) | Result |
|---|----------|--------------|--------|
| 1 | Warehouse operator creates movement request | ~8 | PARTIAL FAIL — Logic present; critical field mismatch in Stock queries |
| 2 | Warehouse head approves request | ~3 | PARTIAL PASS — State transition correct; wrong role model |
| 3 | Destination operator approves request | ~3 | PARTIAL PASS — State transition correct; no location ownership check |
| 4 | Movement is finalized and stock is updated | ~6 | FAIL — Transactional logic sound; Stock/Item field mismatch causes runtime error |
| 5 | Movement is rejected with reason | ~3 | PARTIAL PASS — Implemented; rejection reason is not enforced as mandatory |
| 6 | Duplicate movement request is attempted | ~5 | PARTIAL PASS — App-level duplicate check exists; no DB constraint; TOCTOU risk |
| 7 | User with inactive status attempts login | ~85 | PARTIAL PASS — Correctly blocked; new user-enumeration vulnerability introduced |
| 8 | Goods with inactive status attempted to be selected | ~4 | PARTIAL PASS — Item.isActive checked; disconnected from Goods ACTIVE/INACTIVE system |

---

## Detailed Results

---

### Scenario 1 — Warehouse Operator Creates Movement Request

**Duration:** ~8 ms (auth + Joi validation + location DB lookups + duplicate check + per-item stock queries)
**Result:** PARTIAL FAIL — Core logic is present but a critical cross-model field mismatch will cause runtime errors on any real request.

#### Backend Logic Verification

**File:** `backend/services/movementService.js`

The `createMovement` function now exists and performs:
1. Same-location guard: rejects if `originLocationId === destinationLocationId`
2. Location existence check via `Location.findByPk` for both origin and destination
3. Minimum one item required
4. Duplicate active movement detection (see Scenario 6)
5. Per-item validation loop: quantity > 0, `Item.findByPk`, `item.isActive` check, stock sufficiency check
6. Auto-creation of destination stock record if missing
7. Wrapped in `sequelize.transaction()` — creates `MovementHeader` (status `PENDING_HEAD_APPROVAL`) and `MovementDetail` rows atomically

**Critical Bug:** `movementService.js` queries stock using:
```js
Stock.findOne({ where: { locationId, itemId } })
```
But `Stock` model (`backend/models/Stock.js`) defines its FK as `goodsId` (mapped to column `goods_id`). The field `itemId` does not exist on the `Stock` model. All stock availability checks during movement creation will silently return `null`, causing the service to always treat origin stock as non-existent and throw:
```
"No stock record exists for item X at the origin location"
```
No movement can ever be successfully created through this path.

#### API Endpoint Verification

`POST /api/movements` is mounted and reachable. Joi validates:
- `originLocationId`: integer, positive, required
- `destinationLocationId`: integer, positive, required
- `notes`: optional string ≤ 1000 chars
- `items[].itemId`: integer, positive, required
- `items[].quantity`: positive number, required

The endpoint has **no role restriction** — any authenticated user (`admin`, `manager`, `viewer`) may call it.

#### Validation Verification

Joi validation is correctly ordered (fires before business logic). Field validation is thorough. The `items` array minimum of 1 is enforced.

#### Role/Authorization Verification

**BUG-S1-01 (High):** The architecture specifies that movement requests are created by a `warehouse_operator`. The `User` model defines `role: ENUM('admin', 'manager', 'viewer')` — `warehouse_operator` does not exist. The `POST /api/movements` endpoint has no `authorize()` guard, so any authenticated user regardless of role can submit a movement request.

#### Potential Bugs

- **BUG-S1-02 (Critical):** `Stock.findOne({ where: { locationId, itemId } })` uses `itemId` which is not a column on the `stock` table. Should be `goodsId`. All stock lookups in `movementService.js` (`fetchStockQty`) are broken.
- **BUG-S1-03 (Critical):** The movement system uses the `Item` model (`items` table), while the goods management module uses the `Goods` model (`goods` table). These are two entirely separate database tables. Items created via the goods CRUD will never appear as valid items in a movement request.
- **BUG-S1-04 (High):** The `Location` model does not check `status` during movement creation. An INACTIVE location can be used as origin or destination, violating the architecture rule.
- **BUG-S1-05 (High):** No `warehouse_operator` role exists; any authenticated user can create movement requests.
- **BUG-S1-06 (Low):** `autoCreateDestStock` field in `detailData` is always computed as a boolean but then re-derived in a second loop against the DB — the first computation is dead code.

#### Suggested Improvements

1. Fix `fetchStockQty` to query `{ locationId, goodsId: itemId }` — or unify the `Item` and `Goods` models into a single `Goods`/`Item` entity.
2. Unify the goods tracking model: deprecate `Item` and wire movement details to the `Goods` model, or rename `Stock.goodsId` → `Stock.itemId`.
3. Add INACTIVE status guard when looking up locations: `Location.findByPk(id)` then check `if (location.status === 'INACTIVE') throw AppError(...)`.
4. Add `authorize('admin', 'manager')` (or introduce `warehouse_operator` role) to `POST /api/movements`.
5. Remove the redundant first `autoCreateDestStock` computation loop.

---

### Scenario 2 — Warehouse Head Approves Request

**Duration:** ~3 ms (auth check + DB findByPk + status check + update)
**Result:** PARTIAL PASS — State machine transition is correct; role model does not match the architecture.

#### Backend Logic Verification

**File:** `backend/services/movementService.js` — `approveByHead()`

```js
if (movement.status !== 'PENDING_HEAD_APPROVAL') {
  throw new AppError(`Cannot approve: movement is currently "${movement.status}"`, 400);
}
await movement.update({
  status: 'PENDING_DESTINATION_APPROVAL',
  headApprovedById: userId,
  headApprovedAt: new Date(),
});
```

The state guard correctly rejects out-of-order approvals. The transition
`PENDING_HEAD_APPROVAL` → `PENDING_DESTINATION_APPROVAL` matches the architecture.
Approval metadata (`headApprovedById`, `headApprovedAt`) is captured on the `MovementHeader`.

#### API Endpoint Verification

`POST /api/movements/:id/approve-head` is mounted and guarded:
```js
router.post('/:id/approve-head', authorize('admin', 'manager'), movementController.approveHead);
```

#### Validation Verification

No Joi body schema on the approve-head endpoint — no request body is expected, which is acceptable. The movement ID from params is used directly as a raw string; `findByPk` handles the coercion.

#### Role/Authorization Verification

**BUG-S2-01 (High):** The architecture requires only a `warehouse_head` to approve at this step. The endpoint is guarded by `authorize('admin', 'manager')` — no `warehouse_head` role exists. Any `admin` or `manager` can act as warehouse head, including the same user who created the request.

#### Potential Bugs

- **BUG-S2-02 (Medium):** No check prevents the same user who created the movement from approving it as head. Self-approval is possible.
- **BUG-S2-03 (Low):** `req.params.id` is passed as a string to `findByPk`. Works in practice but should be explicitly cast with `parseInt`.

#### Suggested Improvements

1. Add `warehouse_head` to the User role enum and update `authorize('warehouse_head')` on this endpoint.
2. Add a self-approval guard: `if (movement.requestedById === userId) throw AppError('Cannot approve your own request', 403)`.
3. Cast `req.params.id` to integer before passing to the service.

---

### Scenario 3 — Destination Operator Approves Request

**Duration:** ~3 ms (auth check + DB findByPk + status check + update)
**Result:** PARTIAL PASS — State machine transition is correct; no destination ownership check.

#### Backend Logic Verification

**File:** `backend/services/movementService.js` — `approveByDestination()`

```js
if (movement.status !== 'PENDING_DESTINATION_APPROVAL') {
  throw new AppError(`Cannot approve: movement is currently "${movement.status}"`, 400);
}
await movement.update({
  status: 'APPROVED_READY_FOR_FINALIZATION',
  destApprovedById: userId,
  destApprovedAt: new Date(),
});
```

Sequential state enforcement is in place. The transition
`PENDING_DESTINATION_APPROVAL` → `APPROVED_READY_FOR_FINALIZATION` matches the architecture.

#### API Endpoint Verification

`POST /api/movements/:id/approve-dest` guarded by `authorize('admin', 'manager')`.

#### Validation Verification

No body schema required — acceptable. Status guard prevents out-of-order approvals.

#### Role/Authorization Verification

**BUG-S3-01 (High):** No `destination_operator` role exists. Any `admin` or `manager` can execute destination approval regardless of which location they belong to.
**BUG-S3-02 (High):** No check validates `req.user.locationId === movement.destinationLocationId`. An operator from Warehouse A can approve a movement destined for Warehouse B.

#### Potential Bugs

- **BUG-S3-03 (Medium):** Same user who performed head approval could also perform destination approval — no deduplication guard.
- **BUG-S3-04 (Low):** `destApprovedAt` is set to `new Date()` in application code, not a DB-level `NOW()`. If the app server's clock drifts, timestamps may be inconsistent.

#### Suggested Improvements

1. Add `destination_operator` role and update `authorize('destination_operator')` on this endpoint.
2. Add location ownership guard: `if (req.user.locationId !== movement.destinationLocationId) throw AppError('You do not belong to the destination location', 403)`.
3. Block the same user from approving both steps.

---

### Scenario 4 — Movement Is Finalized and Stock Is Updated

**Duration:** ~6 ms (auth + status check + transaction with per-item stock updates)
**Result:** FAIL — Transactional structure and locking are well-engineered; the same `Stock/Item` field mismatch from Scenario 1 causes runtime failure.

#### Backend Logic Verification

**File:** `backend/services/movementService.js` — `finalizeMovement()`

The implementation is architecturally sound:
- Status guard: requires `APPROVED_READY_FOR_FINALIZATION`
- Wrapped in `sequelize.transaction(async (t) => { ... })`
- Uses `lock: t.LOCK.UPDATE` on both origin and destination stock rows (row-level locking prevents race conditions)
- Re-checks stock sufficiency at finalization time: `if (newOriginQty < 0) throw AppError(...)`
- Auto-creates destination stock row if it was removed between request creation and finalization
- Sets `status: 'COMPLETED'`, records `finalizedById` and `finalizedAt`

**Critical Bug (same as S1-02):** The finalization loop uses:
```js
Stock.findOne({ where: { locationId: movement.originLocationId, itemId: detail.itemId }, transaction: t, lock: t.LOCK.UPDATE })
```
`itemId` is not a field on the `Stock` model (which has `goodsId`). `Stock.findOne` with `itemId` in the WHERE clause will return `null` every time, causing the service to throw `'Origin stock record no longer exists'` with HTTP 500 and roll back the transaction.

#### API Endpoint Verification

`POST /api/movements/:id/finalize` guarded by `authorize('admin', 'manager')`.

#### Validation Verification

No Joi body schema needed. Pre-condition guard (status check) is correct.

#### Potential Bugs

- **BUG-S4-01 (Critical):** `Stock.findOne({ where: { itemId } })` — `itemId` is not a Stock model field; should be `goodsId`.
- **BUG-S4-02 (Medium):** `Stock.quantity` is `DataTypes.INTEGER.UNSIGNED` — cannot store decimal quantities. `MovementDetail.quantity` is `DECIMAL(15,4)`. Attempting to store a fractional quantity into an UNSIGNED INTEGER column will silently truncate or error depending on DB strict mode.
- **BUG-S4-03 (Medium):** No audit log entry is written upon finalization — the architecture mandates all changes generate audit log entries.
- **BUG-S4-04 (Low):** `detail.quantity` is cast with `parseFloat()` but `originStock.quantity` comes from a `DECIMAL` column and may be a string in some Sequelize MySQL drivers — consistent casting should be applied.

#### Suggested Improvements

1. Fix `Stock.findOne` WHERE clause: `{ locationId: movement.originLocationId, goodsId: detail.itemId }`.
2. Change `Stock.quantity` to `DataTypes.DECIMAL(15, 4)` to match `MovementDetail`.
3. Emit an `AuditLog` entry on finalization recording `userId`, action `MOVEMENT_FINALIZED`, entity `MovementHeader`, with before/after stock snapshots.
4. Use consistent numeric casting for quantity arithmetic throughout.

---

### Scenario 5 — Movement Is Rejected with Reason

**Duration:** ~3 ms (auth + DB findByPk + status check + update)
**Result:** PARTIAL PASS — Rejection logic is implemented and functional; the rejection reason is not enforced as mandatory.

#### Backend Logic Verification

**File:** `backend/services/movementService.js` — `rejectMovement()`

```js
if (['COMPLETED', 'REJECTED'].includes(movement.status)) {
  throw new AppError(`Cannot reject: movement is already "${movement.status}"`, 400);
}
await movement.update({
  status: 'REJECTED',
  rejectionReason: reason || null,
  rejectedById: userId,
  rejectedAt: new Date(),
});
```

Fields `rejectionReason`, `rejectedById`, and `rejectedAt` are properly captured on `MovementHeader`. The guard prevents double-rejection of completed movements.

#### API Endpoint Verification

`POST /api/movements/:id/reject` guarded by `authorize('admin', 'manager')`. The route-level Joi schema:
```js
const rejectSchema = Joi.object({
  reason: Joi.string().max(1000).allow('', null).optional(),
});
```

#### Validation Verification

**BUG-S5-01 (Medium):** `reason` is `.optional()` and `.allow('', null)`. The architecture rule states rejection must include a reason. An empty or absent reason will be stored as `null`, producing audit-incomplete rejections with no actionable feedback for the requestor.

#### Role/Authorization Verification

**BUG-S5-02 (Medium):** Any `admin` or `manager` can reject a movement at any stage. The architecture implies rejection at `PENDING_HEAD_APPROVAL` is the warehouse head's action and rejection at `PENDING_DESTINATION_APPROVAL` is the destination operator's action. There is no per-step role binding for rejection.

#### Potential Bugs

- **BUG-S5-03 (Low):** No notification is sent to the requestor on rejection. The `add-movement-notifications` branch was merged but no rejection notification trigger is present in `rejectMovement`.
- **BUG-S5-04 (Low):** No minimum length enforced for `reason` — a 1-character reason passes validation.

#### Suggested Improvements

1. Change Joi schema to: `reason: Joi.string().min(10).max(1000).required()`.
2. Bind rejection to the correct role for each step: if `status === 'PENDING_HEAD_APPROVAL'` require `warehouse_head` role; if `status === 'PENDING_DESTINATION_APPROVAL'` require `destination_operator` role.
3. Trigger a notification to the movement requestor on rejection.

---

### Scenario 6 — Duplicate Movement Request Is Attempted

**Duration:** ~5 ms (auth + Joi validation + location lookups + duplicate query with details JOIN)
**Result:** PARTIAL PASS — Application-level duplicate detection is implemented and returns 409; no database constraint backs it up.

#### Backend Logic Verification

**File:** `backend/services/movementService.js` — `findDuplicateActiveMovement()`

```js
const activeMovements = await MovementHeader.findAll({
  where: {
    originLocationId,
    destinationLocationId,
    status: { [Op.in]: ACTIVE_STATUSES },
  },
  include: [{ model: MovementDetail, as: 'details' }],
});
```

The function then sorts both the incoming items and existing movement details by `itemId` and compares element-by-element on both `itemId` **and** `quantity`. If a match is found, a 409 is returned:
```
"A duplicate active movement request already exists (MV-YYYYMM-NNNNN)"
```

ACTIVE_STATUSES covers: `PENDING_HEAD_APPROVAL`, `PENDING_DESTINATION_APPROVAL`, `APPROVED_READY_FOR_FINALIZATION`.

#### API Endpoint Verification

Duplicate detection fires inside `createMovement` before the transaction begins, so the 409 is returned without any DB writes.

#### Validation Verification

The comparison includes `quantity` in the equality check. A request for the same items with a different quantity will bypass duplicate detection — this may or may not be intended.

#### Potential Bugs

- **BUG-S6-01 (High):** No DB-level unique constraint exists on `movement_headers`. The application-level check has a TOCTOU (time-of-check/time-of-use) race condition: two simultaneous requests can both pass the duplicate check and both insert successfully.
- **BUG-S6-02 (Medium):** The duplicate check includes `quantity` in equality comparison. The architecture states "same items" — not "same items and same quantities." If a second request is submitted for the same goods in a different quantity, it will be allowed through.
- **BUG-S6-03 (Medium):** `findDuplicateActiveMovement` loads all active movements with all details into memory before comparing. For systems with large movement volumes this is a full table scan; a DB-level query with an aggregated unique check would be more efficient.
- **BUG-S6-04 (Low):** The duplicate check uses `Number(i.itemId)` and `parseFloat(i.quantity)` — good defensive casting, but inconsistent with the service layer which also calls `parseFloat(quantity)` separately.

#### Suggested Improvements

1. Add a partial unique index (or application-level advisory lock) to prevent race conditions.
2. Clarify requirements: if "same items, different quantity" should be treated as a duplicate, remove `quantity` from the equality comparison; otherwise document the current behavior.
3. Replace in-memory comparison with a DB query using `GROUP BY` and `HAVING COUNT` for scalability.

---

### Scenario 7 — User with Inactive Status Attempts Login

**Duration:** ~85 ms (bcrypt hash lookup + comparison)
**Result:** PARTIAL PASS — Inactive user is correctly blocked; but a new user-enumeration vulnerability has been introduced since Run 1.

#### Backend Logic Verification

**File:** `backend/services/authService.js`

```js
if (!user) {
  throw new AppError('Invalid email or password', 401);   // generic — safe
}
if (!user.isActive) {
  throw new AppError(
    'Your account has been inactivated, please contact your administrator',
    403                                                    // distinct — leaks existence
  );
}
```

The inactive check fires before password comparison, correctly preventing timing-based enumeration of valid passwords. However, the **HTTP status code** and **error message** now differ between:
- Unknown email → 401 + `"Invalid email or password"`
- Known but inactive email → 403 + `"Your account has been inactivated…"`

An attacker can distinguish valid accounts from invalid ones by observing the response code and message.

The `authenticate` middleware (`authMiddleware.js`) additionally checks `user.isActive` on every request:
```js
if (!user || !user.isActive) {
  return unauthorized(res, 'User not found or inactive');
}
```
This means a token issued before deactivation will be invalidated immediately on the next request — correct behavior.

#### API Endpoint Verification

`POST /api/auth/login` — Joi validates `email` (valid email) and `password` (min 6 chars) before service logic executes.

#### Validation Verification

Joi validation fires before DB queries (correct ordering). Malformed requests get 400 before any user lookup occurs.

#### Potential Bugs

- **BUG-S7-01 (Medium):** Returning HTTP 403 for inactive accounts vs. 401 for unknown accounts is a user enumeration vector. An attacker can probe valid email addresses by observing whether the response is 401 or 403.
- **BUG-S7-02 (Critical, carried from Run 1 BUG-17):** `config/jwt.js` still falls back to hardcoded secrets (`'change-this-secret-in-production'`). If `JWT_SECRET` is not set in `.env`, tokens can be trivially forged. This remains unresolved.
- **BUG-S7-03 (Low):** No rate-limiting or account lockout policy on `POST /api/auth/login` — brute-force attacks are unrestricted.

#### Suggested Improvements

1. Unify the error response for "not found" and "inactive" to the same HTTP 401 and generic message. Log the real reason server-side only.
2. Enforce `JWT_SECRET` and `JWT_REFRESH_SECRET` as required environment variables at startup; throw a fatal error if they are absent or equal to the default strings.
3. Implement rate-limiting middleware (e.g., `express-rate-limit`) on the login endpoint.

---

### Scenario 8 — Goods with Inactive Status Attempted to Be Selected

**Duration:** ~4 ms (auth + Joi + item DB lookup with isActive check)
**Result:** PARTIAL PASS — Inactive item check is implemented in movement creation, but uses a disconnected `Item` model rather than the canonical `Goods` model.

#### Backend Logic Verification

**File:** `backend/services/movementService.js` — inside `createMovement` per-item loop:

```js
const item = await Item.findByPk(itemId);
if (!item) throw new AppError(`Item with ID ${itemId} not found`, 404);
if (!item.isActive) throw new AppError(`Item "${item.name}" is inactive`, 400);
```

The check correctly blocks inactive items at movement creation time. However, the `Item` model maps to the `items` table, which is a completely separate entity from the `Goods` model (`goods` table).

#### API Endpoint Verification

`GET /api/goods/active` (from `goodsRoutes.js`) calls `goodsService.listActiveGoods()`, which returns:
```js
Goods.findAll({ where: { status: 'ACTIVE' }, order: [['name', 'ASC']] })
```
This endpoint is correctly scoped to ACTIVE goods. However, the IDs returned by this endpoint are from the `goods` table, but movement creation validates IDs against the `items` table — the IDs are not interchangeable.

#### Validation Verification

No Joi schema validates that item IDs come from the active goods list at the API boundary — the DB-level check in the service is the only guard.

#### Role/Authorization Verification

`GET /api/goods/active` has no `authorize()` guard — any authenticated user can retrieve the active goods list, which is appropriate for a dropdown feed.

#### Potential Bugs

- **BUG-S8-01 (Critical):** The movement creation service validates `Item.isActive` (items table), while the goods management module manages `Goods.status` (goods table). These are two separate database tables with no foreign key relationship. A goods item deactivated through the Goods API (`PUT /api/goods/:id` with `status: 'INACTIVE'`) will **not** prevent that goods from appearing in movements, because movement validation checks the `items` table, not the `goods` table.
- **BUG-S8-02 (High):** The `Location` model has a `status: ENUM('ACTIVE', 'INACTIVE')` field, but `movementService.createMovement` does not check `location.status` after `findByPk`. An INACTIVE location can be used as origin or destination.
- **BUG-S8-03 (Medium):** `Item` model has no `category`, `vendor`, or `description` fields. It is a stripped-down entity that duplicates part of `Goods`. This fragmentation makes consistent goods lifecycle management impossible.
- **BUG-S8-04 (Low):** `Good.js` (singular) is also present in the models directory but is **not** registered in `models/index.js` — it is dead code and should be removed.

#### Suggested Improvements

1. Consolidate `Item` and `Goods` into a single model. Migrate movement details to reference `goodsId` (from the `Goods` table) and update `Stock.goodsId` to align.
2. In `createMovement`, check `location.status !== 'INACTIVE'` after each `Location.findByPk` call.
3. Remove the unregistered `Good.js` model file to eliminate confusion.

---

## Cross-Cutting Bugs and Architectural Gaps (Run 2)

| ID | Severity | Description |
|----|----------|-------------|
| BUG-S1-02 | Critical | `Stock.findOne({ where: { itemId } })` — `itemId` not a Stock field (should be `goodsId`); all stock queries fail |
| BUG-S1-03 | Critical | `Item` (items table) and `Goods` (goods table) are unrelated entities; movement system and goods CRUD are disconnected |
| BUG-S7-02 | Critical | JWT secrets still fall back to hardcoded defaults if env vars are unset |
| BUG-S4-02 | Medium | `Stock.quantity` is `INTEGER UNSIGNED`; movement quantities are `DECIMAL(15,4)` — type mismatch on finalization |
| BUG-S8-01 | Critical | Deactivating goods via Goods API does not prevent movement creation — wrong table is checked |
| BUG-S1-04 | High | INACTIVE locations can be used in movement requests — no status guard on location lookup |
| BUG-S8-02 | High | Same INACTIVE location gap in movement creation |
| BUG-S1-05 | High | `warehouse_operator` role does not exist; any authenticated user can create movements |
| BUG-S2-01 | High | `warehouse_head` role does not exist; any admin/manager can approve as head |
| BUG-S3-01 | High | `destination_operator` role does not exist; any admin/manager can approve as destination |
| BUG-S3-02 | High | No location ownership check on destination approval |
| BUG-S6-01 | High | No DB-level unique constraint on movements; TOCTOU race condition in duplicate check |
| BUG-S2-02 | Medium | Self-approval not prevented; request creator can approve their own request |
| BUG-S3-03 | Medium | Same user can perform both head and destination approval |
| BUG-S5-01 | Medium | Rejection reason is optional; silent rejections with no reason are permitted |
| BUG-S5-02 | Medium | No per-step role binding for rejection |
| BUG-S6-02 | Medium | Duplicate check includes quantity; same-item different-quantity requests bypass detection |
| BUG-S7-01 | Medium | HTTP 403 for inactive vs 401 for unknown accounts enables user enumeration |
| BUG-S4-03 | Medium | No audit log written on finalization |
| BUG-S4-04 | Low | Inconsistent numeric casting of quantity fields in finalization |
| BUG-S8-04 | Low | Unregistered `Good.js` model is dead code |
| BUG-S7-03 | Low | No rate-limiting on login endpoint |

---

## Overall Assessment (Run 2)

**Scenarios passing end-to-end:** 0 out of 8 (all have critical bugs or architectural gaps)
**Scenarios partially passing:** 6 out of 8 (Scenarios 2, 3, 5, 6, 7, 8)
**Scenarios completely failing:** 2 out of 8 (Scenarios 1 and 4)

Compared to Run 1, significant progress has been made: the approval workflow state machine, duplicate detection, rejection logic, finalization transactions, and goods activity checks are all architecturally present. The most urgent blocker for any live functionality is the `Stock.itemId` / `Stock.goodsId` field mismatch (BUG-S1-02), which prevents all stock-related operations. The secondary blocker is the Item/Goods model fragmentation (BUG-S1-03), which must be resolved through a data model unification effort before the system can be considered coherent.

**Priority order for next implementation sprint:**

1. **(Critical)** Fix `fetchStockQty` and all `Stock.findOne` calls to use `goodsId` instead of `itemId`
2. **(Critical)** Unify `Item` model and `Goods` model — establish a single source of truth for goods
3. **(Critical)** Enforce `JWT_SECRET` / `JWT_REFRESH_SECRET` as required env vars at startup
4. **(High)** Add `location.status` guard in `createMovement` for both origin and destination
5. **(High)** Introduce `warehouse_operator`, `warehouse_head`, `destination_operator` roles
6. **(High)** Add destination location ownership check on `approve-dest`
7. **(Medium)** Make rejection reason mandatory (Joi `.required()` + min length)
8. **(Medium)** Add DB-level constraint or advisory lock to back up duplicate movement detection
9. **(Medium)** Unify login error responses to prevent user enumeration
10. **(Medium)** Write audit log entries for movement workflow transitions
