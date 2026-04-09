# ZoneBattery

A [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader) plugin for the **Zotac Zone** that displays detailed battery health and status information directly in the Steam UI.

## Features

- Battery health percentage (current full charge vs design capacity)
- Current charge percentage and state (charging / discharging)
- Energy now, full charge, and design capacity (Wh)
- Voltage and energy rate (W)
- Time remaining estimate while discharging

## Installation

### One-line install (recommended)

```bash
curl -L https://raw.githubusercontent.com/CodeLabFivem/ZoneBattery/main/install.sh | bash
```

### Manual install

1. Download the latest release `.tar.gz` from the [Releases](https://github.com/CodeLabFivem/zonebattery/releases) page
2. Extract it to `~/homebrew/plugins/zonebattery/`
3. Restart the plugin loader: `sudo systemctl restart plugin_loader.service`

## Requirements

- [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader) installed on your Zotac Zone
- `upower` available at `/usr/bin/upower` (present by default on SteamOS)

## Building from Source

```bash
pnpm i
pnpm run build
```

Requires Node.js v16.14+ and pnpm v9.

## License

BSD-3-Clause — see [LICENSE](./LICENSE)
