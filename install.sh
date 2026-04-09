#!/usr/bin/bash

set -e

if [ "$EUID" -eq 0 ]; then
  echo "Please do not run as root"
  exit
fi

github_api_url="https://api.github.com/repos/CodeLabFivem/zonebattery/releases/latest"
package="zonebattery"

echo "installing $package"

temp=$(mktemp -d)

sudo chmod -R +w "${HOME}/homebrew/plugins/"
plugin_dir="${HOME}/homebrew/plugins/${package}"
sudo mkdir -p $plugin_dir

RELEASE=$(curl -s "$github_api_url")

MESSAGE=$(echo $RELEASE | grep -o '"message":"[^"]*"' | cut -d '"' -f 4)
RELEASE_URL=$(echo $RELEASE | grep -o '"browser_download_url":"[^"]*\.tar\.gz"' | cut -d '"' -f 4)
RELEASE_VERSION=$(echo $RELEASE | grep -o '"tag_name":"[^"]*"' | cut -d '"' -f 4)

if [[ "$MESSAGE" != "null" ]]; then
  echo "error: $MESSAGE" >&2
  exit 1
fi

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
