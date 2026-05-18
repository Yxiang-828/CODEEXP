@echo off
REM Quick Aid SG -- one-shot install + build.
REM Usage: build.bat
REM Produces a production-ready dist\ folder.
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo !! node.js not found. Install Node 18+ first ^(https://nodejs.org^).
  exit /b 1
)

for /f %%V in ('node -v') do set NODE_VER=%%V
echo ^>^> node: %NODE_VER%

echo ^>^> installing dependencies...
if exist package-lock.json (
  call npm ci --no-audit --no-fund
) else (
  call npm install --no-audit --no-fund
)
if errorlevel 1 exit /b 1

echo ^>^> building production bundle...
call npm run build
if errorlevel 1 exit /b 1

echo.
echo ^>^> [OK] build complete.
echo ^>^> output: dist\
echo ^>^> next:   run.bat           preview locally
echo ^>^>        run.bat share     public cloudflared tunnel
