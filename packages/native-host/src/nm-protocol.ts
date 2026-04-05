/**
 * Native Messaging protocol implementation.
 *
 * Messages are framed with a 4-byte little-endian uint32 length prefix,
 * followed by a UTF-8 JSON body. This is the standard WebExtension native
 * messaging wire format.
 *
 * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_messaging#app_side
 */

import type { Readable, Writable } from 'node:stream';

export async function readNativeMessage(stdin: Readable): Promise<unknown> {
  const lengthBuf = await readExact(stdin, 4);
  const length = lengthBuf.readUInt32LE(0);

  if (length === 0) {
    throw new Error('Received zero-length native message');
  }

  const bodyBuf = await readExact(stdin, length);
  const json = bodyBuf.toString('utf8');
  return JSON.parse(json);
}

export function writeNativeMessage(stdout: Writable, message: unknown): void {
  const json = JSON.stringify(message);
  const bodyBuf = Buffer.from(json, 'utf8');
  const lengthBuf = Buffer.allocUnsafe(4);
  lengthBuf.writeUInt32LE(bodyBuf.byteLength, 0);
  stdout.write(lengthBuf);
  stdout.write(bodyBuf);
}

function readExact(stream: Readable, bytes: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let received = 0;

    function onData(chunk: Buffer): void {
      chunks.push(chunk);
      received += chunk.byteLength;
      if (received >= bytes) {
        stream.off('data', onData);
        stream.off('error', onError);
        stream.off('end', onEnd);
        const full = Buffer.concat(chunks);
        resolve(full.subarray(0, bytes));
      }
    }

    function onError(err: Error): void {
      stream.off('data', onData);
      stream.off('error', onError);
      stream.off('end', onEnd);
      reject(err);
    }

    function onEnd(): void {
      stream.off('data', onData);
      stream.off('error', onError);
      stream.off('end', onEnd);
      reject(new Error('Stream ended before reading enough bytes'));
    }

    stream.on('data', onData);
    stream.on('error', onError);
    stream.on('end', onEnd);
  });
}
