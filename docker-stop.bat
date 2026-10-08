@echo off
title College Search - Stopping Docker Containers
color 0E

echo =======================================================
echo     Stopping College Search Engine Docker Containers
echo =======================================================
echo.

cd /d "%~dp0"
docker compose down

echo.
echo =======================================================
echo   All College Search Docker containers have been stopped.
echo =======================================================
echo.
pause
