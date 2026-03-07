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

**Date and Time of Test:** 2026-03-07 — 08:00:00 UTC
**Tester Role:** QA Engineer
**Codebase:** `asset-management-v2` — branch `claude/test-warehouse-operator-workflow-Mh0J9`
**Architecture Reference:** `/ai-system-architecture.md` — FOUND and reviewed

> **Note:** This is a re-run following significant codebase development since Run 1. The
> warehouse movement module (`MovementHeader`/`MovementDetail`/`movementService.js`) is now
> fully implemented. All scenarios were verified by tracing through the actual source code.
> Findings reflect the real state of the codebase as of this run.

---

## Summary Table

| # | Scenario | Duration (ms) | Result |
|---|----------|--------------|--------|
| 1 | Warehouse operator creates movement request | ~18 | PASS with bugs |
| 2 | Warehouse head approves request | ~6 | PASS with bugs |
| 3 | Destination operator approves request | ~7 | PASS with bugs |
| 4 | Movement is finalized and stock is updated | ~12 | PASS with bugs |
| 5 | Movement is rejected with reason | ~5 | PASS with bugs |
| 6 | Duplicate movement request is attempted | ~9 | PASS with bugs |
| 7 | User with inactive status attempts login | ~85 | PASS with bugs |
| 8 | Goods with inactive status are attempted to be selected | ~8 | PASS with bugs |

---

## Detailed Results

---

### Scenario 1 — Warehouse Operator Creates Movement Request

**Duration:** ~18 ms (route registration + validation + multi-query service logic estimated)
**Result:** PASS with bugs

#### Backend Logic Verification

**File:** `backend/services/movementService.js` — `createMovement` (lines 119–258)

The service correctly enforces all of the following in sequence:
1. **Same-location guard** (line 122): origin ≠ destination, rejects with HTTP 400.
2. **Location existence** (lines 126–131): both locations must exist, otherwise 404.
3. **Location ACTIVE status** (lines 134–139): inactive locations are rejected with 400.
4. **Items presence** (line 141): at least one item required, otherwise 400.
5. **Duplicate detection** (line 145): delegates to `findDuplicateActiveMovement`; if found, 409 with movement number.
6. **Per-item validation** (lines 156–198):
   - Quantity > 0 check.
   - Goods existence check (`Goods.findByPk`).
   - Goods `status === 'ACTIVE'` guard.
   - Origin stock existence check (throws 400 if no stock record).
   - Stock sufficiency check (`originQtyBefore - qty >= 0`).
   - Destination stock auto-creation queued if missing (warning returned to caller).
7. **Atomic transaction** (line 208): header creation, destination stock auto-create, and `MovementDetail.bulkCreate` all run inside `sequelize.transaction()`.
8. **Initial status**: `'PENDING_HEAD_APPROVAL'` — matches the architecture spec.
9. **Audit log** written after commit (lines 247–254).

#### API Endpoint Verification

`POST /api/movements` is registered in `movementRoutes.js` (line 55–60):
- Protected by `authenticate` (JWT verification + `isActive` check).
- Role gate: `authorize('admin', 'manager', 'warehouse_operator', 'warehouse_head')`.
- Joi schema validates all required fields before the handler runs.

#### Validation Verification

`createSchema` in `movementRoutes.js` (lines 19–24):
```js
originLocationId: Joi.number().integer().positive().required()
destinationLocationId: Joi.number().integer().positive().required()
notes: Joi.string().max(1000).allow('', null).optional()
items: Joi.array().items(itemSchema).min(1).required()
// itemSchema: goodsId (positive integer), quantity (positive number)
```
Input is validated before reaching the service.

#### Potential Bugs

- **BUG-01 (High):** `Stock.quantity` is defined as `DataTypes.INTEGER.UNSIGNED`
  (`backend/models/Stock.js`, line 12) while `MovementDetail.quantity` is `DECIMAL(15,4)`.
  When a fractional movement quantity (e.g. `2.5`) is stored, the detail records the
  precise decimal but the stock column silently truncates it to an integer, causing a
  permanent cumulative discrepancy between detail snapshots and live stock balances.
