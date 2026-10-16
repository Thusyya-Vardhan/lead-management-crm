# Lead Management Dashboard

A focused, high-integrity lead tracking and pipeline management dashboard built with a decoupled **React (Vite + TypeScript)** frontend and **Node.js / Express (TypeScript)** backend backed by **MongoDB (Mongoose ODM)**.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://lead-management-crm-rose.vercel.app/)

> 🚀 **Live Application:** [https://lead-management-crm-rose.vercel.app](https://lead-management-crm-rose.vercel.app/)  
> *(Hosted on Vercel + Render + MongoDB Atlas. Free-tier backend instances sleep when inactive and will automatically wake up via the built-in health gate).*

---

## 🌟 Key Features

* **JWT Authentication & Secure Session Management**:
  * Stateless authentication using signed JSON Web Tokens (`Authorization: Bearer <token>`).
  * Passwords hashed using `bcrypt` with 10 salt rounds before storage.
  * Automatic session restoration and token validation on page reload via `GET /api/auth/me`.
* **Two-Tier Role-Based Access Control (RBAC)**:
  * **ADMIN**: Full pipeline oversight, creates leads, assigns owners, provisions employee accounts, directly deletes records, and approves/rejects deletion requests.
  * **EMPLOYEE**: Strict horizontal isolation (only sees and updates leads assigned to them), cannot reassign leads, and must submit deletion requests for Admin approval.
* **Lead Deletion Approval Workflow with Snapshots**:
  * Employees cannot directly delete leads. Deletion requests store immutable `leadName` and `leadCompany` snapshots so audit records remain readable even after the lead is permanently removed.
* **Horizontal Data Isolation (Row-Level Security)**:
  * Security enforced at the MongoDB query level (`assignedTo === req.user._id`), never in the frontend.
  * Prevents ID enumeration by returning `404 Not Found` (rather than `403 Forbidden`) when accessing unauthorized lead IDs.
* **Executive Metrics & Pipeline Visualization**:
  * Real-time dashboard KPI summaries (Total Leads, Active Pipeline, Win Rate %, Pending Reviews) and segmented status filtering.
* **Modern Dark-Mode UI**:
  * Obsidian/Zinc design system, responsive data tables with avatar initials, dot status indicators, and an instant 1-click demo switcher.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19 + TypeScript + Vite | Single Page Application (SPA) |
| **Styling** | Vanilla CSS Tokens & Glassmorphism | Custom dark theme, responsive components |
| **Icons** | Lucide React | Clean, modern iconography |
| **Backend** | Node.js + Express 5 + TypeScript | REST API with ES Modules |
| **Database** | MongoDB + Mongoose ODM | Document store with indexing & validation |
| **Auth** | JWT (`jsonwebtoken`) + `bcrypt` | Stateless bearer token authentication |

---

## 🔑 Demo Accounts

The database comes pre-seeded with two accounts for instant testing:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@minicrm.com` | `AdminPassword123!` | All leads, assignment, employee provisioning, approval queue |
| **EMPLOYEE** | `employee@minicrm.com` | `EmployeePassword123!` | Assigned leads only, update status/notes, request deletion |

> *Tip: The login screen contains 1-click **"Admin"** and **"Employee"** session switcher buttons to log in instantly without typing.*
>
> 💡 **Customizing Seed Credentials**: You can customize the initial accounts before running the seed script by defining `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD`, `INITIAL_EMPLOYEE_EMAIL`, and `INITIAL_EMPLOYEE_PASSWORD` in `server/.env` (or directly in `server/src/scripts/seedUsers.ts`).

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
# (Optional) INITIAL_ADMIN_EMAIL=admin@minicrm.com
# (Optional) INITIAL_ADMIN_PASSWORD=AdminPassword123!

# Seed default Admin and Employee accounts (REQUIRED to sign in):
npm run seed:users

# Start backend dev server:
npm run dev
```
*Backend runs on `http://localhost:5000`.*
> **Important**: Running `npm run seed:users` creates the default Admin and Employee credentials in MongoDB. You must run this command before logging in for the first time.

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
* `PATCH /api/leads/:id` — Update lead details (Employees cannot reassign).
* `DELETE /api/leads/:id` — Direct deletion of lead *(Admin only)*.

### Deletion Requests
* `POST /api/deletion-requests` — Submit a deletion request with reason.
* `GET /api/deletion-requests` — View deletion requests (Filtered horizontally).
* `POST /api/deletion-requests/:id/approve` — Approve deletion & remove lead *(Admin only)*.
* `POST /api/deletion-requests/:id/reject` — Reject deletion & keep lead *(Admin only)*.

### Employees
* `GET /api/employees` — Fetch active employee roster *(Admin only)*.
* `POST /api/employees` — Provision a new employee account *(Admin only)*.
