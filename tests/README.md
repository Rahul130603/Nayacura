# Tests

The critical API workflow tests live in [`backend/tests`](../backend/tests) so that they can import the Express application factory and use the backend’s Prisma client.

Run from the repository root:

```bash
npm test
```

The command reseeds the local demo SQLite database and runs 11 Vitest + Supertest tests. See [Testing](../docs/TESTING.md) for coverage, the browser QA utility and the manual QA checklist.

> The test command is destructive to the local demo database because it reseeds it. Never point it at production.
