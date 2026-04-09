#!/usr/bin/env bash
set -euo pipefail

# ---------------- CONFIG ----------------
REPO="CodeLabFivem/ZoneBattery"
PACKAGE="ZoneBattery"
TAG="lastest"   # change if needed
PLUGIN_BASE="${HOME}/homebrew/plugins"
PLUGIN_DIR="${PLUGIN_BASE}/${PACKAGE}"
API_URL="https://api.github.com/repos/${REPO}/releases/tags/${TAG}"
# ----------------------------------------

# Do NOT run as root
if [[ "$EUID" -eq 0 ]]; then
  echo "ERROR: Do not run this script as root"
  exit 1
fi

echo "Installing ${PACKAGE} (tag: ${TAG})"

# Temp workspace
TMP_DIR="$(mktemp -d)"
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

# Prepare plugin directory
mkdir -p "$PLUGIN_BASE"
sudo mkdir -p "$PLUGIN_DIR"
sudo chown -R "$USER":"$USER" "$PLUGIN_DIR"

# Build curl args properly (your original bug)
CURL_ARGS=(-fsSL)
if [[ -n "${GITHUB_TOKEN:-}" ]]; then
  CURL_ARGS+=(-H "Authorization: Bearer $GITHUB_TOKEN")
fi

echo "Fetching release metadata..."
RELEASE_JSON=$(curl "${CURL_ARGS[@]}" "$API_URL") || {
  echo "ERROR: Failed to fetch release info"
  exit 1
}

# Extract asset URL (expects exactly ONE asset)
ASSET_URL=$(echo "$RELEASE_JSON" |
  grep '"browser_download_url"' |
  cut -d '"' -f 4 |
  head -n 1)

if [[ -z "$ASSET_URL" ]]; then
  echo "ERROR: No downloadable asset found in release"
  exit 1
fi

echo "Downloading release asset..."
ARCHIVE="${TMP_DIR}/release.tar.gz"
curl -fsSL -L "$ASSET_URL" -o "$ARCHIVE"

echo "Extracting..."
tar -xzf "$ARCHIVE" -C "$TMP_DIR"

# GitHub release tarballs always extract to a single directory
SRC_DIR="$(find "$TMP_DIR" -mindepth 1 -maxdepth 1 -type d | head -n 1)"

if [[ ! -d "$SRC_DIR" ]]; then
  echo "ERROR: Extracted directory not found"
  exit 1
fi

echo "Installing to ${PLUGIN_DIR}..."
rsync -a --delete "${SRC_DIR}/" "${PLUGIN_DIR}/"

echo "Restarting plugin loader..."
sudo systemctl restart plugin_loader.service

echo "✔ ${PACKAGE} installed successfully"
