#!/bin/bash
# Download tVeb web server binaries for Story Adventure launcher
# Run this script to fetch the latest tVeb binaries for bundle creation

set -e

TVEB_VERSION="v0.2.0"
LAUNCHER_DIR="packages/editor/public/launcher"
BASE_URL="https://github.com/davlgd/tVeb/releases/download/${TVEB_VERSION}"

echo "Downloading tVeb ${TVEB_VERSION} binaries..."
echo ""

# Create launcher directory if it doesn't exist
mkdir -p "${LAUNCHER_DIR}"

# Download Linux binary
echo "Downloading Linux x86_64 binary..."
curl -L -o "${LAUNCHER_DIR}/tVeb-linux-x86_64" \
  "${BASE_URL}/tVeb-linux-x86_64"
chmod +x "${LAUNCHER_DIR}/tVeb-linux-x86_64"
echo "✓ Linux binary downloaded"

# Download Windows binary
echo "Downloading Windows x86_64 binary..."
curl -L -o "${LAUNCHER_DIR}/tVeb-windows-x86_64.exe" \
  "${BASE_URL}/tVeb-windows-x86_64.exe"
echo "✓ Windows binary downloaded"

echo ""
echo "All binaries downloaded successfully!"
echo ""
echo "File sizes:"
ls -lh "${LAUNCHER_DIR}"/tVeb-* | awk '{print $9, ":", $5}'
echo ""
echo "You can now run: pnpm build:viewer-for-bundle"
