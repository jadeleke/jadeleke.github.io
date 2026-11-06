"""Keep the no-JavaScript featured project list in sync with curated metadata.

Run: python scripts/build_featured.py
Only the featured page's project list and count are updated; the shared shell is
managed separately by sync_shell.py.
"""
import argparse
from html import escape
import json
from pathlib import Path
import re
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent.parent


def external_url(value):
    return isinstance(value, str) and urlsplit(value).scheme in {"https", "http"} and bool(urlsplit(value).netloc)


def build(check=False):
    items = json.loads((ROOT / "data" / "featured.json").read_text(encoding="utf-8"))
    assert items and len({item["repo"] for item in items}) == len(items)
    cards = []
    for index, item in enumerate(items, 1):
        assert external_url(item["repo"]) and external_url(item["source"])
        title, repo = escape(item["title"]), escape(item["repo"], quote=True)
        tags = "".join(f'<span class="tag-pill">{escape(tag)}</span>' for tag in item["tags"])
        actions = []
        if item.get("brief"):
            brief = item["brief"]
            assert not urlsplit(brief).scheme and (ROOT / brief).is_file()
            actions.append(f'<a class="btn primary" href="{escape(brief, quote=True)}">Project brief <span aria-hidden="true">&nearr;</span></a>')
        actions.append(f'<a class="btn" href="{repo}" target="_blank" rel="noopener noreferrer">Source code <span aria-hidden="true">&nearr;</span></a>')
        source = escape(item["source"], quote=True)
        cards.append(f'''        <article class="card repo-card" data-reveal>
          <span class="eyebrow">Selected work / {index:02d} / {escape(item['category'])}</span>
          <h3 class="repo-title"><a href="{repo}" target="_blank" rel="noopener noreferrer">{title}</a></h3>
          <p class="muted repo-desc">{escape(item['description'])}</p>
          <div class="tag-strip">{tags}</div>
          <div class="repo-actions">{''.join(actions)}</div>
          <a class="text-link" href="{source}" target="_blank" rel="noopener noreferrer">Read project documentation <span aria-hidden="true">&nearr;</span></a>
        </article>''')
    path = ROOT / "featured.html"
    text = path.read_text(encoding="utf-8")
    start = text.index('      <div id="featured-list"')
    end = text.index("\n    </div>\n  </main>", start)
    text = text[:start] + '      <div id="featured-list" class="card-grid three">\n' + "\n".join(cards) + '\n      </div>' + text[end:]
    count = f'<p class="skill-note" data-featured-summary>{len(items)} selected projects across cloud infrastructure, applied AI, and useful software.</p>'
    if 'data-featured-summary' in text:
        text = re.sub(r'<p class="skill-note" data-featured-summary>.*?</p>', count, text)
    else:
        marker = '      </header>\n\n      <div id="featured-list"'
        assert marker in text
        text = text.replace(marker, '        ' + count + '\n' + marker, 1)
    if check and text != path.read_text(encoding="utf-8"):
        raise SystemExit("featured.html is out of sync; run python scripts/build_projects.py")
    if not check:
        path.write_text(text, encoding="utf-8")
    print(f"PASS: featured.html {len(items)} source-linked projects {'verified' if check else 'updated'}.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    build(parser.parse_args().check)
