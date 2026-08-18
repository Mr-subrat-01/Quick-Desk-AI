# QuickDesk AI

AI-assisted internal helpdesk platform for support agents and employees.

## Tech Stack
- Backend: NestJS
- Frontend: React (Vite)
- Database: PostgreSQL (Prisma ORM)
- Infrastructure: Docker Compose

## Quick Start (Development)

1. Start PostgreSQL database:
```bash
docker compose up -d postgres
```

2. Run Backend:
```bash
cd quick-desk-backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
```

3. Run Frontend:
```bash
cd quick-desk-frontend
npm install
npm run dev
```

App URLs:
- Frontend: http://localhost:4000
- Backend: http://localhost:5001
