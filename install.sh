#!/usr/bin/bash

set -e

if [ "$EUID" -eq 0 ]; then
  echo "Please do not run as root"
  exit
fi

repo="CodeLabFivem/ZoneBattery"
package="ZoneBattery"

echo "installing $package"

temp=$(mktemp -d)

sudo chmod -R +w "${HOME}/homebrew/plugins/"
plugin_dir="${HOME}/homebrew/plugins/${package}"
sudo mkdir -p $plugin_dir

# Use GITHUB_TOKEN if set to avoid API rate limits
auth_header=""
if [ -n "$GITHUB_TOKEN" ]; then
  auth_header="-H \"Authorization: Bearer $GITHUB_TOKEN\""
fi

RELEASE=$(curl -s $auth_header "https://api.github.com/repos/${repo}/releases/latest")

MESSAGE=$(echo $RELEASE | grep -o '"message":"[^"]*"' | cut -d '"' -f 4)
if [ -n "$MESSAGE" ]; then
  echo "error: $MESSAGE" >&2
  exit 1
fi

RELEASE_URL=$(echo $RELEASE | grep -o '"browser_download_url":"[^"]*\.tar\.gz"' | cut -d '"' -f 4)
RELEASE_VERSION=$(echo $RELEASE | grep -o '"tag_name":"[^"]*"' | cut -d '"' -f 4)

if [ -z "$RELEASE_URL" ]; then
  echo "Failed to get latest release" >&2
  exit 1
fi

temp_file="${temp}/${package}.tar.gz"

echo "Downloading $package $RELEASE_VERSION"
curl -L "$RELEASE_URL" -o "$temp_file"

sudo tar -xzf "$temp_file" -C $temp
sudo rsync -av "${temp}/${package}/" $plugin_dir --delete

rm "$temp_file"
sudo systemctl restart plugin_loader.service
