# ZoneBattery

A [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader) plugin for the **Zotac Zone** that displays detailed battery health and status information directly in the Steam UI.

## Features

- Battery health percentage (current full charge vs design capacity)
- Current charge percentage and state (charging / discharging)
- Energy now, full charge, and design capacity (Wh)
- Voltage and energy rate (W)
- Time remaining estimate while discharging

## Installation

1. Download the latest release `.tar.gz` from the [Releases](https://github.com/CodeLabFivem/zonebattery/releases) page
2. Rename the zip and the folder to `ZoneBattery`
3. Copy it to `~/homebrew/plugins/`
4. Restart the plugin loader: `sudo systemctl restart plugin_loader.service`

## Requirements

- [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader) installed on your Zotac Zone
- `upower` available at `/usr/bin/upower` (present by default on SteamOS)

## License

CodeLab — see [LICENSE](./LICENSE)