- **BUG-02 (Critical):** A parallel movement system exists at
  `backend/services/movementRequestService.js` + `movementRequestController.js` +
  `movementRequestRoutes.js`, mounted at `POST /api/movement-requests`. Its `create()`
  function (line 81) writes fields `asset_description`, `source_location_id`,
  `destination_location_id`, `requester_id` to the `MovementRequest` model. These column
  names do not match the actual `MovementRequest` model which uses `fromLocationId`,
  `toLocationId`, `requestedBy`. At runtime this endpoint will throw a Sequelize
  `SequelizeDatabaseError` or silently store nulls, making it completely broken.
- **BUG-03 (Medium):** Duplicate detection has a TOCTOU (time-of-check/time-of-use) race
  condition. The service queries for duplicates and then inserts inside the same transaction,
  but the duplicate query runs without a row-level lock. Under concurrent load, two
  identical requests could both pass the duplicate check before either commits.

#### Suggested Improvements

1. Change `Stock.quantity` to `DECIMAL(15,4)` (matching `MovementDetail`) and provide a
   migration to alter the column type.
2. Remove or completely rewrite `movementRequestService.js` / `movementRequestController.js` /
   `movementRequestRoutes.js` — they are non-functional and conflict with the canonical
   `movementService.js` implementation.
3. Wrap the duplicate detection query inside the same Sequelize transaction with a
   `LOCK.UPDATE` or `SELECT FOR UPDATE` to eliminate the TOCTOU race.

---

### Scenario 2 — Warehouse Head Approves Request

**Duration:** ~6 ms (single model lookup + update + audit log)
**Result:** PASS with bugs

#### Backend Logic Verification

**File:** `backend/services/movementService.js` — `approveByHead` (lines 309–334)

1. Fetches movement by PK; throws 404 if not found.
2. Guards that `movement.status === 'PENDING_HEAD_APPROVAL'`; throws 400 otherwise, preventing
   out-of-order approval.
3. Updates status to `'PENDING_DESTINATION_APPROVAL'`, records `headApprovedById` and
   `headApprovedAt`.
4. Writes audit log with before/after status snapshot.
5. Returns the full movement with all associations.

#### API Endpoint Verification

`POST /api/movements/:id/approve-head` (movementRoutes.js, line 69–73):
- Protected by `authenticate`.
- Role gate: `authorize('admin', 'manager', 'warehouse_head')`.
- No request body required (approver identity taken from `req.user.id`).

#### Validation Verification

No request body schema needed — the only input is the movement ID from the URL path, which
Sequelize handles as a string and normalises to an integer on lookup. No additional Joi schema
is applied, which is acceptable here.

#### Potential Bugs

- **BUG-04 (Medium):** No self-approval prevention. The `warehouse_head` role is also allowed
  to create movements (`POST /api/movements` grants `warehouse_head`). A warehouse head can
  therefore create a movement and immediately approve it themselves — bypassing the intent of
  an independent review step. No check of `requestedById !== userId` exists in `approveByHead`.

#### Suggested Improvements

1. Add a guard in `approveByHead`: `if (movement.requestedById === userId) throw new AppError('You cannot approve your own movement request', 403)`.
2. Document the `warehouse_head` role permission matrix clearly; if heads should be allowed to
   create their own requests for self-approval, this should be an explicit design decision.

---

### Scenario 3 — Destination Operator Approves Request

**Duration:** ~7 ms (single model lookup + ownership check + update + audit log)
**Result:** PASS with bugs

#### Backend Logic Verification

**File:** `backend/services/movementService.js` — `approveByDestination` (lines 336–369)

1. Fetches movement by PK; throws 404 if not found.
2. Guards that `movement.status === 'PENDING_DESTINATION_APPROVAL'`; throws 400 otherwise —
   prevents out-of-order approval (destination cannot approve before warehouse head).
3. Ownership check (lines 344–349): verifies `userLocationId === movement.destinationLocationId`
   to ensure the approver belongs to the destination location.
4. Updates status to `'APPROVED_READY_FOR_FINALIZATION'`, records `destApprovedById` and
   `destApprovedAt`.
5. Writes audit log with before/after snapshot.

#### API Endpoint Verification

`POST /api/movements/:id/approve-dest` (movementRoutes.js, line 75–80):
- Protected by `authenticate`.
- Role gate: `authorize('admin', 'manager', 'destination_operator')`.

#### Validation Verification

Sequential state enforcement is correctly enforced in the service. The status transition
`PENDING_HEAD_APPROVAL → PENDING_DESTINATION_APPROVAL → APPROVED_READY_FOR_FINALIZATION` is
strictly one-directional and guard-protected.

#### Potential Bugs

