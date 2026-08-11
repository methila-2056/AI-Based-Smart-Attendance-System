#!/usr/bin/env python3
"""Smart Academic Companion launcher.

Starts the Spring Boot backend and Vite frontend, waits for both to be ready,
opens the browser, and cleans up both servers on exit (Ctrl+C).
Requires: Python 3.9+, Java 17+, Maven, Node.js/npm, PostgreSQL (recommended).

Usage:
    python run.py            # start both servers
    python run.py --no-kill  # do not kill processes already on 8080/5173
    python run.py --no-open  # do not open the browser
"""

import argparse
import os
import signal
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT, "backend")
FRONTEND_DIR = os.path.join(ROOT, "frontend")
BACKEND_LOG = os.path.join(ROOT, "backend.log")
FRONTEND_LOG = os.path.join(ROOT, "frontend.log")

BACKEND_PORT = 8080
FRONTEND_PORT = 5173
DB_HOST = "localhost"
DB_PORT = 5432
READY_TIMEOUT = 150  # seconds

BACKEND_URL = f"http://localhost:{BACKEND_PORT}"
FRONTEND_URL = f"http://localhost:{FRONTEND_PORT}"

IS_WINDOWS = os.name == "nt"


def log(msg):
    print(f"[run] {msg}", flush=True)


def cmd(name):
    """Return the executable for a tool, preferring the Windows .cmd shim."""
    if IS_WINDOWS:
        cand = shutil_which(name + ".cmd") or shutil_which(name + ".exe")
        if cand:
            return cand
    return shutil_which(name)


def shutil_which(name):
    import shutil

    return shutil.which(name)


def preflight():
    missing = []
    for tool, hint in [
        ("java", "Install a JDK (17+) and put java on PATH."),
        ("mvn", "Install Apache Maven and put mvn on PATH."),
        ("npm", "Install Node.js (npm is bundled)."),
    ]:
        exe = cmd(tool)
        if not exe:
            missing.append(f"{tool} -> {hint}")
        else:
            log(f"{tool}: {exe}")
    if missing:
        log("Missing prerequisites:")
        for m in missing:
            log("  - " + m)
        sys.exit(1)


def db_reachable():
    try:
        with socket.create_connection((DB_HOST, DB_PORT), timeout=2):
            return True
    except OSError:
        return False


def port_pid(port):
    """Return the PID (or None) of the process listening on a TCP port."""
    if IS_WINDOWS:
        try:
            out = subprocess.run(
                ["netstat", "-ano"], capture_output=True, text=True, timeout=10
            ).stdout
        except Exception:
            return None
        for line in out.splitlines():
            parts = line.split()
            if len(parts) >= 5 and parts[0] in ("TCP", "TCP6"):
                if parts[1].endswith(f":{port}") and parts[3] in ("LISTENING", "LISTEN"):
                    try:
                        return int(parts[4])
                    except ValueError:
                        pass
        return None
    # POSIX fallback
    try:
        out = subprocess.run(
            ["lsof", "-t", "-i", f"TCP:{port}"], capture_output=True, text=True, timeout=10
        ).stdout
        pids = [p for p in out.split() if p]
        return int(pids[0]) if pids else None
    except Exception:
        return None


def kill_pid(pid):
    if IS_WINDOWS:
        subprocess.run(["taskkill", "/F", "/T", "/PID", str(pid)], capture_output=True)
    else:
        os.kill(pid, signal.SIGTERM)


def free_ports(no_kill):
    for port in (BACKEND_PORT, FRONTEND_PORT):
        pid = port_pid(port)
        if pid is None:
            continue
        if no_kill:
            log(f"port {port} is in use by pid {pid}; skipping (--no-kill)")
            continue
        log(f"killing pid {pid} on port {port}")
        kill_pid(pid)
        for _ in range(20):
            if port_pid(port) is None:
                break
            time.sleep(0.25)


