export type MessageFrom = 'firefox' | 'thunderbird';
export type MessageType = 'hello' | 'ping' | 'pong';

export interface FirestormMessage {
  readonly version: 1;
  readonly from: MessageFrom;
  readonly type: MessageType;
  readonly payload: unknown;
  readonly timestamp: number;
}

export function isFirestormMessage(value: unknown): value is FirestormMessage {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    v['version'] === 1 &&
    (v['from'] === 'firefox' || v['from'] === 'thunderbird') &&
    (v['type'] === 'hello' || v['type'] === 'ping' || v['type'] === 'pong') &&
    typeof v['timestamp'] === 'number'
  );
}
