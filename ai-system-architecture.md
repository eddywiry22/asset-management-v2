# Asset Management System
AI System Architecture Context

This file contains the canonical architecture and business rules
for the Asset Management System project.

All code generation must follow this specification.
If new features are introduced, this file must be updated.

---

## SYSTEM PURPOSE

The system manages warehouse assets including:

- goods
- stock across multiple locations
- movement of goods between locations
- users and roles
- approval workflow
- audit logging
- reporting dashboard

---

## CORE MODULES

1. Goods
2. Locations
3. Users
4. Roles & Permissions
5. Stock
6. Stock Adjustments
7. Movement Requests
8. Movements (Header + Detail)
9. Approval System
10. Audit Log
11. Dashboard
12. Admin Panel (Users, Locations, Categories, Vendors)
13. Categories
14. Vendors

---

## DATABASE ENTITIES

Active Sequelize models registered in `models/index.js`:

- **Role** – table `roles`
- **Permission** – table `permissions`
- **Category** – table `categories` (paranoid, soft-delete)
- **Vendor** – table `vendors` (paranoid, soft-delete)
- **Location** – table `locations` (paranoid, soft-delete)
- **LocationLog** – table `location_logs`
- **User** – table `users` (paranoid, soft-delete)
- **Goods** – table `goods` (paranoid, soft-delete; defaultScope filters INACTIVE)
- **Stock** – table `stock`
- **StockAdjustment** – table `stock_adjustments`
- **MovementRequest** – table `movement_requests` (simple operator request)
- **MovementHeader** – table `movement_headers` (full multi-step workflow header)
- **MovementDetail** – table `movement_details` (line items for a MovementHeader)
- **AuditLog** – table `audit_logs`

Legacy/unused models still present in `models/` but NOT in `models/index.js`:

- `Good.js` (superseded by `Goods.js`)
- `Goods.js` (the active one registered as `db.Goods`)
- `Item.js` (registered but not used in current services)
- `Movement.js` (simple movement model, superseded by MovementHeader workflow)

---

## BUSINESS RULES

### Goods and Location Status

If `status = INACTIVE`, the good or location cannot be selected in movement
requests or movements. The `Goods` model enforces this through a Sequelize
`defaultScope` that filters out inactive records automatically. Use
`Goods.unscoped()` or `Goods.scope('withInactive')` only when admin access
to all goods is explicitly required.

### Users

If `user.status = INACTIVE` or `user.isActive = false`, login must be
rejected and the user must not appear in active-user dropdowns.

A user cannot be deleted if they are the **last active admin** account.
Attempting to do so returns HTTP 409.

A user cannot be deleted while they have non-finalized movements where they
appear as requester or approver.

A user cannot delete their own account.

### Stock

Stock `quantity` is stored as `DECIMAL(15,4)` — fractional quantities are
supported.

Stock quantity cannot go below zero.

### Movements

Movement cannot occur if origin stock is insufficient.

Destination location cannot equal origin location.

If destination stock record does not exist, the system must auto-create it.

### Soft Delete

The following entities support **paranoid (soft) delete** via Sequelize's
`paranoid: true` option, storing a `deleted_at` timestamp:

- `users`
- `goods`
- `locations`
- `categories`
- `vendors`

Soft-deleted records are excluded from all standard queries automatically.

### Active Location Dropdown

Any dropdown that lists locations for assignment to users or for movement
selection must only include `status = ACTIVE` and non-deleted locations.

---

## MOVEMENT WORKFLOW

The system has two separate movement models:

### 1. Movement Requests (Simple)

Used by operators to submit transfer requests via `/api/movement-requests`.
Backed by `MovementRequest` model.

Status ENUM: `PENDING → APPROVED → IN_TRANSIT → COMPLETED | CANCELLED | REJECTED`

Approval roles:
- `warehouse_head` approves PENDING requests
- `destination_operator` confirms IN_TRANSIT requests for their location

### 2. Movements (Full Workflow)

Used via `/api/movements`. Backed by `MovementHeader` + `MovementDetail` models.
Supports multiple goods per movement via line items.

```
1. Operator creates movement
   MovementHeader.status = PENDING_HEAD_APPROVAL

2. Warehouse Head approves
   MovementHeader.status = PENDING_DESTINATION_APPROVAL

3. Destination Operator approves
   MovementHeader.status = APPROVED_READY_FOR_FINALIZATION

4. Finalization updates stock on both sides
   MovementHeader.status = COMPLETED
```

Rejection at any step sets status to `REJECTED` and records `rejectedById`,
`rejectedAt`, and `rejectionReason` on the header.

---

## DUPLICATE MOVEMENT RULE

If a movement request exists with:

- same origin
- same destination
- same items

and is not finalized

a new request cannot be created.

---

## ADMIN MODULE

Accessible only to users with `role = 'admin'` or `role = 'warehouse_head'`.

Frontend guard: `AdminRoute` component wraps all admin routes.

Admin module routes and their pages:

| Route          | Page             | Min Role        |
|----------------|------------------|-----------------|
| `/users`       | UsersPage        | admin           |
| `/locations`   | LocationsPage    | admin           |
| `/categories`  | CategoriesPage   | admin           |
| `/vendors`     | VendorsPage      | admin           |
| `/audit-log`   | AuditLogPage     | warehouse_head  |

---

## ROLE DEFINITIONS

| Role                  | Key Capabilities                                              |
|-----------------------|---------------------------------------------------------------|
| `admin`               | Full access; manage users, locations, categories, vendors     |
| `warehouse_head`      | Approve/reject movements, view audit log, manage master data  |
| `warehouse_operator`  | Submit movement requests, view own stock and movements        |
| `destination_operator`| Confirm inbound transfers targeting their location            |

