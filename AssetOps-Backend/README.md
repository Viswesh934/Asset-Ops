# Fastify & Drizzle Login Server Template

This is a clean, minimal, compile-safe backend template focused exclusively on credentials-based login.

## Features

- **Fastify Framework** for high-performance HTTP operations.
- **Drizzle ORM** for SQL schema definitions.
- **JWT-Based Authentication** for producing access tokens.
- **Bcrypt Password Hashing** for credential verification.
- **Roles & Permissions Decorators** to easily gate private routes (e.g. `fastify.authenticate`, `fastify.authorize('perm')`, `fastify.requireRoles(['admin'])`).
- **Structured JSON Logging** with Pino.
- **Rate-Limiting** and security headers configured out-of-the-box.

## Project Structure

```text
├── src
│   ├── db
│   │   ├── connection.ts        # Database connection pool and client getters
│   │   └── schema.ts            # Minimal schema (tenant, user, roles, permissions)
│   ├── handlers
│   │   └── api.ts               # Server entry point and plugin registrations
│   ├── lib
│   │   └── logger.ts            # Pino logger configuration
│   ├── plugins
│   │   ├── auth.ts              # Auth hooks and access control decorators
│   │   └── dbErrorHandler.ts    # Centralized PG/Validation error mapping
│   ├── routes
│   │   ├── auth.ts              # /login endpoint
│   │   └── health.ts            # /health database connectivity check
│   └── utils
│       ├── authUtils.ts         # JWT payload build helper
│       └── dbRetry.ts           # Automatic reconnection handling
├── .env.example
├── package.json
└── tsconfig.json
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure your Postgres database connection details and secret keys:

```bash
cp .env.example .env
```

### 3. Database Migration / Seed

Below is a simple SQL script to set up the necessary tables and seed a default admin user:

```sql
-- Create Tenant
INSERT INTO tenant (id, name, is_active)
VALUES ('00000000-0000-0000-0000-000000000000', 'Default Tenant', true);

-- Create Admin User (password: admin123)
-- bcrypt hash of "admin123" is "$2a$10$wN9a2K5.W1F/C6C5V5C4beFwG6P1g22K1j11K1j11K1j11K1j11K1"
INSERT INTO user_master (id, login, password, tenant, is_active, username, reset_password, default_user)
VALUES (
  '11111111-1111-1111-1111-111111111111', 
  'admin@example.com', 
  '$2a$10$mBrdg/Rz5f8X4G4J/m8LBe/7n9B8wO0w0vQ7734iZ6qHwG6YV2xve', 
  '00000000-0000-0000-0000-000000000000', 
  true, 
  'admin', 
  false, 
  true
);

-- Map Admin User to Admin Role
INSERT INTO user_role_map (id, user_id, tenant, role, is_active)
VALUES (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'ROLE.ADMIN',
  true
);
```

### 4. Run Development Server

```bash
npm run dev
```

The server starts on port `3000` (or `PORT` from `.env`).

## API Endpoints

- **POST `/api/login`**: Accepts `{ email, password }` and returns token payload.
- **GET `/api/health`**: Simple health check validating database connectivity.
