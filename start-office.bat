@echo off
title Claude Agent Office
echo Starting Claude Agent Office...

:: Kill any existing server on port 3001
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do taskkill /PID %%a /F >nul 2>&1

:: Start server in background
start /B node C:\home\user\claude-office\server.js

:: Wait a moment for server to start
timeout /t 2 /nobreak >nul

:: Open browser
start http://localhost:3001

echo.
echo Claude Agent Office is running at http://localhost:3001
echo Press Ctrl+C to stop the server.
echo.

:: Keep window open so server stays alive
node C:\home\user\claude-office\server.js 2>nul || pause
