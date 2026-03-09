# Asset Management System

A full-stack warehouse asset management application built with React (Vite) on the frontend and Node.js / Express on the backend, backed by MySQL via Sequelize ORM.

---

## Features

- **Dashboard** – real-time KPIs for stock, movements, and requests
- **Goods / Inventory** – manage goods with categories, vendors, and soft-delete support
- **Stock Management** – view stock levels per location and perform stock adjustments
- **Movement Requests** – operators submit transfer requests; heads/destination operators approve, reject, or recall
- **Movements** – multi-step approval workflow (head approval → destination approval → finalization) with recall support
- **Admin Module** – role-gated section for Users, Locations, Categories, and Vendors CRUD
- **Audit Log** – immutable log of all create/update/delete operations
- **Role-based Access Control** – three warehouse roles (`admin`, `warehouse_head`, `warehouse_operator`) with location-based permission guards; a `warehouse_operator` acts as destination approver / finalizer when their assigned location matches the movement destination
- **JWT Auth** – access + refresh token flow with bcrypt password hashing

---

## Tech Stack

| Layer      | Technology                                                        |
|------------|-------------------------------------------------------------------|
| Frontend   | React 18, Vite, React Router v6, Axios, TailwindCSS, Recharts    |
| Backend    | Node.js, Express, Sequelize ORM, MySQL                            |
| Auth       | JWT (access + refresh tokens), bcrypt                             |
| Validation | Joi (server-side), inline validation (client)                     |
| Testing    | Jest (unit tests, mocked DB)                                      |
| Deploy     | Docker Compose (MySQL + API + Nginx-served frontend), PM2         |

---

## Project Structure

```
asset-management-v2/
├── backend/
│   ├── config/          # DB config, JWT config
│   ├── controllers/     # Request handlers (thin layer)
│   ├── middlewares/     # Auth, RBAC, validation, error handler
│   ├── migrations/      # Sequelize migrations
│   ├── models/          # Sequelize model definitions
│   ├── routes/          # Express route declarations
│   ├── seeders/         # Database seed data (roles, users, goods, stock)
│   ├── services/        # Business logic
│   ├── utils/           # JWT helpers, response helpers, AppError
│   ├── app.js           # Express app setup
│   └── server.js        # Entry point (DB connect + listen)
│
├── frontend/
│   ├── src/
│   │   ├── components/  # Shared UI (Spinner, Alert, ProtectedRoute, AdminRoute)
│   │   ├── contexts/    # React Context (AuthContext)
│   │   ├── layouts/     # MainLayout, AuthLayout, Sidebar
│   │   ├── pages/       # Route-level page components
│   │   │   ├── admin/   # UsersPage (admin/head only)
│   │   │   └── movements/ # MovementsListPage, MovementNewPage, MovementDetailPage
│   │   ├── services/    # Axios API wrappers
│   │   └── utils/       # localStorage token helpers
│   ├── index.html
│   └── vite.config.js
│
├── docker-compose.yml   # Full-stack Docker deployment
└── ecosystem.config.js  # PM2 process config
```

---

## Prerequisites

- **Node.js** >= 18
- **MySQL** >= 8.0 (running locally or via Docker)

---

## Installation

### 1. Clone the repository

```bash
git clone <repo-url>
cd asset-management-v2
```

### 2. Set up the backend

```bash
cd backend
npm install

# Copy and edit environment variables
cp .env.example .env
# Open .env and fill in DB_USER, DB_PASS, JWT_SECRET, etc.
```

### 3. Prepare the database

```bash
# Create the MySQL database
mysql -u root -p -e "CREATE DATABASE asset_management_dev;"

# Run migrations
npm run migrate

# Seed roles, locations, categories, vendors, users, goods, and stock
npm run seed
```

**Demo credentials after seeding:**

| Email                         | Password        | Role                       | Assigned Location |
|-------------------------------|-----------------|----------------------------|-------------------|
| warehouse.admin@example.com   | Admin@1234      | `admin`                    | —                 |
| warehouse.head@example.com    | Head@1234       | `warehouse_head`           | Warehouse A (origin) |
| operator.one@example.com      | Operator@1234   | `warehouse_operator`       | Warehouse A (creates movement requests, origin-side) |
| operator.two@example.com      | Operator@1234   | `warehouse_operator`       | Warehouse B (destination approver / finalizer for inbound movements) |

