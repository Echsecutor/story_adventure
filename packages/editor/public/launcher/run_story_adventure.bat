@echo off
REM Story Adventure Launcher Script for Windows (Batch)
REM This script starts a local webserver and opens the story in your default browser

setlocal

REM Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

REM Path to the webserver binary (in same directory as script)
set "WEBSERVER=%SCRIPT_DIR%\tVeb-windows-x86_64.exe"

REM Check if the webserver binary exists
if not exist "%WEBSERVER%" (
    echo Error: Webserver binary not found at %WEBSERVER%
    pause
    exit /b 1
)

REM Default port
set PORT=8080

REM Check if a custom port was provided as an argument
if not "%1"=="" set PORT=%1

REM Start the webserver
echo Starting Story Adventure webserver on port %PORT%...
echo Press Ctrl+C to stop the server
echo.
echo Opening http://localhost:%PORT% in your browser...
echo.

REM Open the browser
start http://localhost:%PORT%

REM Start the webserver from the bundle root directory (this will block until Ctrl+C)
cd "%SCRIPT_DIR%"
"%WEBSERVER%" . %PORT%
