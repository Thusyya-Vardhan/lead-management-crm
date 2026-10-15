# Mini CRM — Lead Management System

A focused, high-integrity Lead Management CRM designed for small business sales teams. Built with a decoupled **React (Vite + TypeScript)** frontend and **Node.js / Express (TypeScript)** backend backed by **MongoDB (Mongoose ODM)**.

---

## 🌟 Key Features

* **Two-Tier Role-Based Access Control (RBAC)**:
  * **ADMIN**: Full pipeline oversight, creates leads, assigns owners, provisions employee accounts, directly deletes records, and approves/rejects deletion requests.
  * **EMPLOYEE**: Restricted horizontal visibility (only sees and updates leads assigned to them), cannot reassign leads, and must submit deletion requests for Admin approval.
* **Optimistic Concurrency Control (OCC)**:
  * Guards against lost updates when multiple users edit the same lead simultaneously using Mongoose's internal versioning (`__v`).
  * Yields `409 Conflict` errors with an in-app reload mechanism to review latest edits.
* **Lead Deletion Approval Workflow with Snapshots**:
  * Employees cannot directly delete leads. Deletion requests store immutable `leadName` and `leadCompany` snapshots so audit records remain readable even after the lead is permanently removed.
* **Horizontal Data Isolation**:
  * Row-level security enforced at the MongoDB query level (`assignedTo === req.user._id`), never in the frontend.
  * Prevents ID enumeration by returning `404 Not Found` (rather than `403 Forbidden`) when accessing unauthorized lead IDs.
* **Modern Dark-Mode UI**:
  * Built with pure CSS tokens, glassmorphism, responsive data tables, status badges, and 1-click Demo Quick-Login.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19 + TypeScript + Vite | Single Page Application (SPA) |
| **Styling** | Vanilla CSS Tokens & Glassmorphism | Custom dark theme, responsive components |
| **Icons** | Lucide React | Clean, modern iconography |
| **Backend** | Node.js + Express 5 + TypeScript | REST API with ES Modules |
| **Database** | MongoDB + Mongoose ODM | Document store with indexing & OCC |
| **Auth** | JWT (`jsonwebtoken`) + `bcrypt` | Stateless bearer token authentication |

---

## 🔑 Demo Accounts

The database comes pre-seeded with two accounts for instant testing:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@minicrm.com` | `AdminPassword123!` | All leads, assignment, employee provisioning, approval queue |
| **EMPLOYEE** | `employee@minicrm.com` | `EmployeePassword123!` | Assigned leads only, update status/notes, request deletion |

> *Tip: The login screen contains 1-click **"Admin Demo"** and **"Employee Demo"** buttons to log in instantly without typing.*

---

## 🚀 Quick Start Guide

### Prerequisites
* [Node.js](https://nodejs.org/) (v18+ recommended)
* [MongoDB](https://www.mongodb.com/) running locally on port `27017`

### 1. Clone & Setup
```bash
git clone <repo-url>
cd Mini-CRM
```

### 2. Configure Backend (`/server`)
```bash
cd server
npm install

# .env is pre-configured for local MongoDB:
# PORT=5000
# MONGO_URI=mongodb://127.0.0.1:27017/mini_crm
# JWT_SECRET=your_jwt_secret_key
# CLIENT_URL=http://localhost:5173

# (Optional) Seed the database with demo users:
npm run seed:users

# Start backend dev server:
npm run dev
```
*Backend runs on `http://localhost:5000`.*

### 3. Configure Frontend (`/client`)
```bash
cd ../client
npm install

# Start Vite dev server:
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 📡 REST API Reference

All protected endpoints require an `Authorization: Bearer <token>` header.

### Authentication
* `POST /api/auth/login` — Authenticate and retrieve JWT token.
* `GET /api/auth/me` — Retrieve active session profile.

### Leads
* `GET /api/leads` — Fetch leads (Admins see all; Employees see assigned leads only).
* `POST /api/leads` — Create a new lead *(Admin only)*.
* `GET /api/leads/:id` — Fetch lead by ID (Returns 404 for unassigned employee access).
* `PATCH /api/leads/:id` — Update lead (OCC checked via `__v`; Employees cannot reassign).
* `DELETE /api/leads/:id` — Direct deletion of lead *(Admin only)*.

### Deletion Requests
* `POST /api/deletion-requests` — Submit a deletion request with reason.
* `GET /api/deletion-requests` — View deletion requests (Filtered horizontally).
* `POST /api/deletion-requests/:id/approve` — Approve deletion & remove lead *(Admin only)*.
* `POST /api/deletion-requests/:id/reject` — Reject deletion & keep lead *(Admin only)*.

### Employees
* `GET /api/employees` — Fetch active employee roster *(Admin only)*.
* `POST /api/employees` — Provision a new employee account *(Admin only)*.

---

## 🛡️ Concurrency Control (OCC) Walkthrough

1. User A and User B open the edit modal for Lead #101 (`__v: 0`).
2. User A updates the status to `QUALIFIED` and saves. The database updates the document and increments `__v` to `1`.
3. User B attempts to save notes using their stale form state (`__v: 0`).
4. The server compares versions, intercepts the collision, and rejects the request with **HTTP `409 Conflict`**.
5. The UI displays an alert: *"Concurrency Conflict (OCC): Another user modified this lead while you were editing it."*
6. User B clicks **"Reload Latest Changes"** to fetch the updated lead without losing context.

---

## 📚 Detailed Documentation

For an in-depth breakdown of each architectural phase, code walk-throughs, and software engineering concepts:
* [PROJECT_CONTEXT.md](file:///d:/Personal_projects/Mini-CRM/PROJECT_CONTEXT.md) — Architectural design, requirements, and RBAC matrix.
* [PHASE_DOCUMENTATION.md](file:///d:/Personal_projects/Mini-CRM/PHASE_DOCUMENTATION.md) — Complete logs of Phases 1 through 8 with deep-dive technical explanations.
