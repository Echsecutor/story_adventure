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

## About miniserve

The web server included is [miniserve](https://github.com/svenstaro/miniserve), a production-ready static file server written in Rust. It's:
- Reliable: 7,300+ GitHub stars, actively maintained
- Lightweight: ~7-8 MB per binary
- Fast: Optimized for static file serving with Rust performance
- Secure: Serves files read-only from the bundle directory
- Cross-platform: Works on Windows, Linux, and macOS
- Feature-rich: Proper MIME type handling, SPA support, and more

## Troubleshooting

### "Permission denied" on Linux/macOS

Make the script and binary executable:
```bash
chmod +x run_story_adventure.sh
chmod +x miniserve-linux
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
./miniserve-linux --port 8080 --index index.html ./web
```

**Windows:**
```batch
miniserve-win.exe --port 8080 --index index.html .\web
```

The `--port` specifies the port number, `--index` sets the default file to serve, and the last argument is the directory to serve.

## Bundle Contents

This bundle includes:
- **README.md** - This file (usage documentation)
- **run_story_adventure.sh** - Linux/macOS launcher script
- **run_story_adventure.bat** - Windows batch launcher script
- **run_story_adventure.ps1** - Windows PowerShell launcher script
- **miniserve-linux** - Web server for Linux (~7-8 MB)
- **miniserve-win.exe** - Web server for Windows (~7-8 MB)
- **web/** - Web content directory
  - **viewer/** - Story viewer web application
  - **stories/** - Your story content and media files
  - **index.html** - Entry point that loads the viewer
