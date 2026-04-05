/**
 * Thunderbird background page (MV2, persistent).
 *
 * Connects to the native host and exchanges hello messages with Firefox.
 * MV2 persistent background pages remain alive for the browser session,
 * so we only need to handle unexpected disconnects.
 */

declare const browser: typeof chrome;

const NATIVE_HOST = 'me.digitalby.firestorm';

interface FirestormMessage {
  version: 1;
  from: 'firefox' | 'thunderbird';
  type: 'hello' | 'ping' | 'pong';
  payload: unknown;
  timestamp: number;
}

function makeMessage(type: FirestormMessage['type'], payload: unknown = null): FirestormMessage {
  return { version: 1, from: 'thunderbird', type, payload, timestamp: Date.now() };
}

let port: chrome.runtime.Port | null = null;

function connect(): void {
  console.log('[firestorm:thunderbird] Connecting to native host...');
  port = browser.runtime.connectNative(NATIVE_HOST);

  port.onMessage.addListener((msg: unknown) => {
    console.log('[firestorm:thunderbird] Received:', JSON.stringify(msg));

    const m = msg as FirestormMessage;
    if (m.type === 'hello') {
      console.log(`[firestorm:thunderbird] Hello from ${m.from}! Payload:`, m.payload);
      // Respond with a hello back
      port?.postMessage(makeMessage('hello', 'Hello back from Thunderbird!'));
    } else if (m.type === 'ping') {
      port?.postMessage(makeMessage('pong', 'pong'));
    } else if (m.type === 'pong') {
      console.log('[firestorm:thunderbird] Received pong:', m.payload);
    }
  });

  port.onDisconnect.addListener(() => {
    const err = browser.runtime.lastError;
    if (err) {
      console.warn('[firestorm:thunderbird] Native host disconnected:', err.message);
    } else {
      console.log('[firestorm:thunderbird] Native host disconnected');
    }
    port = null;
    setTimeout(connect, 2000);
  });

  // Send hello immediately after connecting
  port.postMessage(makeMessage('hello', 'Hello from Thunderbird!'));
  console.log('[firestorm:thunderbird] Sent hello');
}

connect();
