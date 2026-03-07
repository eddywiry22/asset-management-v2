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
6. Movement Requests
7. Approval System
8. Audit Log
9. Dashboard
10. Notifications
11. Vendor
12. Categories

---

## DATABASE ENTITIES

- Goods
- Locations
- Users
- Roles
- Vendor
- Categories
- Permissions
- Stock
- MovementHeader
- MovementDetail
- AuditLog

---

## BUSINESS RULES

### Goods and Location status:

If status = INACTIVE
they cannot be selected in movement requests.

### Users:

If user status = INACTIVE
login must be rejected.

### Stock:

Stock quantity cannot go below zero.

### Movement:

Movement cannot occur if origin stock is insufficient.

Destination location cannot equal origin location.

If destination stock does not exist,
the system must auto create stock record.

---

## MOVEMENT WORKFLOW

1. Operator creates request

   Status: `PENDING_HEAD_APPROVAL`

2. Warehouse Head approves

   Status: `PENDING_DESTINATION_APPROVAL`

3. Destination Operator approves

   Status: `APPROVED_READY_FOR_FINALIZATION`

4. Finalization updates stock

   Status: `COMPLETED`

Rejection sets status to `REJECTED`.

---

## DUPLICATE MOVEMENT RULE

If a movement request exists with:

- same origin
- same destination
- same items

and is not finalized

a new request cannot be created.

---

## DASHBOARD FEATURES

- Stock overview
- Movement reports
- Movement request status

Reports can be exported as CSV.

---

## AUDIT LOG

All changes must generate audit log entries.

Audit includes:

- user
- action
- module
- old_value
- new_value
- timestamp