def wait_http(url, timeout):
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=2) as resp:
                return True
        except urllib.error.HTTPError:
            # Any HTTP response means the server is up (4xx/5xx included).
            return True
        except Exception:
            time.sleep(1)
    return False


def wait_port(port, timeout):
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with socket.create_connection(("localhost", port), timeout=2):
                return True
        except OSError:
            time.sleep(1)
    return False


def start_process(cmdline, cwd, logfile, name):
    logfile_handle = open(logfile, "w", encoding="utf-8")
    kwargs = {}
    if IS_WINDOWS:
        kwargs["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP
    proc = subprocess.Popen(
        cmdline, cwd=cwd, stdout=logfile_handle, stderr=subprocess.STDOUT, **kwargs
    )
    log(f"{name} started (pid {proc.pid}, log -> {logfile})")
    return proc


def kill_tree(proc, name):
    if proc.poll() is not None:
        log(f"{name} already exited (code {proc.returncode})")
        return
    if IS_WINDOWS:
        subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)], capture_output=True)
    else:
        try:
            os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
        except Exception:
            proc.terminate()
    log(f"{name} stopped")


def print_credentials():
    print()
    log("Demo accounts:")
    print("  ADMIN      admin / Admin@123")
    print("  COORDINATOR rajasekar / Raj@123   (Analytics + verify pending)")
    print("  TEACHER     pavithra / Pav@123    (QR attendance demo)")
    print("  TEACHER     arun / Arun@123")
    print("  STUDENT     mohan23 / Student@123")
    print()


def main():
    parser = argparse.ArgumentParser(description="Smart Academic Companion launcher")
    parser.add_argument("--no-kill", action="store_true", help="don't kill processes on ports 8080/5173")
    parser.add_argument("--no-open", action="store_true", help="don't open the browser")
    args = parser.parse_args()

    log("Smart Academic Companion")
    log(f"project root: {ROOT}")

    preflight()

    if not db_reachable():
        log("WARNING: PostgreSQL not reachable at localhost:5432 — backend will fail to start.")
        log("         Start the DB first (e.g. docker compose up -d) and re-run.")
    else:
        log("PostgreSQL reachable at localhost:5432")

    free_ports(args.no_kill)

    if not os.path.isdir(BACKEND_DIR):
        log(f"backend dir not found: {BACKEND_DIR}")
        sys.exit(1)
    if not os.path.isdir(FRONTEND_DIR):
        log(f"frontend dir not found: {FRONTEND_DIR}")
        sys.exit(1)

    mvn = cmd("mvn") or "mvn"
    npm = cmd("npm") or "npm"

    backend = start_process([mvn, "spring-boot:run"], BACKEND_DIR, BACKEND_LOG, "backend")
    frontend = start_process([npm, "run", "dev"], FRONTEND_DIR, FRONTEND_LOG, "frontend")

    print()
    log("waiting for backend...")
    if wait_http(BACKEND_URL + "/api/auth/login", READY_TIMEOUT):
        log(f"backend ready at {BACKEND_URL}")
    else:
        log("backend did not become ready in time — see backend.log")

    log("waiting for frontend...")
    if wait_port(FRONTEND_PORT, READY_TIMEOUT):
        log(f"frontend ready at {FRONTEND_URL}")
    else:
        log("frontend did not become ready in time — see frontend.log")

    print_credentials()

    if not args.no_open:
        import webbrowser

        webbrowser.open(FRONTEND_URL)

    log("Both servers running. Press Ctrl+C to stop.")
    try:
        while True:
            if backend.poll() is not None:
                log("backend process exited — stopping everything")
                break
            if frontend.poll() is not None:
                log("frontend process exited — stopping everything")
                break
            time.sleep(1)
    except KeyboardInterrupt:
        log("shutting down...")
    finally:
        kill_tree(backend, "backend")
        kill_tree(frontend, "frontend")
        log("done.")


if __name__ == "__main__":
    main()
