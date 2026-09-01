# Mock BSE API

A local mock trading application: a React dashboard consumes an Express API backed by MySQL, with Server-Sent Events (SSE) used to refresh clients when trades change.

## Prerequisites

- Node.js 20.6 or later
- MySQL 8.0 or later, running locally
- An account permitted to create the `trades_db` database (the seed script creates it when needed)

## Setup

1. Clone the repository and install dependencies.

   ```powershell
   git clone <repository-url>
   cd mock-bse-api
   npm --prefix backend install
   npm --prefix frontend install
   ```

2. Create `backend/.env` with a MySQL connection URL. Do not commit this file.

   ```dotenv
   DATABASE_URL=mysql://root:root@localhost:3306/trades_db
   PORT=7777
   ```

3. Seed the database from the included CSV. This also creates the database and table if they do not already exist.

   ```powershell
   node --env-file=backend/.env backend/seed.js
   ```

4. Run the API in one terminal.

   ```powershell
   node --env-file=backend/.env backend/server.js
   ```

5. Run the frontend in a second terminal, then open the URL printed by Vite (normally `http://localhost:5173`).

   ```powershell
   npm --prefix frontend run dev
   ```

The API listens on `http://localhost:7777`. Its status endpoint is available at `GET /api/status`.

## Useful commands

```powershell
# Build the frontend for deployment
npm --prefix frontend run build

# Generate Drizzle migration files (requires DATABASE_URL in the environment)
node --env-file=backend/.env ./backend/node_modules/drizzle-kit/bin.cjs generate --config=backend/drizzle.config.js
```

See [the architecture note](docs/architecture.md) for components, data flow, and design rationale.