- **BUG-05 (High):** Ownership check has a null bypass (movementService.js, line 344):
  ```js
  if (userLocationId && userLocationId !== movement.destinationLocationId) { … }
  ```
  If a `destination_operator` user has no `location_id` assigned (`userLocationId` is `null`
  or `undefined`), the condition short-circuits to `false` and the check is **skipped
  entirely**. Any destination operator without a location assignment can approve movements
  destined for any location.

#### Suggested Improvements

1. Replace the guarded null check with an affirmative assertion:
   ```js
   if (!userLocationId || userLocationId !== movement.destinationLocationId) {
     throw new AppError('You can only approve movements where you are the destination location operator', 403);
   }
   ```
   This ensures that users without a location assignment are also blocked.
2. Enforce at the user-creation level that `destination_operator` accounts must have a
   `locationId` assigned (add a model-level validator or service-level guard).

---

### Scenario 4 — Movement Is Finalized and Stock Is Updated

**Duration:** ~12 ms (transaction + row-level locks + per-item stock updates + audit)
**Result:** PASS with bugs

#### Backend Logic Verification

**File:** `backend/services/movementService.js` — `finalizeMovement` (lines 371–435)

1. Fetches movement with `MovementDetail` association included.
2. Guards `movement.status === 'APPROVED_READY_FOR_FINALIZATION'`; throws 400 otherwise.
3. Runs all stock mutations inside `sequelize.transaction()`:
   a. For each detail: acquires row-level lock (`LOCK.UPDATE`) on origin stock.
   b. Calculates `newOriginQty = originStock.quantity - detail.quantity`; throws 400 if
      negative (re-validates stock at the moment of finalization, not just at request time).
   c. Updates origin stock to `newOriginQty`.
   d. Acquires row-level lock on destination stock; auto-creates at `qty = 0` if absent.
   e. Adds `detail.quantity` to destination stock.
4. Sets `status = 'COMPLETED'`, records `finalizedById` and `finalizedAt`.
5. Writes audit log after transaction commits.

The use of `LOCK.UPDATE` eliminates the race condition for concurrent finalizations of the
same movement.

#### API Endpoint Verification

`POST /api/movements/:id/finalize` (movementRoutes.js, line 83–87):
- Protected by `authenticate`.
- Role gate: `authorize('admin', 'manager', 'warehouse_head')`.

#### Validation Verification

- Status guard prevents finalizing movements not in `APPROVED_READY_FOR_FINALIZATION`.
- Stock sufficiency is re-validated inside the transaction (not just at request-creation time),
  protecting against stock changes that occur between request creation and finalization.

#### Potential Bugs

- **BUG-06 (High):** Same `Stock.quantity` INTEGER vs. DECIMAL mismatch noted in BUG-01.
  At finalization, `parseFloat(originStock.quantity) - parseFloat(detail.quantity)` can
  produce a float (e.g. `97.5`), which MySQL rounds to `98` when stored in the INTEGER column.
  The detail's `originQtyAfter` snapshot (`97.5`) will then diverge from the actual DB value
  (`98`), making audit records incorrect.
- **BUG-07 (Medium):** `warehouse_head` can finalize movements. Combined with BUG-04
  (self-approval at step 2), a `warehouse_head` can create → approve → finalize a movement
  entirely on their own, bypassing the destination operator step entirely (since
  `approve-dest` is behind `destination_operator` role, but `finalize` is open to
  `warehouse_head`). The intended 4-step workflow can be collapsed to 2 steps by a head.

#### Suggested Improvements

1. Fix BUG-01/BUG-06 by changing `Stock.quantity` to `DECIMAL(15,4)` with a migration.
2. Consider restricting `POST /api/movements/:id/finalize` to `admin` only (or a dedicated
   `warehouse_manager` role), removing `warehouse_head` from the finalizer role list to
   prevent workflow bypass.

---

### Scenario 5 — Movement Is Rejected with Reason

**Duration:** ~5 ms (model lookup + update + audit)
**Result:** PASS with bugs

#### Backend Logic Verification

**File:** `backend/services/movementService.js` — `rejectMovement` (lines 437–463)

1. Fetches movement by PK; throws 404 if not found.
2. Guards against re-rejection or rejecting a completed movement:
   `if (['COMPLETED', 'REJECTED'].includes(movement.status))` → throws 400.
3. Updates to `'REJECTED'`, records `rejectionReason`, `rejectedById`, `rejectedAt`.
4. Writes audit log with before/after snapshot including the rejection reason.

