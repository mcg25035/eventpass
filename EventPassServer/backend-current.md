# Backend Implementation Status

## Overview
This document summarizes the current state of the **EventPass Server**. It is a **Node.js** application written in **TypeScript**, using **Express** for the API and **Sequelize** with **SQLite** for data persistence. It is designed to support the **BadgeChain** system with both online and offline verification capabilities.

## Infrastructure
- **Directory**: `EventPassServer`
- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: SQLite (via Sequelize ORM)
- **Authentication**: JWT (JSON Web Tokens) with Bcrypt password hashing.

## Database Schema (Implemented)
The database (`database.sqlite`) is automatically initialized with the following models:

1.  **User**: `id` (UUID), `username`, `email`, `password_hash`
2.  **Organizer**: `id` (UUID), `name`, `email`, `password_hash`
3.  **Event**: `id` (UUID), `organizer_id`, `title`, `start_time`, `end_time`, `session_key`
4.  **BadgeTemplate**: `id` (UUID), `event_id`, `name`, `type`, `icon`, `limit`
5.  **Record**: `id` (UUID), `issued_at`, `hash`, Links User->Event->Badge
6.  **PendingValidation**: Stores offline sync data (Phase 3 foundation)

## API Endpoints Implemented

### 1. Authentication (`/auth`)
- `POST /auth/register`: Register as a User or Organizer.
- `POST /auth/login`: Authenticate and receive a JWT.

### 2. Organizer Management (`/organizer`)
- `GET /organizer/events`: List all events for an organizer.
- `POST /organizer/events`: Create a new event.
- `GET /organizer/events/:id/badges`: Get badges for a specific event (matches Frontend "Badge List").
- `POST /organizer/events/:id/badges`: Create a new badge template (matches Frontend "Badge Edit").

### 3. Online Verification (`/organizer`) - Phase 2
- `POST /organizer/events/online/token`: Generate a short-lived session token (5 min validity) for online issuance.
- `POST /organizer/records/issue`: Directly issue a badge record to a user using the valid token.

## How to Run

### Scripts
- `npm run dev`: Starts the server in watch mode (nodemon + ts-node).
- `npm run build`: Compiles TypeScript to `dist/`.
- `npm start`: Runs the compiled JavaScript from `dist/`.

### Quick Start
```bash
cd EventPassServer
npm run dev
# Server running on http://localhost:3000
```
