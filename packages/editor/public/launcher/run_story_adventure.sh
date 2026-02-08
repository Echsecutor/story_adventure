#!/bin/bash
# Story Adventure Launcher Script for Linux
# This script starts a local webserver and opens the story in your default browser

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Path to the webserver binary
WEBSERVER="$SCRIPT_DIR/tVeb-linux-x86_64"

# Check if the webserver binary exists
if [ ! -f "$WEBSERVER" ]; then
    echo "Error: Webserver binary not found at $WEBSERVER"
    exit 1
fi

# Make sure the binary is executable
chmod +x "$WEBSERVER"

# Default port
PORT=8080

# Check if a custom port was provided as an argument
if [ -n "$1" ]; then
    PORT="$1"
fi

# Start the webserver in the background
echo "Starting Story Adventure webserver on port $PORT..."
echo "Press Ctrl+C to stop the server"
echo ""
echo "Opening http://localhost:$PORT in your browser..."
echo ""

# Try to open the browser (different commands for different systems)
if command -v xdg-open > /dev/null; then
    xdg-open "http://localhost:$PORT" 2>/dev/null &
elif command -v gnome-open > /dev/null; then
    gnome-open "http://localhost:$PORT" 2>/dev/null &
elif command -v open > /dev/null; then
    open "http://localhost:$PORT" 2>/dev/null &
else
    echo "Could not automatically open browser. Please open http://localhost:$PORT manually."
fi

# Start the webserver (this will block until Ctrl+C)
cd "$SCRIPT_DIR/.."
exec "$WEBSERVER" . "$PORT"
