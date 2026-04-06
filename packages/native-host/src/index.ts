/**
 * Native host entry point.
 *
 * Gecko calls the host as: firestorm-host <manifest_path> <extension_id>
 * The manifest path is argv[2] and the extension ID is argv[3].
 *
 * Manifest registration (done by setup.sh) ensures only the correct extension
 * can invoke this host for each role.
 */

import { EXTENSION_ID_FIREFOX, EXTENSION_ID_THUNDERBIRD, type MessageFrom } from '@firestorm/shared';
import { Bridge } from './bridge.js';

const extensionId = process.argv[3];

function resolveRole(id: string | undefined): MessageFrom {
  switch (id) {
    case EXTENSION_ID_FIREFOX:
      return 'firefox';
    case EXTENSION_ID_THUNDERBIRD:
      return 'thunderbird';
    default:
      console.error(`[native-host] Unknown extension ID: ${id ?? '(none)'}`);
      process.exit(1);
  }
}

const role = resolveRole(extensionId);
console.error(`[native-host] Starting as role=${role}`);

const bridge = new Bridge(role, process.stdin, process.stdout);
bridge.start();

process.on('SIGTERM', () => {
  bridge.stop();
  process.exit(0);
});
