const { spawnSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const { resolve } = require('node:path');
const { loadEnvFile } = require('node:process');

const backendDirectory = resolve(__dirname, '..');
const envFile = resolve(backendDirectory, '.env');
if (!process.env.DATABASE_URL && existsSync(envFile)) loadEnvFile(envFile);

const databaseUrl = process.env.DATABASE_URL || '';
const schema = /^postgres(?:ql)?:\/\//.test(databaseUrl)
  ? 'prisma/schema.postgresql.prisma'
  : 'prisma/schema.prisma';

const result = spawnSync(process.execPath, [require.resolve('prisma'), 'generate', '--schema', schema], {
  cwd: backendDirectory,
  stdio: 'inherit',
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
