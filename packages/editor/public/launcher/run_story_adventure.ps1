#!/usr/bin/env pwsh
# Story Adventure Launcher Script for Windows (PowerShell)
# This script starts a local webserver and opens the story in your default browser

# Get the directory where this script is located
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Path to the webserver binary (in same directory as script)
$Webserver = Join-Path $ScriptDir "tVeb-windows-x86_64.exe"

# Check if the webserver binary exists
if (-not (Test-Path $Webserver)) {
    Write-Host "Error: Webserver binary not found at $Webserver" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Default port
$Port = 8080

# Check if a custom port was provided as an argument
if ($args.Count -gt 0) {
    $Port = $args[0]
}

# Start the webserver
Write-Host "Starting Story Adventure webserver on port $Port..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server"
Write-Host ""
Write-Host "Opening http://localhost:$Port in your browser..." -ForegroundColor Cyan
Write-Host ""

# Open the browser
Start-Process "http://localhost:$Port"

# Start the webserver from the bundle root directory (this will block until Ctrl+C)
Set-Location $ScriptDir
& $Webserver "." $Port
