#!/usr/bin/env node
import net from 'node:net';
import { spawn } from 'node:child_process';

const port = Number(process.env.PORT || 5000);
const host = process.env.HOST || '0.0.0.0';

function checkPortOpen(portNumber) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(portNumber, host);
  });
}

const available = await checkPortOpen(port);
if (!available) {
  console.error(`\nPort ${port} is already in use. Stop the existing process or set a different PORT.\n`);
  process.exit(1);
}

console.log('\nMorphic Studio local preview is starting...');
console.log(`- Landing page:    http://localhost:${port}/`);
console.log(`- Preview page:    http://localhost:${port}/preview.html`);
console.log(`- API health:      http://localhost:${port}/api/health`);
console.log(`- Bind address:    ${host}`);
if (!process.env.DATABASE_URL) {
  console.log('- Database:        not set; preview/demo API responses will be used.');
}
console.log('\nKeep this terminal open while viewing the website. Press Ctrl+C to stop.\n');

const child = spawn(process.execPath, ['backend/server.js'], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(port), HOST: host },
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
