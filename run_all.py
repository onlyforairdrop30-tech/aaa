import os
import sys
import time
import subprocess
import threading
import webbrowser
import urllib.request

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")

# Determine Python Executable
venv_python = os.path.join(BACKEND_DIR, "venv", "Scripts", "python.exe")
if os.path.exists(venv_python):
    PYTHON_EXE = venv_python
else:
    PYTHON_EXE = sys.executable

def stream_logs(pipe, prefix):
    try:
        for line in iter(pipe.readline, ''):
            if line:
                print(f"{prefix} {line.strip()}", flush=True)
    except Exception:
        pass

def wait_for_url(url, max_attempts=30):
    for _ in range(max_attempts):
        try:
            with urllib.request.urlopen(url, timeout=1.5) as res:
                if res.status in (200, 304, 404):
                    return True
        except Exception:
            time.sleep(0.5)
    return False

def main():
    print("=======================================================", flush=True)
    print("       Starting College Search Engine (One-Click)      ", flush=True)
    print("=======================================================", flush=True)
    print(f"[+] Root Directory: {ROOT_DIR}", flush=True)
    print(f"[+] Using Python:   {PYTHON_EXE}", flush=True)

    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"

    # 1. Start Backend Server
    print("\n[1/3] Starting FastAPI Backend on http://127.0.0.1:8000...", flush=True)
    backend_proc = subprocess.Popen(
        [PYTHON_EXE, "main.py"],
        cwd=BACKEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        env=env
    )
    t_backend = threading.Thread(target=stream_logs, args=(backend_proc.stdout, "[Backend]"), daemon=True)
    t_backend.start()

    # 2. Start Frontend App
    print("[2/3] Starting React Frontend on http://localhost:5173...", flush=True)
    frontend_cmd = ["npm.cmd", "run", "dev"] if os.name == "nt" else ["npm", "run", "dev"]
    frontend_proc = subprocess.Popen(
        frontend_cmd,
        cwd=FRONTEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        env=env
    )
    t_frontend = threading.Thread(target=stream_logs, args=(frontend_proc.stdout, "[Frontend]"), daemon=True)
    t_frontend.start()

    # 3. Wait for both servers to be ready
    print("\n[3/3] Checking connectivity...", flush=True)
    backend_ok = wait_for_url("http://127.0.0.1:8000/")
    frontend_ok = wait_for_url("http://localhost:5173/")

    if backend_ok and frontend_ok:
        print("\n" + "="*55, flush=True)
        print("  ALL SERVICES ARE RUNNING SUCCESSFULLY!", flush=True)
        print("  - Frontend:   http://localhost:5173", flush=True)
        print("  - Backend API: http://127.0.0.1:8000/docs", flush=True)
        print("  - Admin Login: http://localhost:5173/admin/login", flush=True)
        print("="*55, flush=True)
        print("\nOpening your browser at http://localhost:5173 ...\n", flush=True)
        webbrowser.open("http://localhost:5173")
    else:
        print("\n[!] Warning: One or more services took longer to respond.", flush=True)
        if not backend_ok:
            print("[!] Backend is still starting up or encountered an issue.", flush=True)
        if not frontend_ok:
            print("[!] Frontend is still starting up or encountered an issue.", flush=True)
        print("Opening http://localhost:5173 ...", flush=True)
        webbrowser.open("http://localhost:5173")

    print("\n[Press Ctrl+C to stop both servers]\n", flush=True)
    try:
        while True:
            time.sleep(1)
            if backend_proc.poll() is not None:
                print(f"[!] Backend process exited with code {backend_proc.returncode}", flush=True)
                break
            if frontend_proc.poll() is not None:
                print(f"[!] Frontend process exited with code {frontend_proc.returncode}", flush=True)
                break
    except KeyboardInterrupt:
        print("\nStopping services...", flush=True)
    finally:
        try:
            backend_proc.terminate()
        except Exception:
            pass
        try:
            frontend_proc.terminate()
        except Exception:
            pass
        print("[+] All services stopped cleanly.", flush=True)

if __name__ == "__main__":
    main()
