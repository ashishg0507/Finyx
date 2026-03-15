# Finyx - Smart Finance Tracker

A modern, beautiful finance tracker built with React. Track spending, build budgets, and reach your money goals.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Backend (MySQL + Auth)

This project includes a Node/Express backend at `server/` using **Sequelize + MySQL**.

1) Create a MySQL database (example name: `finyx`).

2) Create `server/.env` based on `server/.env.example` and fill in your MySQL credentials and a `JWT_SECRET`.

3) Install and run the backend:

```bash
cd server
npm install
npm run dev
```

Backend runs at `http://localhost:4000` and the frontend calls it using `VITE_API_URL` (defaults to `http://localhost:4000`).

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **React Icons** - Icon library
 - **Express + Sequelize + MySQL** - Backend, ORM, and database

## Project Structure

```
Finyx/
├── public/          # Static assets
├── src/
│   ├── components/  # React components
│   ├── App.jsx
│   └── main.jsx
└── index.html
```
