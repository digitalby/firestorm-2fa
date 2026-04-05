/**
 * Bridges Native Messaging stdio to the broker WebSocket.
 *
 * The browser spawns this process via native messaging and communicates over
 * stdin/stdout. This bridge connects to the broker and relays messages in both
 * directions.
 */

import { WebSocket } from 'ws';
import { BROKER_HOST, BROKER_PORT, isFirestormMessage, type MessageFrom } from '@firestorm/shared';
import { readNativeMessage, writeNativeMessage } from './nm-protocol.js';
import type { Readable, Writable } from 'node:stream';

const INITIAL_BACKOFF_MS = 500;
const MAX_BACKOFF_MS = 30_000;
const BACKOFF_FACTOR = 2;

export class Bridge {
  private ws: WebSocket | null = null;
  private backoffMs = INITIAL_BACKOFF_MS;
  private stopping = false;

  constructor(
    private readonly role: MessageFrom,
    private readonly stdin: Readable,
    private readonly stdout: Writable,
  ) {}

  start(): void {
    this.connectToBroker();
    this.readLoop().catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[native-host:${this.role}] Read loop error: ${message}`);
      this.stop();
    });
  }

  stop(): void {
    this.stopping = true;
    this.ws?.close();
  }

  private connectToBroker(): void {
    if (this.stopping) return;

    const url = `ws://${BROKER_HOST}:${BROKER_PORT}`;
    console.error(`[native-host:${this.role}] Connecting to broker at ${url}`);

    const ws = new WebSocket(url, {
      headers: { 'x-firestorm-role': this.role },
    });

    ws.on('open', () => {
      console.error(`[native-host:${this.role}] Connected to broker`);
      this.backoffMs = INITIAL_BACKOFF_MS;
    });

    ws.on('message', (data) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(data.toString());
      } catch {
        console.error(`[native-host:${this.role}] Received non-JSON from broker`);
        return;
      }

      if (!isFirestormMessage(parsed)) {
        console.error(`[native-host:${this.role}] Received malformed message from broker`);
        return;
      }

      writeNativeMessage(this.stdout, parsed);
    });

    ws.on('close', (code, reason) => {
      console.error(`[native-host:${this.role}] Broker disconnected (${code} ${reason.toString()})`);
      this.ws = null;
      this.scheduleReconnect();
    });

    ws.on('error', (err) => {
      console.error(`[native-host:${this.role}] WebSocket error: ${err.message}`);
    });

    this.ws = ws;
  }

  private scheduleReconnect(): void {
    if (this.stopping) return;
    console.error(`[native-host:${this.role}] Reconnecting in ${this.backoffMs}ms`);
    setTimeout(() => this.connectToBroker(), this.backoffMs);
    this.backoffMs = Math.min(this.backoffMs * BACKOFF_FACTOR, MAX_BACKOFF_MS);
  }

  private async readLoop(): Promise<void> {
    // Set raw mode for stdin so we can read binary data correctly
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();

    while (!this.stopping) {
      const message = await readNativeMessage(this.stdin);

      if (!isFirestormMessage(message)) {
        console.error(`[native-host:${this.role}] Dropping malformed message from extension`);
        continue;
      }

      if (this.ws === null || this.ws.readyState !== WebSocket.OPEN) {
        console.error(`[native-host:${this.role}] Broker not connected — dropping message type=${message.type}`);
        continue;
      }

      this.ws.send(JSON.stringify(message));
    }
  }
}
