# Asset Management System

A full-stack asset management application built with React (Vite) on the frontend and Node.js / Express on the backend, backed by MySQL via Sequelize ORM.

---

## Tech Stack

| Layer     | Technology                                    |
|-----------|-----------------------------------------------|
| Frontend  | React 18, Vite, React Router v6, Axios, TailwindCSS |
| Backend   | Node.js, Express, Sequelize ORM, MySQL        |
| Auth      | JWT (access + refresh tokens), bcrypt         |
| Validation| Joi (server-side), inline validation (client) |

---

## Project Structure

```
asset-management-v2/
├── backend/
│   ├── config/          # DB config, JWT config
│   ├── controllers/     # Request handlers (thin layer)
│   ├── middlewares/     # Auth, validation, error handler
│   ├── migrations/      # Sequelize migrations
│   ├── models/          # Sequelize model definitions
│   ├── routes/          # Express route declarations
│   ├── seeders/         # Database seed data
│   ├── services/        # Business logic
│   ├── utils/           # JWT helpers, response helpers, AppError
│   ├── app.js           # Express app setup
│   └── server.js        # Entry point (DB connect + listen)
│
└── frontend/
    ├── src/
    │   ├── components/  # Shared UI components (Spinner, Alert, ProtectedRoute)
    │   ├── contexts/    # React Context (AuthContext)
    │   ├── layouts/     # MainLayout (sidebar shell), AuthLayout, Sidebar
    │   ├── pages/       # Route-level page components
    │   ├── services/    # Axios API wrappers
    │   └── utils/       # localStorage token helpers
    ├── index.html
    └── vite.config.js
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
# Create the MySQL databases
mysql -u root -p -e "CREATE DATABASE asset_management_dev;"

# Run migrations
npm run migrate

# (Optional) Seed demo users
npm run seed
```

**Demo credentials after seeding:**

| Email                  | Password       | Role    |
|------------------------|----------------|---------|
| admin@example.com      | Admin@1234     | admin   |
| manager@example.com    | Manager@1234   | manager |

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

## API Reference

### Authentication

| Method | Endpoint           | Auth required | Description           |
|--------|--------------------|---------------|-----------------------|
| POST   | `/api/auth/login`  | No            | Login, returns tokens |
| GET    | `/api/auth/profile`| Yes (Bearer)  | Get current user info |

**Login request body:**
```json
{
  "email": "admin@example.com",
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
    "user": { "id": 1, "name": "System Admin", "email": "...", "role": "admin" }
  }
}
```

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
| Script            | Description                          |
|-------------------|--------------------------------------|
| `npm run dev`     | Start with nodemon (hot reload)      |
| `npm start`       | Start production server              |
| `npm run migrate` | Run pending Sequelize migrations     |
| `npm run migrate:undo` | Rollback last migration         |
| `npm run seed`    | Run all seeders                      |
| `npm run seed:undo` | Undo all seeders                   |

### Frontend
| Script          | Description                  |
|-----------------|------------------------------|
| `npm run dev`   | Vite dev server with HMR     |
| `npm run build` | Production build to `dist/`  |
| `npm run preview` | Preview production build   |
