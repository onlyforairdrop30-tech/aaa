@echo off
title College Search Engine - Launching
color 0B

echo =======================================================
echo          Starting College Search Engine
echo =======================================================
echo.

cd /d "%~dp0"

if exist backend\venv\Scripts\python.exe (
    backend\venv\Scripts\python.exe run_all.py
) else (
    python run_all.py
)

if %errorlevel% neq 0 (
    echo.
    echo [!] Process exited. Press any key to close.
    pause
)

