@echo off
title College Search - Initial Setup
color 0A
setlocal enabledelayedexpansion

echo =======================================================
echo          College Search Engine - Setup
echo =======================================================
echo.

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

echo [1/3] Checking Prerequisites...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Python is not installed or not added to PATH!
    echo Please install Python (3.9+) and check "Add Python to PATH".
    pause
    exit /b
)

node -v >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js is not installed or not added to PATH!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b
)

echo Python and Node.js detected!
echo.

echo [2/3] Setting up Backend Python Environment...
cd /d "%ROOT_DIR%backend"
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate.bat
echo Installing Python dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt
cd /d "%ROOT_DIR%"
echo Backend setup complete!
echo.

echo [3/3] Setting up Frontend Dependencies...
cd /d "%ROOT_DIR%frontend"
echo Running npm install...
call npm install
cd /d "%ROOT_DIR%"
echo Frontend setup complete!
echo.

echo =======================================================
echo       Setup Finished Successfully!
echo       Now you can double-click '2_Start_Project.bat' to run the app.
echo =======================================================
pause
