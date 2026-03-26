# Finyx - Smart Finance Tracker

Finyx is a React + Node/Express app that lets users sign up, track transactions, set budgets and goals, and upgrade to paid plans using Razorpay.

## Features (quick overview)
- Sign up / Sign in with JWT auth
- Protected pages:
  - `Transactions`, `Budget`, `Goals`, `Insights`, `Profile`
- Razorpay subscription checkout from the `Pricing` page
- Server verifies payment and unlocks the selected plan for the user

## Demo URLs (local)
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000`

## 1) Setup Database (MySQL)

This project uses Sequelize models located in `server/src/models`.

### Option A: Create tables using SQL (teacher-friendly)
Run this file in MySQL:
1. Start MySQL
2. In MySQL console:

```sql
SOURCE server/DB_SCHEMA.sql;
```

Tables included:
- `users`
- `transactions`
- `budgets`
- `goals`
- `goal_contributions`
- `subscriptions` (for Razorpay)

You can also read `server/DB_SETUP.md` for an easy explanation.

### Option B: Let Sequelize create tables
The backend calls `sequelize.sync()` on startup. You can use this if your teacher does not require the SQL file.

## 2) Backend Setup (Node/Express)

### Install + run
```bash
cd server
npm install
npm run dev
```

Backend listens on:
- `http://localhost:4000`

### Environment variables
Edit `server/.env` and set:
- `PORT=4000`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASS`
- `DB_NAME`
- `JWT_SECRET`

Razorpay (needed for paid plans):
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

Important: Razorpay secrets must stay on the server (`server/.env`). Do not put them in the frontend.

## 3) Frontend Setup (React/Vite)

### Install + run
```bash
npm install
npm run dev
```

Frontend uses `VITE_API_URL` if present, otherwise it defaults to `http://localhost:4000`.

## Razorpay Subscription Flow (how it works)
1. User opens `/pricing` page
2. User clicks `Buy subscription` for `Pro` or `Elite`
3. Frontend calls:
   - `POST /api/payments/create-order` (creates Razorpay order on the server)
4. Razorpay Checkout opens on the client
5. After successful payment, Razorpay returns payment ids to the frontend handler
6. Frontend calls:
   - `POST /api/payments/verify` (server verifies signature and marks subscription active)
7. App calls `GET /api/auth/me` and the UI can unlock paid features

## API Endpoints (backend)
- Auth:
  - `POST /api/auth/signup`
  - `POST /api/auth/signin`
  - `GET /api/auth/me` (requires JWT)
- Transactions (requires JWT):
  - `GET /api/transactions`
  - `POST /api/transactions`
  - `DELETE /api/transactions/:id`
- Budgets (requires JWT):
  - `GET /api/budgets?month=YYYY-MM`
  - `PUT /api/budgets?month=YYYY-MM`
- Goals (requires JWT):
  - `GET /api/goals`
  - `POST /api/goals`
  - (plus other goal-related endpoints in `server/src/routes/goals.js`)
- Payments (requires JWT):
  - `POST /api/payments/create-order`
  - `POST /api/payments/verify`

## Database Schema Files (for quick answers)
- `server/DB_SCHEMA.sql`: SQL to create all tables
- `server/DB_SETUP.md`: easy explanation of the schema and columns
- `server/src/models/Subscription.js`: Sequelize model for `subscriptions`

## Project Structure (high level)
```txt
Finyx/
├─ src/
│  ├─ components/
│  ├─ auth/
│  └─ App.jsx
├─ server/
│  ├─ src/
│  │  ├─ routes/ (auth, transactions, budgets, goals, payments)
│  │  ├─ models/ (User, Transaction, Budget, Goal, Subscription)
│  │  └─ index.js (Express app)
│  ├─ DB_SCHEMA.sql
│  └─ DB_SETUP.md
└─ README.md
```
