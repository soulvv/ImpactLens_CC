#!/usr/bin/env python3
"""
ImpactLens AI — Automated Environment Configuration & Security Validator
Verifies:
- Required files exist (.env, .env.example, .env.local)
- Required backend & frontend environment variables are present and well-formed
- Server secrets are NOT exposed in frontend environment or client source code
- Safe status reporting without leaking secret values
"""

import os
import re
import sys
import shutil
from pathlib import Path
from urllib.parse import urlparse

# Ensure Windows terminal outputs UTF-8 cleanly
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# ANSI colors
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BLUE = "\033[94m"
BOLD = "\033[1m"
RESET = "\033[0m"

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"

SERVER_SECRET_KEYS = [
    "CLOUDINARY_API_SECRET",
    "GEMINI_API_KEY",
    "GOOGLE_API_KEY",
    "OMNIDIM_API_KEY",
    "DATABASE_URL",
    "JWT_SECRET",
    "SUPABASE_SERVICE_ROLE_KEY",
]


def load_env_file(filepath: Path) -> dict:
    """Parses a simple key=value .env file without external dependencies."""
    env_vars = {}
    if not filepath.exists():
        return env_vars
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, val = line.split("=", 1)
                key = key.strip()
                val = val.strip().strip("'\"")
                env_vars[key] = val
    return env_vars