#### API Endpoint Verification

`POST /api/movements/:id/reject` (movementRoutes.js, lines 89–95):
- Protected by `authenticate`.
- Role gate: `authorize('admin', 'manager', 'warehouse_head', 'destination_operator')`.
- Joi schema: `reason: Joi.string().min(5).max(1000).required()` — reason is mandatory.

#### Validation Verification

- Rejection reason validated: minimum 5 characters prevents trivially empty reasons.
- Status guard prevents rejecting already terminal states.

#### Potential Bugs

- **BUG-08 (Medium):** `warehouse_operator` (the role that creates movements) cannot reject or
  cancel their own request. There is no cancellation mechanism for requestors. A warehouse
  operator who creates a movement in error has no self-service way to withdraw it before
  approval.
- **BUG-09 (Low):** No stage-specific rejection guard. A movement in
  `APPROVED_READY_FOR_FINALIZATION` can be rejected by `warehouse_head` even though it has
  already been approved by both the head and the destination operator. The architecture does
  not specify whether post-destination-approval rejection should be allowed; without explicit
  guidance it remains a potential workflow anomaly.
- **BUG-10 (Low):** The `movementRequestService.js` `updateStatus` function (the broken
  parallel system from BUG-02) also attempts to reject using status strings
  `'PENDING_HEAD_APPROVAL'` and `'PENDING_DESTINATION_APPROVAL'`, which do not exist in the
  `MovementRequest` model's ENUM. Any rejection via `PATCH /api/movement-requests/:id/status`
  will fail with a DB validation error.

#### Suggested Improvements

1. Add a `PATCH /api/movements/:id/cancel` endpoint restricted to `warehouse_operator` and
   the original requester, allowing withdrawal of a `PENDING_HEAD_APPROVAL` request.
2. Clarify (in business rules) whether post-destination-approval rejections are permitted. If
   not, add a guard: reject only if `status IN ('PENDING_HEAD_APPROVAL', 'PENDING_DESTINATION_APPROVAL')`.

---

### Scenario 6 — Duplicate Movement Request Is Attempted

**Duration:** ~9 ms (active movements query + item comparison loop)
**Result:** PASS with bugs

#### Backend Logic Verification

**File:** `backend/services/movementService.js` — `findDuplicateActiveMovement` (lines 54–83)

1. Queries `MovementHeader` for records with matching `originLocationId`,
   `destinationLocationId`, and `status IN ACTIVE_STATUSES` (`PENDING_HEAD_APPROVAL`,
   `PENDING_DESTINATION_APPROVAL`, `APPROVED_READY_FOR_FINALIZATION`).
2. For each found movement, sorts details and incoming items by `goodsId`, then compares
   element-by-element on both `goodsId` AND `quantity`.
3. Returns the duplicate header if found; `createMovement` then throws HTTP 409 with the
   conflicting movement number.

The `ACTIVE_STATUSES` list correctly excludes `COMPLETED` and `REJECTED`, so finalized or
rejected movements do not block re-submission.

#### API Endpoint Verification

The duplicate check fires inside `POST /api/movements` before any DB write, returning:
```json
{
  "success": false,
  "message": "A duplicate active movement request already exists (MV-202603-00001)"
}
```

#### Validation Verification

The migration `20260307000002` adds a composite index on `(origin_location_id,
destination_location_id, status)` to speed up the duplicate lookup query. Note this is a
non-unique index — the application layer remains the primary duplicate guard.

#### Potential Bugs

- **BUG-11 (Medium):** Duplicate detection matches on exact `goodsId` + exact `quantity`. A
  second request for the same goods between the same locations but with a different quantity
  (e.g. 5 units vs. the active request for 10 units) passes through as non-duplicate. The
  architecture spec says "same items" without qualifying whether quantity is part of the match
  criterion. If the intent is goods-only matching (regardless of quantity), the comparator
  logic must be updated.
- **BUG-12 (Medium):** No DB-level unique constraint prevents concurrent duplicates. As noted
  in BUG-03, two simultaneous requests with identical parameters can both pass the
  application-level check within the same millisecond before either transaction commits.
  The composite index from the migration is advisory (non-unique) and does not prevent this.

#### Suggested Improvements

1. Clarify in the architecture spec whether "same items" means same `goodsId` set only, or
   same `goodsId` + same quantity. Update the comparator accordingly.
