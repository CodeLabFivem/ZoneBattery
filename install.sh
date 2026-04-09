#!/usr/bin/env bash
set -euo pipefail

# ---------------- CONFIG ----------------
REPO="CodeLabFivem/ZoneBattery"
PACKAGE="ZoneBattery"
PLUGIN_BASE="$HOME/homebrew/plugins"
PLUGIN_DIR="$PLUGIN_BASE/$PACKAGE"
API_URL="https://api.github.com/repos/$REPO/releases/latest"
# ---------------------------------------

# Do not run as root
if [[ "$EUID" -eq 0 ]]; then
  echo "ERROR: Do not run this script as root"
  exit 1
fi

echo "Installing $PACKAGE from latest GitHub release"

# Temp directory
TMP_DIR="$(mktemp -d)"
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

# Ensure plugin base exists
mkdir -p "$PLUGIN_BASE"

# Build curl args correctly (THIS FIXES YOUR 403)
CURL_ARGS=(-fsSL)
if [[ -n "${GITHUB_TOKEN:-}" ]]; then
  CURL_ARGS+=(-H "Authorization: Bearer $GITHUB_TOKEN")
fi

echo "Fetching release metadata..."
RELEASE_JSON=$(curl "${CURL_ARGS[@]}" "$API_URL") || {
  echo "ERROR: Failed to fetch release info"
  echo "Causes:"
  echo "  - Invalid or missing GITHUB_TOKEN"
  echo "  - GitHub API rate limit"
  echo "  - Repo/release does not exist"
  exit 1
}

# Extract first asset URL
ASSET_URL=$(echo "$RELEASE_JSON" |
  grep '"browser_download_url"' |
  cut -d '"' -f 4 |
  head -n 1)

if [[ -z "$ASSET_URL" ]]; then
  echo "ERROR: No downloadable asset found in the latest release"
  exit 1
fi

echo "Downloading release asset..."
ARCHIVE="$TMP_DIR/release.tar.gz"
curl -fsSL -L "$ASSET_URL" -o "$ARCHIVE"

echo "Extracting..."
tar -xzf "$ARCHIVE" -C "$TMP_DIR"

SRC_DIR="$(find "$TMP_DIR" -mindepth 1 -maxdepth 1 -type d | head -n 1)"
if [[ ! -d "$SRC_DIR" ]]; then
  echo "ERROR: Failed to locate extracted directory"
  exit 1
fi

echo "Installing to $PLUGIN_DIR..."
sudo mkdir -p "$PLUGIN_DIR"
sudo rsync -a --delete "$SRC_DIR/" "$PLUGIN_DIR/"
sudo chown -R "$USER":"$USER" "$PLUGIN_DIR"

echo "Restarting plugin loader..."
sudo systemctl restart plugin_loader.service

echo "✔ $PACKAGE installed successfully"
