"""Refresh the public GitHub repository snapshot used when the API is unavailable.

Run: python scripts/refresh_repos.py
No credentials or third-party packages are required. Private repositories are rejected.
"""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
SOURCE = "https://api.github.com/users/jadeleke/repos?per_page=100&sort=updated"
FIELDS = ("id", "name", "description", "html_url", "language", "homepage", "topics",
          "stargazers_count", "forks_count", "fork", "archived", "updated_at", "size")


def refresh(from_json=None, checked_at=None):
    if from_json:
        rows = json.loads(Path(from_json).read_text(encoding="utf-8-sig"))
    else:
        rows = []
        for page in range(1, 11):
            request = Request(SOURCE + f"&page={page}", headers={
                "User-Agent": "jadeleke-portfolio-snapshot",
                "Accept": "application/vnd.github+json",
            })
            with urlopen(request, timeout=20) as response:
                batch = json.load(response)
            if not isinstance(batch, list):
                raise ValueError("GitHub did not return a repository list")
            rows.extend(batch)
            if len(batch) < 100:
                break
        else:
            raise ValueError("Pagination limit reached; refusing to write an incomplete snapshot")
    if not rows or any(repo.get("private") or repo.get("owner", {}).get("login", "").lower() != "jadeleke" for repo in rows):
        raise ValueError("Expected public repositories owned by jadeleke")
    repos = [{key: repo.get(key) for key in FIELDS} for repo in rows]
    metadata = {
        "checkedAt": checked_at or datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": SOURCE,
        "publicRepositories": len(repos),
        "originalActiveRepositories": sum(not repo["fork"] and not repo["archived"] for repo in repos),
    }
    for filename, value in [("repos-cache.json", repos), ("repos-cache-meta.json", metadata)]:
        (ROOT / "data" / filename).write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Saved {len(repos)} public repositories; {metadata['originalActiveRepositories']} original active repositories.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--from-json", help="Use an already downloaded public API response")
    parser.add_argument("--checked-at", help="Verified snapshot date (ISO 8601)")
    args = parser.parse_args()
    refresh(args.from_json, args.checked_at)