Permissions are also stored in the `permissions` table per role per module
with boolean flags: `can_view`, `can_create`, `can_edit`, `can_delete`,
`can_approve`, `requires_approval`.

---

## DASHBOARD FEATURES

- Stock overview per location
- Movement request status counts
- Recent movement activity

---

## AUDIT LOG

All create, update, and delete operations must generate an audit log entry
via `auditLogService`.

AuditLog fields:

| Field       | Description                                      |
|-------------|--------------------------------------------------|
| `userId`    | ID of the user who performed the action          |
| `userEmail` | Snapshot of email at time of action              |
| `action`    | Verb: `CREATE`, `UPDATE`, `DELETE`, etc.         |
| `entity`    | Model name, e.g. `User`, `Goods`, `Location`     |
| `entityId`  | ID of the affected record                        |
| `before`    | JSON snapshot of the record before the change    |
| `after`     | JSON snapshot of the record after the change     |

AuditLog has no FK constraint on `userId` (soft reference only) so that log
entries survive user deletion.

---

## ERD

```mermaid
erDiagram

    roles {
        int id PK
        varchar name UK
        text description
    }

    permissions {
        int id PK
        int role_id FK
        varchar module_name
        bool can_view
        bool can_create
        bool can_edit
        bool can_delete
        bool can_approve
        bool requires_approval
    }

    categories {
        int id PK
        varchar name UK
        text description
        bool is_active
        datetime deleted_at
        datetime created_at
        datetime updated_at
    }

    vendors {
        int id PK
        varchar name UK
        varchar contact_person
        varchar email
        varchar phone
        text address
        bool is_active
        datetime deleted_at
        datetime created_at
        datetime updated_at
    }

    locations {
        int id PK
        varchar name
        text address
        enum status "ACTIVE|INACTIVE"
        int created_by FK
        datetime deleted_at
        datetime created_at
        datetime updated_at
    }

    location_logs {
        int id PK
        int location_id FK
        enum action "CREATED|UPDATED"
        json changes
        int performed_by FK
        datetime created_at
        datetime updated_at
    }

    users {
        int id PK
        varchar name
        varchar phone_number
        varchar email UK
        varchar password
        enum role "admin|warehouse_head|warehouse_operator|destination_operator|manager|viewer"
        int role_id FK
        int location_id FK
        enum status "ACTIVE|INACTIVE"
        bool is_active
        datetime last_login_at
        datetime deleted_at
        datetime created_at
        datetime updated_at
    }

    goods {
        int id PK
        varchar product_id UK
        varchar name
        int category FK
        int vendor FK
        text description
        enum status "ACTIVE|INACTIVE"
        int created_by FK
        int updated_by FK
        datetime deleted_at
        datetime created_at
        datetime updated_at
    }

    stock {
        int id PK
        int goods_id FK
        int location_id FK
        decimal quantity
        datetime last_updated_at
    }

    stock_adjustments {
        int id PK
        int stock_id FK
        enum adjustment_type "add|subtract|set"
        decimal quantity
        text reason
        enum status "pending|approved|rejected"
        int requested_by FK
        int reviewed_by FK
        datetime reviewed_at
        text review_note
        datetime created_at
        datetime updated_at
    }

    movement_requests {
        int id PK
        int from_location_id FK
        int to_location_id FK
        enum status "PENDING|APPROVED|IN_TRANSIT|COMPLETED|CANCELLED|REJECTED"
        int requested_by FK
        datetime created_at
        datetime updated_at
    }

    movement_headers {
        int id PK
        varchar movement_number UK
        int origin_location_id FK
        int destination_location_id FK
        int requested_by_id FK
        enum status "PENDING_HEAD_APPROVAL|PENDING_DESTINATION_APPROVAL|APPROVED_READY_FOR_FINALIZATION|COMPLETED|REJECTED"
        text notes
        text rejection_reason
        int head_approved_by_id FK
        datetime head_approved_at
        int dest_approved_by_id FK
        datetime dest_approved_at
        int finalized_by_id FK
        datetime finalized_at
        int rejected_by_id FK
        datetime rejected_at
        datetime created_at
        datetime updated_at
    }

    movement_details {
        int id PK
        int movement_header_id FK
        int goods_id FK
        decimal quantity
        decimal origin_qty_before
        decimal origin_qty_after
        decimal destination_qty_before
        decimal destination_qty_after
        datetime created_at
        datetime updated_at
    }

    audit_logs {
        int id PK
        int user_id
        varchar user_email
        varchar action
        varchar entity
        int entity_id
        json before
        json after
        datetime created_at
        datetime updated_at
    }

    roles ||--o{ permissions : "has"
    roles ||--o{ users : "has"

    categories ||--o{ goods : "classifies"
    vendors ||--o{ goods : "supplies"

    locations ||--o{ users : "assigned to"
    locations ||--o{ stock : "holds"
    locations ||--o{ location_logs : "logged by"
    locations ||--o{ movement_requests : "origin of"
    locations ||--o{ movement_headers : "origin of"

    users ||--o{ location_logs : "performed"
    users ||--o{ stock_adjustments : "requested"
    users ||--o{ stock_adjustments : "reviewed"
    users ||--o{ movement_requests : "submitted"
    users ||--o{ movement_headers : "requested"
    users ||--o{ movement_headers : "head approved"
    users ||--o{ movement_headers : "dest approved"
    users ||--o{ movement_headers : "finalized"
    users ||--o{ movement_headers : "rejected"

    goods ||--o{ stock : "tracked in"
    goods ||--o{ movement_details : "moved via"

    stock ||--o{ stock_adjustments : "adjusted by"

    movement_headers ||--o{ movement_details : "contains"
```
