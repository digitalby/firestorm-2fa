/**
 * Firefox background service worker (MV3).
 *
 * Connects to the native host and exchanges hello messages with Thunderbird.
 * Service workers can be terminated by the browser at any time, so we
 * reconnect on the chrome.runtime.onStartup and chrome.runtime.onInstalled
 * events as well as on port disconnect.
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
  return { version: 1, from: 'firefox', type, payload, timestamp: Date.now() };
}

let port: chrome.runtime.Port | null = null;

function connect(): void {
  console.log('[firestorm:firefox] Connecting to native host...');
  port = browser.runtime.connectNative(NATIVE_HOST);

  port.onMessage.addListener((msg: unknown) => {
    console.log('[firestorm:firefox] Received:', JSON.stringify(msg));

    const m = msg as FirestormMessage;
    if (m.type === 'hello') {
      console.log(`[firestorm:firefox] Hello from ${m.from}! Payload:`, m.payload);
      // Respond with a pong
      port?.postMessage(makeMessage('pong', 'Hello back from Firefox!'));
    } else if (m.type === 'ping') {
      port?.postMessage(makeMessage('pong', 'pong'));
    }
  });

  port.onDisconnect.addListener(() => {
    const err = browser.runtime.lastError;
    if (err) {
      console.warn('[firestorm:firefox] Native host disconnected:', err.message);
    } else {
      console.log('[firestorm:firefox] Native host disconnected');
    }
    port = null;
    // Reconnect after a short delay (service worker may be restarted by browser)
    setTimeout(connect, 2000);
  });

  // Send hello immediately after connecting
  port.postMessage(makeMessage('hello', 'Hello from Firefox!'));
  console.log('[firestorm:firefox] Sent hello');
}

// Connect on service worker startup
connect();
