// Cache GitHub repos into data/repos-cache.json
// Uses GITHUB_TOKEN if available to raise rate limits.

const { writeFile } = require('node:fs/promises');

async function main() {
  const username = process.env.GH_USERNAME || 'jadeleke';
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

  async function fetchAllRepos(user) {
    const url = `https://api.github.com/users/${user}/repos?per_page=100&sort=updated`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github+json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    return res.json();
  }

  function shape(repo) {
    return {
      name: repo.name,
      html_url: repo.html_url,
      description: repo.description,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      updated_at: repo.updated_at,
      homepage: repo.homepage,
      fork: repo.fork,
      archived: repo.archived
    };
  }

  try {
    const repos = (await fetchAllRepos(username)).map(shape);
    const filtered = repos.filter(r => !r.fork && !r.archived).sort((a,b)=>b.stargazers_count - a.stargazers_count);
    await writeFile('data/repos-cache.json', JSON.stringify(filtered, null, 2));
    console.log(`Wrote ${filtered.length} repos to data/repos-cache.json`);
  } catch (e) {
    console.error('Failed to cache repos:', e.message);
    process.exit(1);
  }
}

main();
