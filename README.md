# QuickDesk AI

AI-assisted internal helpdesk platform for support agents and employees built for the QuickDesk coding assessment.

## Tech Stack
- **Backend:** NestJS (TypeScript)
- **Frontend:** Next.js (App Router + Tailwind CSS + TypeScript)
- **Database:** PostgreSQL (Prisma ORM)
- **Authentication:** JWT + HttpOnly Refresh Token Cookies
- **Infrastructure:** Docker Compose

---

## Quick Start (Development)

### Option 1: Docker Compose (Recommended)

Run the full stack (Database + Backend + Frontend + Auto Database Seeding) with a single command:

```bash
docker compose up --build
```

- **Frontend:** [http://localhost:4000](http://localhost:4000)
- **Backend API:** [http://localhost:5001](http://localhost:5001)

---

### Option 2: Local Development

1. **Start PostgreSQL Database:**
   ```bash
   docker compose up -d postgres
   ```

2. **Run Backend:**
   ```bash
   cd quick-desk-backend
   npm install
   npx prisma generate
   npx prisma migrate dev --name init
   npx prisma db seed
   npm run start:dev
   ```

3. **Run Frontend:**
   ```bash
   cd quick-desk-frontend
   npm install
   npm run dev
   ```

---

## Pre-seeded Demo Accounts

The system seeds default test accounts on startup:

* **Agent Account:** `agent@gmail.com` | Password: `12345`
* **Employee Account:** `emp@gmail.com` | Password: `12345`

1-Click pre-fill buttons are available on the `/login` page for fast testing.