### 4. Start the backend

```bash
npm run dev        # development (nodemon)
# or
npm start          # production
```

Backend runs on **http://localhost:5000**

---

### 5. Set up the frontend

```bash
cd ../frontend
npm install

# Copy env (optional – the Vite dev proxy handles /api without it)
cp .env.example .env
```

### 6. Start the frontend

```bash
npm run dev
```

Frontend runs on **http://localhost:5173**

The Vite dev server is configured to proxy `/api/*` requests to `http://localhost:5000`, so no CORS issues during development.

---

## Docker (Full-Stack)

A `docker-compose.yml` is provided for running MySQL, the API, and the frontend (Nginx) together.

```bash
# Copy and fill in backend env vars
cp backend/.env.example backend/.env

# Build and start all services
docker-compose up --build
```

| Service  | Exposed Port | Description              |
|----------|-------------|--------------------------|
| db       | (internal)  | MySQL 8.0                |
| api      | 5000        | Node.js / Express API    |
| frontend | 80          | Nginx-served React build |

---

## API Reference

### Health

| Method | Endpoint  | Auth required | Description                  |
|--------|-----------|---------------|------------------------------|
| GET    | `/health` | No            | Service health check (uptime, DB status) |

### Authentication

| Method | Endpoint            | Auth required | Description           |
|--------|---------------------|---------------|-----------------------|
| POST   | `/api/auth/login`   | No            | Login, returns tokens |
| POST   | `/api/auth/refresh` | No            | Refresh access token  |
| GET    | `/api/auth/profile` | Yes (Bearer)  | Get current user info |

### Goods

| Method | Endpoint          | Auth required | Description          |
|--------|-------------------|---------------|----------------------|
| GET    | `/api/goods`      | Yes           | List all goods       |
| POST   | `/api/goods`      | Admin/Head    | Create a good        |
| PUT    | `/api/goods/:id`  | Admin/Head    | Update a good        |
| DELETE | `/api/goods/:id`  | Admin/Head    | Soft-delete a good   |

### Stock

| Method | Endpoint      | Auth required | Description         |
|--------|---------------|---------------|---------------------|
| GET    | `/api/stocks` | Yes           | List stock by location |

### Stock Adjustments

| Method | Endpoint                 | Auth required | Description             |
|--------|--------------------------|---------------|-------------------------|
| GET    | `/api/stock-adjustments` | Yes           | List adjustments        |
| POST   | `/api/stock-adjustments` | Admin/Head    | Create stock adjustment |

**Validation rules for `POST /api/stock-adjustments`:**
- `adjustment_type` must be `add` or `subtract` (the `set` type is not supported)
- Target **goods** must have `status = ACTIVE` — returns HTTP 422 otherwise
- Target **location** must have `status = ACTIVE` — returns HTTP 422 otherwise
- If the target location is a direct participant (origin or destination) of an active movement that contains the requested goods, the request is blocked with HTTP 409. Locations that are **not** involved in that movement are unaffected and may adjust their own stock freely.
- `warehouse_operator` may only submit adjustments for their own assigned location

### Movements

| Method | Endpoint                              | Auth required                    | Description                                              |
|--------|---------------------------------------|----------------------------------|----------------------------------------------------------|
| POST   | `/api/movements/preview`              | Yes                              | Preview qty snapshots without saving                     |
| POST   | `/api/movements`                      | `warehouse_operator`, `warehouse_head`, `admin` | Create movement request (status: `PENDING_HEAD_APPROVAL`) |
| GET    | `/api/movements`                      | Yes                              | List movements (filterable by status, location)          |
| GET    | `/api/movements/:id`                  | Yes                              | Get movement detail                                      |
| POST   | `/api/movements/:id/approve-head`     | `warehouse_head`, `admin`        | Head approves → `PENDING_DESTINATION_APPROVAL` (origin location ownership enforced) |
| POST   | `/api/movements/:id/approve-dest`     | `warehouse_operator`, `admin`    | Destination approves → `APPROVED_READY_FOR_FINALIZATION` (destination location ownership enforced) |
| POST   | `/api/movements/:id/finalize`         | `warehouse_operator`, `warehouse_head`, `admin` | Finalize and update stock → `COMPLETED` (destination location ownership enforced) |
| POST   | `/api/movements/:id/reject`           | `warehouse_head`, `warehouse_operator`, `admin` | Reject at `PENDING_*` stages with mandatory reason (location ownership enforced) |
| POST   | `/api/movements/:id/recall`           | `warehouse_head`, `warehouse_operator`, `manager`, `admin` | Recall at `APPROVED_READY_FOR_FINALIZATION` with mandatory reason |
| POST   | `/api/movements/:id/cancel`           | `warehouse_operator`, `admin`    | Requester cancels their own `PENDING_HEAD_APPROVAL` request |