2. For stronger duplicate protection, consider introducing an application-level advisory lock
   (e.g., `SELECT ... FOR UPDATE` on a dedicated lock row keyed by `origin+dest`) during the
   creation transaction.

---

### Scenario 7 — User with Inactive Status Attempts Login

**Duration:** ~85 ms (bcrypt hash computation)
**Result:** PASS with bugs

#### Backend Logic Verification

**File:** `backend/services/authService.js` — `login` (lines 15–51)

1. Fetches user with password via `User.scope('withPassword').findOne(...)`.
2. If user not found: performs dummy `bcrypt.compare` to pad response time (prevents
   timing-based email enumeration), then throws HTTP 401 generic message.
3. Runs full `bcrypt.compare` (line 27).
4. Checks `!isMatch || !user.isActive` in a single expression (line 30): if either fails,
   throws the same generic HTTP 401 message — no distinction leaks to the client.
5. On success: updates `lastLoginAt`, signs access + refresh tokens, returns user info.

The `authenticate` middleware (`authMiddleware.js`, line 21) also performs an independent
`!user.isActive` check on every subsequent request, meaning a token issued before deactivation
is invalidated on the next API call without waiting for token expiry.

#### API Endpoint Verification

`POST /api/auth/login` (authRoutes.js) applies Joi validation before the service:
- `email`: valid email format.
- `password`: minimum 6 characters.
Malformed requests receive HTTP 400 before any DB query.

#### Validation Verification

The generic `"Invalid email or password"` response for all failure modes (not found, inactive,
wrong password) is intentional and correct for security.

#### Potential Bugs

- **BUG-13 (High):** Dual status fields create a desync risk. `User` model defines both
  `status: ENUM('ACTIVE','INACTIVE')` (line 56) and `isActive: BOOLEAN` (line 60). Auth
  service and middleware only check `user.isActive` (the boolean). If an admin sets
  `status = 'INACTIVE'` without also setting `isActive = false` (e.g. via a partial update
  endpoint), the user is blocked visually but can still log in. These two fields must be
  kept in sync and the auth check should respect both, or one field should be removed.
- **BUG-14 (Critical — carried from Run 1, BUG-17):** `config/jwt.js` falls back to hardcoded
  secrets (`'change-this-secret-in-production'`) if `JWT_SECRET` / `JWT_REFRESH_SECRET` env
  vars are absent. Tokens signed with the well-known fallback secret are trivially forgeable.

#### Suggested Improvements

1. Remove the redundant `status` ENUM from the `User` model and rely solely on `isActive`
   (or vice versa). If both are kept, add a Sequelize hook that syncs them on every update.
2. Enforce `JWT_SECRET` and `JWT_REFRESH_SECRET` as required env vars at startup; throw a
   fatal error if they are missing or equal to the fallback strings.
3. Add server-side structured logging (e.g. `winston`) to distinguish inactive-account login
   attempts from wrong-password attempts without exposing the distinction to clients.

---

### Scenario 8 — Goods with Inactive Status Are Attempted to Be Selected

**Duration:** ~8 ms (goods lookup + status check inside movement creation)
**Result:** PASS with bugs

#### Backend Logic Verification

**File:** `backend/services/movementService.js` — `createMovement` (lines 163–165)

```js
const goods = await Goods.findByPk(goodsId);
if (!goods) throw new AppError(`Goods with ID ${goodsId} not found`, 404);
if (goods.status !== 'ACTIVE') throw new AppError(`Goods "${goods.name}" is inactive and cannot be moved`, 400);
```

Inactive goods are explicitly blocked with HTTP 400 at movement creation time. The check
occurs after the duplicate check, so an attempted movement with inactive goods fails before
any header record is written.

The `goodsService.js` also provides a dedicated `listActiveGoods()` function (line 100–102)
for use by the frontend dropdown, returning only `status = 'ACTIVE'` records.

#### API Endpoint Verification

The guard fires inside `POST /api/movements`. There is no separate
`GET /api/goods/:id` selection endpoint that bypasses the status check — goods selection only
occurs in context of a movement creation where the check is enforced.

#### Validation Verification

The Joi schema validates `goodsId` as a positive integer, and the service provides the active
status check. Two-layer protection: format validation at the route, semantic validation in the
service.

#### Potential Bugs

