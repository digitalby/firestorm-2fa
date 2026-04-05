import type { FirestormMessage, MessageFrom } from '@firestorm/shared';

export interface BrokerSocket {
  send(data: string): void;
  readonly readyState: number;
}

export class Broker {
  private readonly clients = new Map<MessageFrom, BrokerSocket>();

  register(role: MessageFrom, socket: BrokerSocket): void {
    const existing = this.clients.get(role);
    if (existing !== undefined) {
      console.warn(`[broker] Replacing existing ${role} connection`);
    }
    this.clients.set(role, socket);
    console.log(`[broker] ${role} connected (${this.clients.size} client(s))`);
  }

  unregister(role: MessageFrom): void {
    this.clients.delete(role);
    console.log(`[broker] ${role} disconnected (${this.clients.size} client(s))`);
  }

  route(msg: FirestormMessage): void {
    const from = msg.from;
    const to: MessageFrom = from === 'firefox' ? 'thunderbird' : 'firefox';
    const target = this.clients.get(to);

    if (target === undefined) {
      console.warn(`[broker] No ${to} client connected — dropping message type=${msg.type}`);
      return;
    }

    target.send(JSON.stringify(msg));
    console.log(`[broker] Routed ${msg.type} from ${from} → ${to}`);
  }

  connectedRoles(): ReadonlyArray<MessageFrom> {
    return [...this.clients.keys()];
  }
}
