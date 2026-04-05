import { WebSocketServer, WebSocket } from 'ws';
import { BROKER_HOST, BROKER_PORT, isFirestormMessage, type MessageFrom } from '@firestorm/shared';
import { Broker } from './broker.js';

const ROLE_HEADER = 'x-firestorm-role';

const broker = new Broker();
const wss = new WebSocketServer({ host: BROKER_HOST, port: BROKER_PORT });

wss.on('listening', () => {
  console.log(`[broker] Listening on ${BROKER_HOST}:${BROKER_PORT}`);
});

wss.on('connection', (ws: WebSocket, req) => {
  const rawRole = req.headers[ROLE_HEADER];
  const role = rawRole === 'firefox' || rawRole === 'thunderbird' ? rawRole as MessageFrom : null;

  if (role === null) {
    console.warn(`[broker] Connection rejected: missing or invalid ${ROLE_HEADER} header`);
    ws.close(1008, 'Missing role header');
    return;
  }

  broker.register(role, ws);

  ws.on('message', (data) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(data.toString());
    } catch {
      console.warn(`[broker] Ignoring non-JSON message from ${role}`);
      return;
    }

    if (!isFirestormMessage(parsed)) {
      console.warn(`[broker] Ignoring malformed message from ${role}`);
      return;
    }

    if (parsed.from !== role) {
      console.warn(`[broker] Message from=${parsed.from} does not match registered role=${role} — ignoring`);
      return;
    }

    broker.route(parsed);
  });

  ws.on('close', () => {
    broker.unregister(role);
  });

  ws.on('error', (err) => {
    console.error(`[broker] WebSocket error for ${role}:`, err.message);
  });
});

wss.on('error', (err) => {
  console.error('[broker] Server error:', err.message);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('[broker] SIGTERM received, shutting down');
  wss.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('[broker] SIGINT received, shutting down');
  wss.close(() => process.exit(0));
});
