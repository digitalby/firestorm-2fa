import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Broker } from './broker.js';
import type { BrokerSocket } from './broker.js';
import type { FirestormMessage } from '@firestorm/shared';

function makeMockSocket(): BrokerSocket & { sent: string[] } {
  const sent: string[] = [];
  return {
    sent,
    readyState: 1,
    send(data: string) {
      sent.push(data);
    },
  };
}

function makeMessage(from: 'firefox' | 'thunderbird', type: 'hello' | 'ping' | 'pong' = 'hello'): FirestormMessage {
  return { version: 1, from, type, payload: 'test', timestamp: Date.now() };
}

describe('Broker', () => {
  let broker: Broker;

  beforeEach(() => {
    broker = new Broker();
  });

  it('routes a message from firefox to thunderbird', () => {
    const ffSocket = makeMockSocket();
    const tbSocket = makeMockSocket();

    broker.register('firefox', ffSocket);
    broker.register('thunderbird', tbSocket);

    const msg = makeMessage('firefox');
    broker.route(msg);

    expect(tbSocket.sent).toHaveLength(1);
    expect(JSON.parse(tbSocket.sent[0]!)).toEqual(msg);
    expect(ffSocket.sent).toHaveLength(0);
  });

  it('routes a message from thunderbird to firefox', () => {
    const ffSocket = makeMockSocket();
    const tbSocket = makeMockSocket();

    broker.register('firefox', ffSocket);
    broker.register('thunderbird', tbSocket);

    const msg = makeMessage('thunderbird');
    broker.route(msg);

    expect(ffSocket.sent).toHaveLength(1);
    expect(JSON.parse(ffSocket.sent[0]!)).toEqual(msg);
    expect(tbSocket.sent).toHaveLength(0);
  });

  it('drops messages when the target client is not connected', () => {
    const ffSocket = makeMockSocket();
    broker.register('firefox', ffSocket);

    const msg = makeMessage('firefox');
    broker.route(msg); // thunderbird not connected

    expect(ffSocket.sent).toHaveLength(0);
  });

  it('unregisters a client correctly', () => {
    const ffSocket = makeMockSocket();
    const tbSocket = makeMockSocket();

    broker.register('firefox', ffSocket);
    broker.register('thunderbird', tbSocket);
    broker.unregister('firefox');

    expect(broker.connectedRoles()).toEqual(['thunderbird']);
  });

  it('replaces an existing client on re-register', () => {
    const oldSocket = makeMockSocket();
    const newSocket = makeMockSocket();
    const tbSocket = makeMockSocket();

    broker.register('firefox', oldSocket);
    broker.register('thunderbird', tbSocket);
    broker.register('firefox', newSocket); // reconnect

    const msg = makeMessage('thunderbird');
    broker.route(msg);

    expect(newSocket.sent).toHaveLength(1);
    expect(oldSocket.sent).toHaveLength(0);
  });

  it('reports connected roles', () => {
    expect(broker.connectedRoles()).toEqual([]);
    broker.register('firefox', makeMockSocket());
    expect(broker.connectedRoles()).toEqual(['firefox']);
    broker.register('thunderbird', makeMockSocket());
    expect(broker.connectedRoles()).toHaveLength(2);
  });
});
