#!/usr/bin/env node
/**
 * Production entrypoint:
 *   1. Sync database schema (`prisma db push --accept-data-loss`)
 *      — chosen over `migrate deploy` for the prototype phase since no migrations
 *      have been generated yet. Switch to `migrate deploy` once the schema stabilises.
 *   2. Optionally seed master data when SEED_ON_BOOT=true (upsert pattern, idempotent).
 *   3. Start the NestJS API server.
 *
 * Used by Railway / Render / Fly (see DEPLOY.md).
 */
const { spawn, spawnSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const path = require('node:path');

const apiDir = path.resolve(__dirname, '..');
const schemaPath = path.join(apiDir, 'prisma', 'schema.prisma');

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', cwd: apiDir });
  if (result.status !== 0) {
    console.error(`[start-prod] command failed: ${cmd} ${args.join(' ')}`);
    process.exit(result.status ?? 1);
  }
}

if (!existsSync(schemaPath)) {
  console.error(`[start-prod] prisma schema not found at ${schemaPath}`);
  process.exit(1);
}

console.log('[start-prod] syncing database schema...');
run('npx', ['prisma', 'db', 'push', '--schema', schemaPath, '--accept-data-loss', '--skip-generate']);

if (process.env.SEED_ON_BOOT === 'true') {
  console.log('[start-prod] running seed...');
  run('npx', ['tsx', path.join(apiDir, 'prisma', 'seed.ts')]);
}

console.log('[start-prod] starting NestJS server...');
const child = spawn('node', [path.join(apiDir, 'dist', 'main.js')], { stdio: 'inherit', cwd: apiDir });

const forward = (signal) => () => child.kill(signal);
process.on('SIGTERM', forward('SIGTERM'));
process.on('SIGINT', forward('SIGINT'));
child.on('exit', (code) => process.exit(code ?? 0));
