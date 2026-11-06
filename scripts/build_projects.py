"""Build the static project selections from verified curated metadata.

Run after editing data/featured.json: python scripts/build_projects.py
"""
import argparse
from html import escape
import json
from pathlib import Path
import re
from build_featured import build as build_featured

ROOT = Path(__file__).resolve().parent.parent


def build(check=False):
    build_featured(check)
    all_items = json.loads((ROOT / "data" / "featured.json").read_text(encoding="utf-8"))
    items = all_items[:9]
    # Keep the final network-independent fallback derived from the same source.
    main = ROOT / "js" / "main.js"
    original_main = main.read_text(encoding="utf-8")
    updated_main, count = re.subn(r'  const curatedSelections = \[.*?\n\];',
                                 lambda _: "  const curatedSelections = " + json.dumps(all_items, indent=2, ensure_ascii=False) + ";",
                                 original_main, count=1, flags=re.S)
    if count != 1:
        raise ValueError("Could not locate the generated curated fallback")
    if check and updated_main != original_main:
        raise SystemExit("Curated JS fallback is out of sync; run python scripts/build_projects.py")
    if not check:
        main.write_text(updated_main, encoding="utf-8")
    cards = []
    for index, item in enumerate(items, 1):
        actions = []
        if item.get("brief"):
            actions.append(f'<a class="btn primary" href="{escape(item["brief"], quote=True)}">Project brief <span aria-hidden="true">&rarr;</span></a>')
        actions.append(f'<a class="text-link" href="{escape(item["repo"], quote=True)}" target="_blank" rel="noopener noreferrer">Source code <span aria-hidden="true">&nearr;</span></a>')
        cards.append(f'''          <article class="card repo-card" data-reveal>
            <div class="project-card-top"><span class="page-index">{index:02d} / {escape(item['category'])}</span></div>
            <h3 class="repo-title"><a href="{escape(item['repo'], quote=True)}" target="_blank" rel="noopener noreferrer">{escape(item['title'])}</a></h3>
            <p class="repo-desc">{escape(item['description'])}</p>
            <div class="tag-strip">{''.join(f'<span class="tag-pill">{escape(tag)}</span>' for tag in item['tags'])}</div>
            <div class="repo-actions">{''.join(actions)}</div>
          </article>''')
    path = ROOT / "projects.html"
    original = path.read_text(encoding="utf-8")
    start = original.index('      <section class="research-hub"')
    end = original.index('\n      <section class="testing-section', start)
    section = '''      <section class="research-hub" aria-labelledby="applied-heading">
        <header class="section-heading" data-reveal>
          <span class="eyebrow">01 / Selected work</span>
          <h2 id="applied-heading" class="project-section-title">Systems, tools, and applied learning.</h2>
          <p class="section-lead">Source-linked projects across cloud infrastructure, AI tooling, education, and applied machine learning.</p>
        </header>
        <div class="card-grid selected-project-grid">
''' + "\n".join(cards) + '''
        </div>
        <a class="text-link" href="featured.html">Explore all curated projects <span aria-hidden="true">&rarr;</span></a>
      </section>'''
    updated = original[:start] + section + original[end:]
    if check and updated != original:
        raise SystemExit("projects.html is out of sync; run python scripts/build_projects.py")
    if not check:
        path.write_text(updated, encoding="utf-8")
    print(f"PASS: projects.html {len(items)} static selections {'verified' if check else 'updated'}.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    build(parser.parse_args().check)
