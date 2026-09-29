import os
import re

root = r"c:\Users\Shubham Singh\Desktop\ImpactLens_CC"

# Secret patterns
secret_patterns = [
    ("Google API Key", re.compile(r"AIza[0-9A-Za-z-_]{35}")),
    ("Generic API Key", re.compile(r"(?:api[_-]?key|apikey|secret|token|password)\s*[:=]\s*['\"][^'\"]{8,}['\"]", re.IGNORECASE)),
    ("Bearer Token", re.compile(r"Bearer\s+['\"][^'\"]+['\"]", re.IGNORECASE)),
    ("Cloudinary URL with secret", re.compile(r"cloudinary://[0-9]+:[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+")),
]

found = []
for dirpath, dirnames, filenames in os.walk(root):
    if any(skip in dirpath for skip in ["node_modules", ".next", "__pycache__", ".git", ".gemini"]):
        continue
    for f in filenames:
        if f.endswith((".py", ".ts", ".tsx", ".js", ".mjs", ".json", ".env")):
            p = os.path.join(dirpath, f)
            try:
                with open(p, "r", encoding="utf-8", errors="ignore") as fp:
                    for line_num, line in enumerate(fp, 1):
                        for name, pat in secret_patterns:
                            matches = pat.findall(line)
                            if matches:
                                # filter out false positives
                                for m in matches:
                                    if "your_" in m.lower() or "example" in m.lower() or "mock" in m.lower() or "postgres:postgres" in m:
                                        continue
                                    rel = os.path.relpath(p, root)
                                    found.append((rel, line_num, name, m))
            except Exception:
                pass

print(f"Total potential secret matches found: {len(found)}")
for rel, line_num, name, match in found:
    print(f"[{name}] {rel}:{line_num} -> {match[:40]}...")
