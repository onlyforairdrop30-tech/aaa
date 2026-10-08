@echo off
title College Search - Docker Launch
color 0B
setlocal enabledelayedexpansion

echo =======================================================
echo     Starting College Search Engine via Docker Compose
echo =======================================================
echo.

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

:: Check if docker CLI is available
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Docker CLI not found in PATH!
    echo Please ensure Docker Desktop is installed.
    pause
    exit /b
)

:: Check if Docker daemon is running
echo Checking Docker engine status...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Docker engine is not running. Attempting to start Docker Desktop...
    
    set "DOCKER_EXE="
    if exist "%LOCALAPPDATA%\Programs\DockerDesktop\Docker Desktop.exe" (
        set "DOCKER_EXE=%LOCALAPPDATA%\Programs\DockerDesktop\Docker Desktop.exe"
    ) else if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
        set "DOCKER_EXE=C:\Program Files\Docker\Docker\Docker Desktop.exe"
    )

    if defined DOCKER_EXE (
        echo Starting Docker Desktop from: !DOCKER_EXE!
        start "" "!DOCKER_EXE!"
        echo Waiting for Docker engine to initialize (this may take 15-30 seconds)...
        
        set /a count=0
        :wait_loop
        timeout /t 3 /nobreak >nul
        set /a count+=1
        docker ps >nul 2>&1
        if %errorlevel% equ 0 (
            echo Docker engine is now UP and RUNNING!
            goto docker_ready
        )
        if !count! lss 25 (
            echo Waiting for Docker... (!count!/25)
            goto wait_loop
        ) else (
            color 0C
            echo [!] Docker Desktop took too long to start. Please wait for Docker Desktop icon to appear in system tray and try again.
            pause
            exit /b
        )
    ) else (
        color 0C
        echo [!] Could not locate Docker Desktop executable automatically.
        echo Please start Docker Desktop manually from the Start Menu, then run this file again.
        pause
        exit /b
    )
)

:docker_ready
echo.
echo [1/2] Building and starting containers (Backend + Frontend)...
docker compose up --build -d

if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Docker compose failed to start containers!
    pause
    exit /b
)

echo.
echo [2/2] Checking running containers:
docker compose ps

echo.
echo =======================================================
echo   College Search Engine is RUNNING in Docker!
echo.
echo   - Frontend App:   http://localhost:5173 (or http://localhost)
echo   - Backend API:    http://localhost:8000/docs
echo   - Admin Panel:    http://localhost:5173/admin/login
echo.
echo   To stop containers anytime, double-click 'docker-stop.bat'
echo =======================================================
echo.
echo Opening browser...
timeout /t 3 /nobreak >nul
start http://localhost:5173
echo.
pause
