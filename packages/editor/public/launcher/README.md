# Story Adventure Launcher

This bundle contains everything needed to run your Story Adventure locally without installing any additional software or web server.

## Quick Start

### Linux / macOS

**Option 1: Double-click (if supported)**
- Simply double-click `run_story_adventure.sh` if your file manager supports executing shell scripts

**Option 2: Terminal**
Open a terminal in this directory and run:

```bash
./run_story_adventure.sh
```

### Windows

**Option 1: Batch Script (Recommended)**
- Double-click `run_story_adventure.bat`

**Option 2: PowerShell Script**
- Right-click `run_story_adventure.ps1`
- Select "Run with PowerShell"

Both scripts will:
1. Start the web server on port 8080
2. Automatically open your default web browser to view the story
3. Display server logs in the console window

## Custom Port

If port 8080 is already in use, you can specify a custom port:

**Linux/macOS:**
```bash
./run_story_adventure.sh 3000
```

**Windows (Batch):**
```batch
run_story_adventure.bat 3000
```

**Windows (PowerShell):**
```powershell
.\run_story_adventure.ps1 3000
```

## Stopping the Server

Press `Ctrl+C` in the terminal/console window where the server is running.

## About tVeb

The web server included is [tVeb (Tiniest Veb Server)](https://github.com/davlgd/tVeb), an open-source, minimal static file server written in V. It's:
- Lightweight: < 1.5 MB per binary
- Fast: Optimized for static file serving
- Secure: Serves files read-only from the bundle directory
- Cross-platform: Works on Windows, Linux, and macOS

## Troubleshooting

### "Permission denied" on Linux/macOS

Make the script and binary executable:
```bash
chmod +x run_story_adventure.sh
chmod +x tVeb-linux-x86_64
```

### "Windows protected your PC" on Windows

This is Windows SmartScreen. Click "More info" then "Run anyway". The binaries are open-source and safe.

### Browser doesn't open automatically

Manually open your browser and navigate to:
```
http://localhost:8080
```

(Replace 8080 with your custom port if you specified one)

### Port already in use

Try a different port number (see "Custom Port" section above).

## Manual Server Usage

You can also run the web server directly:

**Linux/macOS:**
```bash
./tVeb-linux-x86_64 . 8080
```

**Windows:**
```batch
tVeb-windows-x86_64.exe . 8080
```

The first argument (`.`) is the directory to serve, and the second (8080) is the port number.

## Bundle Contents

This bundle includes:
- **README.md** - This file (usage documentation)
- **run_story_adventure.sh** - Linux/macOS launcher script
- **run_story_adventure.bat** - Windows batch launcher script
- **run_story_adventure.ps1** - Windows PowerShell launcher script
- **tVeb-linux-x86_64** - Web server for Linux (~1.2 MB)
- **tVeb-windows-x86_64.exe** - Web server for Windows (~1.4 MB)
- **viewer/** - Story viewer web application
- **stories/** - Your story content and media files
