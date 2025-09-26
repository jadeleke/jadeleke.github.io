# joseph-adeleke.github.io

Static personal website rebuilt in the spirit of the [Hugo Coder](https://github.com/luizdepra/hugo-coder) theme.

## Structure

- `index.html` - landing page with about, experience, featured projects, latest projects, and contact sections.
- `blog/` - simple blog index with two sample articles inside `blog/posts/`.
- `resume.html` - web resume with summary and skills plus PDF download entry point.
- `css/` and `js/` - theme styles and client scripts for theme toggle, project fetching, and contact form handling.
- `sw.js` and `manifest.webmanifest` - optional progressive web app assets.

## Contact form

The "Send message" form posts to Formspark. Replace `https://submit-form.com/YOUR_FORMSPARK_ID` in `index.html` with your own endpoint, or pass `?formspark=<url>` while testing.

## GitHub API usage

Project and featured sections read from `data/repos-cache.json` if present, otherwise they call the public GitHub API and show the top repositories.

## Assets

Add your resume at `assets/resume.pdf` and adjust colours or branding in `css/main.css` as desired.

