# Database migrations

## Local demo: SQLite

The local demo uses Prisma with SQLite for a zero-configuration start.

```bash
cd backend
npx prisma db push
npm run db:seed
```

From the repository root:

```bash
npm run db:setup
```

The database lives at `backend/prisma/dev.db` (resolved relative to the Prisma schema) and is excluded from git and from the delivery ZIP.

An initial SQLite SQL migration is checked in at:

```text
backend/prisma/migrations/20261111000000_init/migration.sql
backend/prisma/migrations/migration_lock.toml
```

`db push` is used for the convenience setup because it does not require a shadow database. For a migration-history workflow:

```bash
cd backend
npx prisma migrate dev
```

## Production target: PostgreSQL

The production schema is:

```text
backend/prisma/schema.postgresql.prisma
```

The matching initial migration is:

```text
backend/prisma/postgresql/migrations/20261111000000_init/migration.sql
backend/prisma/postgresql/migrations/migration_lock.toml
```

The PostgreSQL migration contains the relational schema plus a partial unique index that prevents two active appointments for the same doctor and start time:

```sql
CREATE UNIQUE INDEX "Appointment_active_slot_unique"
ON "Appointment" ("doctorId", "startAt")
WHERE "status" IN ('CONFIRMED', 'PENDING_PAYMENT', 'IN_PROGRESS');
```

This index is a production safety net on top of the route-level transactional check. The demo also cancels expired payment holds before it attempts a new booking so their slots can be reused.

### Switch procedure (reviewed branch, not live demo)

> Perform this on a deployment branch with a real PostgreSQL database. Do not overwrite the local SQLite schema in the demo branch unless you intend to switch entirely.

1. **Back up** the existing schema and database.
2. Replace the active schema with the PostgreSQL schema:
   ```bash
   cp backend/prisma/schema.postgresql.prisma backend/prisma/schema.prisma
   ```
3. Replace the migration directory with the PostgreSQL migration set:
   ```bash
   rm -rf backend/prisma/migrations
   cp -R backend/prisma/postgresql/migrations backend/prisma/migrations
   ```
4. Set `DATABASE_URL` to a PostgreSQL connection string, for example:
   ```env
   DATABASE_URL="postgresql://nayacura:password@db-host:5432/nayacura?schema=public&sslmode=require"
   ```
5. Generate the Prisma client and apply migrations:
   ```bash
   cd backend
   npx prisma generate
   npx prisma migrate deploy
   ```
6. Seed only in non-production/demo environments:
   ```bash
   npm run db:seed
   ```
   The seed is destructive and should never run against a production database.
7. Run `npm run typecheck`, `npm run build` and the test suite in a staging environment.
8. Review indexes, query plans and connection-pool settings with the expected workload.

### Windows PowerShell equivalent

```powershell
Copy-Item backend/prisma/schema.postgresql.prisma backend/prisma/schema.prisma -Force
Remove-Item backend/prisma/migrations -Recurse -Force
Copy-Item backend/prisma/postgresql/migrations backend/prisma/migrations -Recurse
```

### Important notes

- The SQLite schema is for local development only.
- The seed script is destructive (`deleteMany` across every table) and uses demo data.
- The demo does not implement zero-downtime migrations. Production deployments should use a reviewed migration pipeline, backups and a rollback plan.
- Prisma migration history must be preserved. Do not edit applied migrations in a live environment.
- `DATA_ENCRYPTION_KEY` must remain stable across deployments; changing it without a re-encryption migration makes existing clinical notes, prescriptions and AI messages unreadable.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run db:setup` | Push SQLite schema and seed |
| `npm run db:seed` | Destructive demo seed |
| `npm run db:reset` | Force-reset SQLite schema, then seed manually |
| `npx prisma studio` | Inspect the local database |
| `npx prisma migrate diff` | Generate SQL without applying it |
| `npx prisma migrate deploy` | Apply checked-in migrations (production) |
