import os
import re

root = r"c:\Users\Shubham Singh\Desktop\ImpactLens_CC"
patterns = [
    re.compile(r"process\.env\.[A-Za-z0-9_]+"),
    re.compile(r"os\.environ(?:\.get)?\([\'\"][A-Za-z0-9_]+[\'\"]"),
    re.compile(r"os\.getenv\([\'\"][A-Za-z0-9_]+[\'\"]"),
    re.compile(r"settings\.[A-Za-z0-9_]+"),
]

results = []
for dirpath, dirnames, filenames in os.walk(root):
    if any(skip in dirpath for skip in ["node_modules", ".next", "__pycache__", ".git", ".gemini"]):
        continue
    for f in filenames:
        if f.endswith((".py", ".ts", ".tsx", ".js", ".mjs", ".json", ".html", ".md", ".env", ".example")):
            p = os.path.join(dirpath, f)
            try:
                with open(p, "r", encoding="utf-8", errors="ignore") as fp:
                    content = fp.read()
                    file_matches = set()
                    for pat in patterns:
                        for m in pat.findall(content):
                            file_matches.add(m)
                    if file_matches:
                        results.append((p, file_matches))
            except Exception as e:
                pass

for p, m in results:
    rel = os.path.relpath(p, root)
    print(f"{rel}: {sorted(list(m))}")
