"""Keep static pages self-contained while maintaining one shared navigation source.

Run after changing templates: python scripts/sync_shell.py
CI/read-only validation: python scripts/sync_shell.py --check
"""
import argparse
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
ASSET_VERSION = "20261106-2"


def sync(check=False):
    templates = {part: (ROOT / "templates" / f"{part}.html").read_text(encoding="utf-8").strip()
                 for part in ("header", "footer")}
    stale = []
    pages = [*ROOT.glob("*.html"), *ROOT.glob("blog/*.html"), *ROOT.glob("blog/posts/*.html")]
    for page in pages:
        relative = page.relative_to(ROOT)
        prefix = "/" if page.name == "404.html" else "../" * (len(relative.parts) - 1)
        original = page.read_text(encoding="utf-8")
        updated = original
        for part, template in templates.items():
            pattern = rf'<{part} class="site-{part}">.*?</{part}>'
            updated, count = re.subn(pattern, lambda _: template.replace("@ROOT@", prefix), updated, flags=re.S)
            if count != 1:
                raise ValueError(f"{relative}: expected exactly one shared {part}, found {count}")
        # Versioned URLs also bypass older installed workers during a deployment.
        updated = re.sub(r'((?:src|href)=")([^":?]+\.(?:css|js))(?:\?v=[^"]*)?"',
                         lambda m: m[1] + m[2] + "?v=" + ASSET_VERSION + '"', updated)
        if updated != original:
            stale.append(str(relative))
            if not check:
                page.write_text(updated, encoding="utf-8")
    worker = ROOT / "sw.js"
    original = worker.read_text(encoding="utf-8")
    updated, count = re.subn(r"const ASSET_VERSION = '[^']+';",
                            "const ASSET_VERSION = '" + ASSET_VERSION + "';", original)
    if count != 1:
        raise ValueError("Service worker must declare its expected asset version")
    if updated != original:
        stale.append("sw.js")
        if not check:
            worker.write_text(updated, encoding="utf-8")
    if check and stale:
        raise SystemExit("Shared shell needs updating: " + ", ".join(stale))
    print(f"PASS: shared shell {'verified' if check else 'synchronised'} across {len(pages)} pages.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    sync(parser.parse_args().check)
