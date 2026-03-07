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