#### Movement Workflow State Machine

```
warehouse_operator creates
        │
        ▼
PENDING_HEAD_APPROVAL
        │ warehouse_head (origin) approves
        ▼
PENDING_DESTINATION_APPROVAL
        │ warehouse_operator (destination) approves
        ▼
APPROVED_READY_FOR_FINALIZATION
        │ warehouse_operator or warehouse_head (destination) finalizes
        ▼
    COMPLETED

At PENDING_HEAD_APPROVAL or PENDING_DESTINATION_APPROVAL:
  → REJECTED  via /reject  (warehouse_head at origin, warehouse_operator at destination, admin)

At APPROVED_READY_FOR_FINALIZATION:
  → REJECTED  via /recall  (warehouse_head at origin or destination, warehouse_operator at destination, admin)
```

### Movement Requests (Simple)

| Method | Endpoint                        | Auth required | Description                  |
|--------|---------------------------------|---------------|------------------------------|
| GET    | `/api/movement-requests`        | Yes           | List requests                |
| POST   | `/api/movement-requests`        | Yes           | Submit a request (operator)  |
| PATCH  | `/api/movement-requests/:id`    | Admin/Head    | Approve or reject a request  |

### Admin – Users

| Method | Endpoint         | Auth required | Description         |
|--------|------------------|---------------|---------------------|
| GET    | `/api/users`     | Admin/Head    | List users          |
| POST   | `/api/users`     | Admin         | Create user         |
| PUT    | `/api/users/:id` | Admin         | Update user         |
| DELETE | `/api/users/:id` | Admin         | Soft-delete user    |

### Admin – Locations, Categories, Vendors

| Method | Endpoint              | Auth required | Description              |
|--------|-----------------------|---------------|--------------------------|
| GET    | `/api/locations`      | Admin/Head    | List locations           |
| POST   | `/api/locations`      | Admin         | Create location          |
| PUT    | `/api/locations/:id`  | Admin         | Update location          |
| DELETE | `/api/locations/:id`  | Admin         | Soft-delete location     |
| GET    | `/api/categories`     | Admin/Head    | List categories          |
| POST   | `/api/categories`     | Admin         | Create category          |
| GET    | `/api/vendors`        | Admin/Head    | List vendors             |
| POST   | `/api/vendors`        | Admin         | Create vendor            |

### Audit Log

| Method | Endpoint          | Auth required | Description       |
|--------|-------------------|---------------|-------------------|
| GET    | `/api/audit-logs` | Admin/Head    | List audit events |

### Dashboard

| Method | Endpoint          | Auth required | Description         |
|--------|-------------------|---------------|---------------------|
| GET    | `/api/dashboard`  | Yes           | Get KPI summary     |

**Login request body:**
```json
{
  "email": "warehouse.admin@example.com",
  "password": "Admin@1234"
}
```

