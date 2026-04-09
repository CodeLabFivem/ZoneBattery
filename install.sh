#!/usr/bin/bash
set -e
if [ "$EUID" -eq 0 ]; then
  echo "Please do not run as root"
  exit
fi
github_api_url="https://api.github.com/repos/codelab/zonebattery/releases/latest"
package="zonebattery"
echo "installing $package"
temp=$(mktemp -d)
sudo chmod -R +w "${HOME}/homebrew/plugins/"
plugin_dir="${HOME}/homebrew/plugins/${package}"
sudo mkdir -p $plugin_dir
use_jq=false
if [ -x "$(command -v jq)" ]; then
  use_jq=true
fi
RELEASE=$(curl -s "$github_api_url")
if [[ $use_jq == true ]]; then
  echo "Using jq"
  MESSAGE=$(echo "$RELEASE" | jq -r '.message // "null"')
  RELEASE_VERSION=$(echo "$RELEASE" | jq -r '.tag_name')
# Fix: search all assets for the .tar.gz, not just index [0]
  RELEASE_URL=$(echo "$RELEASE" | jq -r '.assets[] | .browser_download_url | select(endswith(".tar.gz"))' | head -n1)
else
  MESSAGE=$(echo $RELEASE | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
  RELEASE_URL=$(echo $RELEASE | grep -o '"browser_download_url":"[^"]*\.tar\.gz"' | cut -d'"' -f4)
  RELEASE_VERSION=$(echo $RELEASE | grep "tag_name" | cut -d '"' -f 4)
fi
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
