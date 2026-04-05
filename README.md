# Firestorm 2FA

IPC bridge between Firefox and Thunderbird, implemented as a pair of browser extensions communicating through a local native messaging host and WebSocket broker.

## Architecture

```
Firefox extension  ──native messaging──►  native-host (Firefox role)
                                               │
                                               ▼
                                        broker (WebSocket)
                                               │
                                               ▼
Thunderbird extension  ◄──native messaging──  native-host (Thunderbird role)
```

| Component | Location | Description |
|-----------|----------|-------------|
| `packages/firefox` | Browser extension (MV3) | Runs in Firefox; initiates or receives messages |
| `packages/thunderbird` | Browser extension (MV2) | Runs in Thunderbird; initiates or receives messages |
| `packages/native-host` | Node.js process | Launched by each browser via native messaging; connects to the broker |
| `packages/broker` | Node.js WebSocket server | Routes messages between the two native-host instances |
| `packages/shared` | Library | Shared types, constants, and message validation |

The broker runs as a persistent local process. Each browser extension spawns its own native-host instance, which connects to the broker over a local WebSocket.

## Requirements

- macOS (native messaging manifest paths are macOS-specific)
- Node.js 22+
- pnpm
- Firefox 109+
- Thunderbird 102+

## Installation

### From Firefox Add-ons / Thunderbird Add-ons (recommended)

Install the extensions from the marketplace listings. The native host and broker must still be installed manually (see [Native host setup](#native-host-setup) below).

### Manual XPI installation

Download the signed `.xpi` files from the [latest GitHub Release](../../releases/latest):

- `firestorm-firefox-*.xpi` — drag onto `about:addons` in Firefox, or open with Firefox directly
- `firestorm-thunderbird-*.xpi` — drag onto the Thunderbird Add-ons Manager, or open with Thunderbird directly

Then complete the [native host setup](#native-host-setup).

### Native host setup

The extensions communicate through a local native messaging host. After installing both extensions:

```sh
git clone https://github.com/digitalby/firestorm-2fa.git
cd firestorm-2fa
pnpm install
pnpm build
./scripts/setup.sh
```

`setup.sh` compiles the native host and broker, then registers the native messaging manifests at:

- `~/Library/Application Support/Mozilla/NativeMessagingHosts/me.digitalby.firestorm.json`
- `~/Library/Application Support/Thunderbird/NativeMessagingHosts/me.digitalby.firestorm.json`

To unregister:

```sh
./scripts/teardown.sh
```

## Development

```sh
pnpm install
./scripts/setup.sh   # first run only
pnpm dev             # starts broker + watches both extensions
```

This launches the broker, compiles both extension backgrounds in watch mode, and starts Firefox and Thunderbird with isolated dev profiles pointing to the local extension source.

### Commands

| Command | Description |
|---------|-------------|
| `pnpm build` | Compile all packages |
| `pnpm test` | Run all tests |
| `pnpm lint` | Run web-ext lint on both extensions |
| `pnpm dev` | Start broker + watch mode + browser instances |
| `./scripts/teardown.sh` | Remove native messaging registrations |

## Releasing

Releases are fully automated. After bumping the version in both `manifest.json` files and all `package.json` files:

```sh
git tag v1.2.3
git push origin v1.2.3
```

The release workflow will:

1. Lint and test
2. Build and sign both addons (unlisted channel) for direct download
3. Create a GitHub Release with signed `.xpi` attachments
4. Submit both addons to AMO (Firefox) and ATN (Thunderbird) for marketplace listing

See open issues for prerequisites before the first release.

## Extension IDs

| Extension | ID |
|-----------|----|
| Firefox | `firestorm-firefox@me.digitalby` |
| Thunderbird | `firestorm-thunderbird@me.digitalby` |
| Native host | `me.digitalby.firestorm` |

## License

[MIT](LICENSE)