**Successful response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "user": { "id": 1, "name": "Admin Warehouse", "email": "...", "role": "admin" }
  }
}
```

---

## Role & Permission Summary

There are five roles. The three warehouse-specific roles map directly to warehouse responsibilities:

| Role | Description |
|------|-------------|
| `admin` | Full system access — users, locations, categories, vendors, all movements |
| `manager` | Can view and approve movements; no admin module access |
| `viewer` | Read-only access to dashboard, assets, and movements |
| `warehouse_head` | Approves head-stage movements at their origin location; can recall fully-approved movements; manages master data and audit log |
| `warehouse_operator` | Creates movement requests from their origin location; acts as **destination approver and finalizer** for movements arriving at their assigned location |

> A `warehouse_operator` assigned to **Warehouse B** can approve the destination stage and finalize any movement whose `destinationLocationId` equals their `locationId`. No separate "destination operator" role exists — location ownership determines the actor's side of the workflow.

| Capability                                                  | admin | manager | warehouse_head | warehouse_operator | viewer |
|-------------------------------------------------------------|:-----:|:-------:|:--------------:|:------------------:|:------:|
| View dashboard / goods / stock                              | ✓     | ✓       | ✓              | ✓                  | ✓      |
| Submit movement requests (origin side)                      | ✓     | ✓       | ✓              | ✓                  |        |
| Head-approve movements (origin warehouse)                   | ✓     |         | ✓              |                    |        |
| Destination-approve movements (destination warehouse)       | ✓     |         |                | ✓                  |        |
| Finalize movements (destination warehouse)                  | ✓     |         | ✓ †            | ✓ †                |        |
| Reject movements at PENDING stages                          | ✓     |         | ✓              | ✓                  |        |
| Recall movements at APPROVED_READY_FOR_FINALIZATION         | ✓     | ✓       | ✓              | ✓                  |        |
| Create stock adjustments                                    | ✓     |         | ✓              |                    |        |
| Manage categories, vendors                                  | ✓     |         | ✓              |                    |        |
| Manage users & locations                                    | ✓     |         | ✓              |                    |        |
| View audit log                                              | ✓     |         | ✓              |                    |        |

† Service enforces `user.locationId === movement.destinationLocationId`; only the destination warehouse actor can finalize.

---

## Testing

The backend ships with a Jest-based unit test suite covering the core warehouse operator workflow.

```bash
cd backend
npm test
```

Tests mock all Sequelize models and services, so no live database is required. Key scenarios covered:

- Movement request creation and validation
- Multi-step approval flow (head approval → destination approval → finalization)
- Stock quantity updates on movement finalization
- Rejection handling and status guards (stage-gated, location-ownership enforced)
- Post-approval recall at `APPROVED_READY_FOR_FINALIZATION`
- Inactive user / inactive goods rejection
- Duplicate request prevention and goods-scoped in-flight lock
- Stock adjustment blocked when target location is `INACTIVE` (HTTP 422)
- Stock adjustment at an uninvolved location allowed while an active movement runs between two other locations (location-scoped active movement guard)

See `simulation-test.md` in the project root for documented end-to-end test scenarios and results.

---

## Additional Documentation

| File | Description |
|------|-------------|
| `ai-system-architecture.md` | Canonical system design, data model, and business rules reference |
| `simulation-test.md` | End-to-end workflow scenarios and expected system behavior |

---

## Adding New Modules

### Backend

1. Create a migration: `backend/migrations/YYYYMMDD-create-<model>.js`
2. Define the model: `backend/models/<Model>.js`
3. Register it in `backend/models/index.js`
4. Add service layer: `backend/services/<module>Service.js`
5. Add controller: `backend/controllers/<module>Controller.js`
6. Add routes: `backend/routes/<module>Routes.js`
7. Mount routes in `backend/routes/index.js`

### Frontend

1. Add page component: `frontend/src/pages/<Module>Page.jsx`
2. Register the route in `frontend/src/App.jsx`
3. Add a nav item in `frontend/src/layouts/Sidebar.jsx`
4. Add an API service: `frontend/src/services/<module>Service.js`

---

## Available npm Scripts

### Backend

| Script                  | Description                          |
|-------------------------|--------------------------------------|
| `npm run dev`           | Start with nodemon (hot reload)      |
| `npm start`             | Start production server              |
| `npm run migrate`       | Run pending Sequelize migrations     |
| `npm run migrate:undo`  | Rollback last migration              |
| `npm run seed`          | Run all seeders                      |
| `npm run seed:undo`     | Undo all seeders                     |
| `npm test`              | Run Jest unit test suite             |

### Frontend

| Script              | Description                       |
|---------------------|-----------------------------------|
| `npm run dev`       | Vite dev server with HMR          |
| `npm run build`     | Production build to `dist/`       |
| `npm run preview`   | Preview production build locally  |
| `npm run lint`      | ESLint with strict warnings       |
