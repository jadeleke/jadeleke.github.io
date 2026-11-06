"""Check static links and the shared shell. Run: python scripts/check_site.py."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET
from sync_shell import sync
from build_projects import build as check_projects
import json

ROOT = Path(__file__).resolve().parent.parent


class Document(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.ids, self.refs = [], []
        self.h1, self.description = 0, False
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.append(attrs["id"])
        if tag == "h1":
            self.h1 += 1
        if tag == "meta" and attrs.get("name") == "description":
            self.description = bool(attrs.get("content"))
        for attr in ("src", "href"):
            if attrs.get(attr):
                self.refs.append(attrs[attr])


def check():
    sync(check=True)
    check_projects(check=True)
    pages = [*ROOT.glob("*.html"), *ROOT.glob("blog/*.html"), *ROOT.glob("blog/posts/*.html")]
    docs = {p: Document(p.read_text(encoding="utf-8")) for p in pages}
    errors = []
    snapshot = json.loads((ROOT / "data/repos-cache.json").read_text(encoding="utf-8"))
    public_urls = {repo["html_url"].lower().rstrip("/") for repo in snapshot}
    curated = json.loads((ROOT / "data/featured.json").read_text(encoding="utf-8"))
    for item in curated:
        if item["repo"].lower().rstrip("/") not in public_urls:
            errors.append(f"Curated project is absent from the verified public snapshot: {item['repo']}")
    for page, doc in docs.items():
        name = page.relative_to(ROOT)
        duplicates = [key for key, n in Counter(doc.ids).items() if n > 1]
        if duplicates:
            errors.append(f"{name}: duplicate IDs {duplicates}")
        if page.name not in {"post.html", "admin.html"}:
            if doc.h1 != 1:
                errors.append(f"{name}: expected one H1, found {doc.h1}")
            if not doc.description:
                errors.append(f"{name}: missing description")
        for ref in doc.refs:
            url = urlsplit(ref)
            if url.scheme or url.netloc:
                continue
            if not url.path:
                target = page
            elif url.path.startswith("/"):
                target = ROOT / unquote(url.path).lstrip("/")
            else:
                target = page.parent / unquote(url.path)
            target = target.resolve()
            if target.is_dir():
                target = target / "index.html"
            if not target.exists():
                errors.append(f"{name}: missing target {ref}")
            elif url.fragment and target in docs and unquote(url.fragment) not in docs[target].ids:
                errors.append(f"{name}: missing anchor {ref}")
        for required in ("primary-menu", "theme-toggle", "motion-toggle"):
            if required not in doc.ids:
                errors.append(f"{name}: missing shared control {required}")
    sitemap = ET.parse(ROOT / "sitemap.xml")
    urls = [node.text for node in sitemap.findall("{*}url/{*}loc")]
    if "https://jadeleke.github.io/research.html" not in urls:
        errors.append("Research page is missing from sitemap")
    if errors:
        raise SystemExit("\n".join(errors))
    print(f"PASS: {len(pages)} pages; local links, anchors, unique IDs, metadata, shared controls, and sitemap.")


if __name__ == "__main__":
    check()
