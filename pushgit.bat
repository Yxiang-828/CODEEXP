@echo off
REM Commit everything as Weed_Lord (no co-author junk) and push.
REM Usage:  pushgit.bat "your commit message"
REM         pushgit.bat            (prompts for a message)
cd /d "%~dp0"

set "msg=%~1"
if "%msg%"=="" set /p "msg=Commit message: "
if "%msg%"=="" set "msg=update"

git add -A
git -c user.name="Weed_Lord" -c user.email="holo5239@gmail.com" commit -m "%msg%"
git push origin Main-Submission
pause
