#!/bin/bash
# Download miniserve web server binaries for Story Adventure launcher
# Run this script to fetch the latest miniserve binaries for bundle creation

set -e

MINISERVE_VERSION="v0.32.0"
LAUNCHER_DIR="packages/editor/public/launcher"
BASE_URL="https://github.com/svenstaro/miniserve/releases/download/${MINISERVE_VERSION}"

echo "Downloading miniserve ${MINISERVE_VERSION} binaries..."
echo ""

# Create launcher directory if it doesn't exist
mkdir -p "${LAUNCHER_DIR}"

# Download Linux binary
echo "Downloading Linux x86_64 binary..."
curl -L -o "${LAUNCHER_DIR}/miniserve-linux" \
  "${BASE_URL}/miniserve-0.32.0-x86_64-unknown-linux-gnu"
chmod +x "${LAUNCHER_DIR}/miniserve-linux"
echo "✓ Linux binary downloaded"

# Download Windows binary
echo "Downloading Windows x86_64 binary..."
curl -L -o "${LAUNCHER_DIR}/miniserve-win.exe" \
  "${BASE_URL}/miniserve-0.32.0-x86_64-pc-windows-msvc.exe"
echo "✓ Windows binary downloaded"

echo ""
echo "All binaries downloaded successfully!"
echo ""
echo "File sizes:"
ls -lh "${LAUNCHER_DIR}"/miniserve-* | awk '{print $9, ":", $5}'
echo ""
echo "You can now run: pnpm build:viewer-for-bundle"