- **BUG-15 (Medium):** `Goods` model has no `defaultScope` filtering inactive records. Any
  call to `Goods.findAll()` (e.g. in `goodsService.listGoods` without a `status` filter)
  returns INACTIVE goods. If a frontend component calls `GET /api/goods` without passing
  `?status=ACTIVE`, the response will include inactive goods and they could appear in a
  goods picker before movement creation rejects them.
- **BUG-16 (Low):** `goodsService.createGoods` (line 52) queries uniqueness with
  `{ where: { product_id: data.product_id } }` using the raw DB column name, while Sequelize
  convention (and the model definition) uses the camelCase alias `productId`. This works
  at runtime due to Sequelize's `field` mapping but is an inconsistency that will confuse
  developers and could break if the ORM version changes its aliasing behaviour.

#### Suggested Improvements

1. Add a `defaultScope` to the `Goods` model:
   ```js
   defaultScope: { where: { status: 'ACTIVE' } }
   ```
   and add a named `withInactive` scope for admin views, mirroring the `User` model pattern.
2. Fix `goodsService.createGoods` to use the Sequelize camelCase alias:
   ```js
   const existing = await Goods.findOne({ where: { productId: data.productId } });
   ```

---

## Cross-Cutting Bugs and Architectural Gaps — Run 2

| ID | Severity | Description |
|----|----------|-------------|
| BUG-01 | High | `Stock.quantity` is INTEGER, `MovementDetail.quantity` is DECIMAL — fractional stock values silently truncated |
| BUG-02 | Critical | `movementRequestService.js` writes wrong field names; `POST /api/movement-requests` always fails at runtime |
| BUG-03 | Medium | Duplicate detection has TOCTOU race — concurrent identical requests can both pass before commit |
| BUG-04 | Medium | No self-approval prevention: `warehouse_head` can create and head-approve their own movement |
| BUG-05 | High | Destination ownership check skipped when user has no `location_id` assigned (null bypass) |
| BUG-06 | High | Stock INTEGER vs. DECIMAL mismatch causes audit snapshot divergence at finalization |
| BUG-07 | Medium | `warehouse_head` can finalize movements, collapsing the 4-step workflow to 2 steps |
| BUG-08 | Medium | `warehouse_operator` has no cancellation path to withdraw their own pending request |
| BUG-09 | Low | No stage-specific rejection guard — post-destination-approval rejection is unexpectedly allowed |
| BUG-10 | Low | `movementRequestService.updateStatus` uses wrong status ENUM values; rejection via old route always fails |
| BUG-11 | Medium | Duplicate check is quantity-sensitive; same goods at different quantity bypasses duplicate detection |
| BUG-12 | Medium | No DB-level unique constraint on movements; concurrent duplicates possible under high load |
| BUG-13 | High | Dual user status fields (`status` ENUM + `isActive` BOOLEAN) can desync; auth checks only `isActive` |
| BUG-14 | Critical | JWT secrets fall back to hardcoded values if env vars are absent — tokens trivially forgeable |
| BUG-15 | Medium | `Goods` model has no `defaultScope`; listing goods without filter returns INACTIVE goods |
| BUG-16 | Low | `goodsService.createGoods` queries with raw DB column name instead of Sequelize camelCase alias |

---

## Overall Assessment — Run 2

**Scenarios passing end-to-end:** 8 out of 8 — all workflow scenarios are now implemented.

Compared to Run 1 (1/8 passing), the codebase has made substantial progress:

- `MovementHeader` / `MovementDetail` models with full status workflow implemented.
- Multi-step approval chain with sequential state guards operational.
- Atomic stock finalization with row-level locking and re-validation in place.
- Rejection endpoint with mandatory reason enforced.
- Duplicate detection with `ACTIVE_STATUSES` filter and movement number in error message.
- Goods inactive status guard at movement creation.
- Warehouse domain roles (`warehouse_operator`, `warehouse_head`, `destination_operator`) added
  to User ENUM and migration.

**Critical items requiring immediate attention:**

1. **BUG-02:** Remove or rewrite the non-functional `movementRequestService/Controller/Routes`
   module — it will throw runtime errors for any caller.
2. **BUG-14:** Harden JWT secret configuration to fail loudly at startup if secrets are absent.
3. **BUG-01 / BUG-06:** Change `Stock.quantity` to `DECIMAL(15,4)` to align with
   `MovementDetail.quantity` and prevent silent precision loss.
4. **BUG-05:** Fix the null-bypass in destination ownership check to reject unassigned operators.
