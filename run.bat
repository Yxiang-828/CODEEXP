@echo off
REM Kampung Kaki -- build + serve.
REM Usage:
REM   run.bat            build + preview on 5173 (production)
REM   run.bat dev        dev server on 3000 (hot reload)
REM   run.bat share      build + preview + public tunnel
setlocal enabledelayedexpansion

cd /d "%~dp0"

set "MODE=%~1"
if "%MODE%"=="" set "MODE=preview"

echo ^>^> killing anything on 3000/5173/4173...
for %%P in (3000 5173 4173) do (
  for /f "tokens=5" %%A in ('netstat -ano ^| findstr ":%%P " ^| findstr LISTENING') do (
    taskkill /F /PID %%A >nul 2>&1
  )
)
timeout /t 1 /nobreak >nul

if not exist node_modules (
  echo ^>^> installing dependencies...
  call npm install --no-audit --no-fund
  if errorlevel 1 exit /b 1
)

if /i "%MODE%"=="dev" (
  echo ^>^> starting dev server on http://0.0.0.0:3000
  call npm run dev -- --host 0.0.0.0
  goto :eof
)

if /i "%MODE%"=="share" (
  echo ^>^> building...
  call npm run build
  if errorlevel 1 exit /b 1
  echo ^>^> starting preview on http://0.0.0.0:5173
  start "Kampung Kaki Preview" cmd /c "npx vite preview --host 0.0.0.0 --port 5173"
  timeout /t 3 /nobreak >nul
  echo.
  echo ^>^> opening public tunnel (cloudflared)...
  echo ^>^> share the trycloudflare URL printed below.
  echo.
  call npx --yes cloudflared tunnel --url http://localhost:5173
  goto :eof
)

echo ^>^> building...
call npm run build
if errorlevel 1 exit /b 1
echo.
echo ^>^> starting preview server on http://0.0.0.0:5173
echo ^>^> LAN users: open the Network URL printed below.
echo.
call npx vite preview --host 0.0.0.0 --port 5173