def run_checks() -> int:
    print(f"\n{BOLD}{BLUE}=================================================={RESET}")
    print(f"{BOLD}{BLUE} ImpactLens AI — Environment Configuration Audit {RESET}")
    print(f"{BOLD}{BLUE}=================================================={RESET}\n")

    has_errors = False
    has_warnings = False

    # 1. FILE EXISTENCE CHECKS
    print(f"{BOLD}1. Checking Configuration Files:{RESET}")
    files_to_check = [
        (ROOT_DIR / ".env.example", True, "Root .env.example"),
        (ROOT_DIR / ".gitignore", True, "Root .gitignore"),
        (BACKEND_DIR / ".env.example", True, "Backend .env.example"),
        (BACKEND_DIR / ".env", True, "Backend .env"),
        (BACKEND_DIR / ".gitignore", True, "Backend .gitignore"),
        (FRONTEND_DIR / ".env.example", True, "Frontend .env.example"),
        (FRONTEND_DIR / ".env.local.example", True, "Frontend .env.local.example"),
        (FRONTEND_DIR / ".env.local", True, "Frontend .env.local"),
        (FRONTEND_DIR / ".gitignore", True, "Frontend .gitignore"),
    ]

    for path, required, label in files_to_check:
        if path.exists():
            print(f"  {GREEN}✓{RESET} {label} exists ({path.name})")
        else:
            if required:
                print(f"  {RED}✗{RESET} {label} is missing! ({path})")
                has_errors = True
            else:
                print(f"  {YELLOW}!{RESET} {label} is missing (optional)")
                has_warnings = True

    # 2. BACKEND ENV VALIDATION
    print(f"\n{BOLD}2. Validating Backend Environment (backend/.env):{RESET}")
    backend_env = load_env_file(BACKEND_DIR / ".env")

    # DATABASE_URL (Required)
    db_url = backend_env.get("DATABASE_URL", "").strip()
    if not db_url:
        print(f"  {RED}✗{RESET} DATABASE_URL is missing or empty! Backend requires PostgreSQL.")
        has_errors = True
    elif not (db_url.startswith("postgresql://") or db_url.startswith("postgres://")):
        print(f"  {YELLOW}!{RESET} DATABASE_URL does not use standard postgresql:// prefix: {db_url.split('@')[-1] if '@' in db_url else 'custom'}")
    else:
        # Mask password and show target
        try:
            parsed = urlparse(db_url)
            safe_db_desc = f"{parsed.scheme}://{parsed.username}:***@{parsed.hostname}:{parsed.port}{parsed.path}"
            print(f"  {GREEN}✓{RESET} DATABASE_URL configured: {safe_db_desc}")
        except Exception:
            print(f"  {GREEN}✓{RESET} DATABASE_URL configured (valid PostgreSQL format)")

    # CORS_ORIGINS
    cors = backend_env.get("CORS_ORIGINS", "").strip()
    if cors:
        origins = [o.strip() for o in cors.split(",") if o.strip()]
        print(f"  {GREEN}✓{RESET} CORS_ORIGINS configured ({len(origins)} origins: {', '.join(origins)})")
    else:
        print(f"  {YELLOW}!{RESET} CORS_ORIGINS not configured (will default to http://localhost:3000)")
        has_warnings = True

    # Cloudinary (Optional with local fallback)
    c_cloud = backend_env.get("CLOUDINARY_CLOUD_NAME", "").strip()
    c_key = backend_env.get("CLOUDINARY_API_KEY", "").strip()
    c_secret = backend_env.get("CLOUDINARY_API_SECRET", "").strip()
    if c_cloud and c_key and c_secret:
        print(f"  {GREEN}✓{RESET} Cloudinary configured for live cloud media storage (cloud: {c_cloud})")
    elif not c_cloud and not c_key and not c_secret:
        print(f"  {YELLOW}ℹ{RESET} Cloudinary not configured (Application will use local storage fallback)")
    else:
        print(f"  {YELLOW}!{RESET} Cloudinary partially configured! Ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are all set.")
        has_warnings = True

    # Gemini AI (Optional with ecological fallback)
    gemini_key = (backend_env.get("GEMINI_API_KEY") or backend_env.get("GOOGLE_API_KEY", "")).strip()
    gemini_model = backend_env.get("GEMINI_MODEL", "gemini-1.5-flash").strip()
    if gemini_key:
        print(f"  {GREEN}✓{RESET} Gemini AI configured (model: {gemini_model}, key: configured)")
    else:
        print(f"  {YELLOW}ℹ{RESET} Gemini AI key omitted (Application will use deterministic ecological fallback engine)")

    # OmniDimension Voice (Optional with embedded fallback)
    omni_key = backend_env.get("OMNIDIM_API_KEY", "").strip()
    omni_agent = backend_env.get("OMNIDIM_AGENT_ID", "").strip()
    if omni_key and omni_agent:
        print(f"  {GREEN}✓{RESET} OmniDimension configured (agent_id: {omni_agent}, API key: configured)")
    elif not omni_key and not omni_agent:
        print(f"  {YELLOW}ℹ{RESET} OmniDimension key omitted (Application will use embedded voice engine)")
    else:
        print(f"  {YELLOW}!{RESET} OmniDimension partially configured! Set both OMNIDIM_API_KEY and OMNIDIM_AGENT_ID.")
        has_warnings = True

    # FFmpeg Video Processing
    ffmpeg_cmd = backend_env.get("FFMPEG_PATH", "ffmpeg").strip()
    if shutil.which(ffmpeg_cmd):
        print(f"  {GREEN}✓{RESET} FFmpeg video pipeline available ({ffmpeg_cmd})")
    else:
        print(f"  {YELLOW}ℹ{RESET} FFmpeg executable not found on PATH or FFMPEG_PATH. (Video upload works; representative frames will use fallback sampling)")

    # 3. FRONTEND ENV VALIDATION
    print(f"\n{BOLD}3. Validating Frontend Environment (frontend/.env.local):{RESET}")
    frontend_env = load_env_file(FRONTEND_DIR / ".env.local")

    api_url = frontend_env.get("NEXT_PUBLIC_API_URL", "").strip()
    if not api_url:
        print(f"  {RED}✗{RESET} NEXT_PUBLIC_API_URL is missing or empty in frontend/.env.local!")
        has_errors = True
    elif not (api_url.startswith("http://") or api_url.startswith("https://")):
        print(f"  {RED}✗{RESET} NEXT_PUBLIC_API_URL must be a valid HTTP/HTTPS URL (got: {api_url})")
        has_errors = True
    else:
        print(f"  {GREEN}✓{RESET} NEXT_PUBLIC_API_URL configured: {api_url}")

    # Check for secret leakage into frontend/.env.local
    frontend_secrets = []
    for secret in SERVER_SECRET_KEYS:
        if secret in frontend_env and frontend_env[secret]:
            frontend_secrets.append(secret)
        if f"NEXT_PUBLIC_{secret}" in frontend_env:
            frontend_secrets.append(f"NEXT_PUBLIC_{secret}")

    if frontend_secrets:
        print(f"  {RED}✗ CRITICAL SECURITY VIOLATION:{RESET} Server secrets found in frontend/.env.local:")
        for s in frontend_secrets:
            print(f"      - {s}")
        has_errors = True
    else:
        print(f"  {GREEN}✓{RESET} Zero server secrets detected in frontend/.env.local")

    # 4. FRONTEND SOURCE CODE LEAK DETECTION
    print(f"\n{BOLD}4. Scanning Frontend Source Code for Secret References:{RESET}")
    frontend_leak_patterns = [
        r"process\.env\.OMNIDIM_API_KEY",
        r"process\.env\.GEMINI_API_KEY",
        r"process\.env\.GOOGLE_API_KEY",
        r"process\.env\.CLOUDINARY_API_SECRET",
        r"process\.env\.DATABASE_URL",
        r"process\.env\.SUPABASE_SERVICE_ROLE_KEY",
    ]

    source_leaks = []
    for root, dirs, files in os.walk(FRONTEND_DIR):
        # Skip node_modules and .next
        dirs[:] = [d for d in dirs if d not in ["node_modules", ".next", ".git"]]
        for file in files:
            if file.endswith((".ts", ".tsx", ".js", ".jsx", ".mjs")):
                fpath = Path(root) / file
                try:
                    content = fpath.read_text(encoding="utf-8", errors="ignore")
                    for pat in frontend_leak_patterns:
                        if re.search(pat, content):
                            source_leaks.append((fpath.relative_to(ROOT_DIR), pat))
                except Exception:
                    pass

    if source_leaks:
        print(f"  {RED}✗ CRITICAL SECURITY VIOLATION:{RESET} Frontend source files directly access server secrets:")
        for f, pat in source_leaks:
            print(f"      - {f}: references {pat}")
        has_errors = True
    else:
        print(f"  {GREEN}✓{RESET} Zero server secrets referenced in frontend TypeScript/JavaScript source code")

    # 5. SUMMARY
    print(f"\n{BOLD}=================================================={RESET}")
    if has_errors:
        print(f"{BOLD}{RED}FAILED:{RESET} Environment configuration audit discovered critical issues.")
        print(f"Please address the errors marked with {RED}✗{RESET} above.")
        return 1
    elif has_warnings:
        print(f"{BOLD}{GREEN}PASSED WITH NOTICES:{RESET} Environment configuration is valid and secure.")
        print(f"Core requirements are satisfied. Fallbacks are active for unconfigured optional services.")
        return 0
    else:
        print(f"{BOLD}{GREEN}PASSED:{RESET} Environment configuration is complete, consistent, and secure!")
        return 0


if __name__ == "__main__":
    sys.exit(run_checks())
