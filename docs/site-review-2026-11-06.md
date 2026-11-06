# Portfolio review and upgrade

Reviewed on 6 November 2026. Scope: the public portfolio, shared navigation, project data, current CV, and publishing-interface presentation.

## Assessment

The editorial visual direction is coherent, and the academic profile correctly presents a PhD student with research interests. The previous version had concrete usability and reliability gaps that made it less convincing than its appearance suggested. The upgrade keeps the design and strengthens its evidence, navigation, and failure behaviour.

## Findings and implemented changes

| Priority | Finding | Upgrade |
| --- | --- | --- |
| High | Keyboard focus escaped an open mobile menu into the page. | Cycle visible header controls in DOM order; return focus on Escape; handle nested Explore disclosure first. |
| High | The downloadable CV omitted the current PhD student status and DBA responsibility. | Publish a current two-page CV, link it from the web résumé, retain the historical documents, and provide a print action. |
| High | Failed project requests removed valid static entries and left filters with an empty dataset. | Retain all 16 curated entries, provide a dated complete repository snapshot, and refresh live metadata independently. |
| High | Several old project descriptions and links lacked current source support. | Replace the broken GhanaVoice link with the verified LocalTongue project, describe pretrained Wav2Vec2 inference accurately, correct audio-classification descriptions, and link actual repositories/documentation. |
| Medium | The portrait was presented as a small badge beneath the introduction. | Give it a dedicated hero portrait panel beside the introduction; place the interactive workflow in the research section. |
| Medium | Some controls were undersized, and enlarged text overflowed cards. | Increase functional labels and hit areas, constrain grid tracks, and allow long headings to wrap. |
| Medium | Secondary pages were primarily reachable through the footer. | Add an accessible native Explore menu and project-page section links. |
| Medium | Mobile navigation disappeared if the interaction script failed after theme initialisation. | Collapse navigation only after its handlers are installed; preserve an unenhanced navigation fallback. |
| Medium | The worker cached arbitrary same-origin content, served stale JSON, and deleted unrelated caches. | Restrict caching to known public routes, use network-first validated JSON, preserve unrelated caches, and retain real offline 404 status. |
| Medium | An installed older worker could mix new page markup with old styles and scripts during deployment. | Version local asset references and only reuse the base precache for the matching release. |
| Medium | Filters omitted repositories beyond an arbitrary initial limit. | Search all available repositories, display twelve at a time, and add an accessible Show more control. |
| Low | Theme state did not follow later system or cross-tab changes. | Follow system preference until an explicit choice and synchronise saved choices across tabs. |
| Low | Shared markup and static project cards could drift between pages. | Add shared templates, deterministic project builders, and checks for shell/data drift. |
| Low | Credentials did not distinguish attached documents from listed entries. | Label available PDF documents and entries without attached documents. |
| Low | Article metadata was generic. | Add article type, original publication dates, and BlogPosting metadata for local articles. |

## Project review

The [public GitHub repository response](https://api.github.com/users/jadeleke/repos?per_page=100&sort=updated) contained 53 repositories, including 44 non-fork, non-archived repositories. The dated snapshot retains the actual API fields; displayed counts, language, and timestamps come from those records.

Sixteen curated projects now include source links and documented descriptions. Additions include Local Platform Infrastructure, Recall MCP, PAL Tech Learning Hub, PAL Evaluation, Loop Engineering Studio, Health Sentinel, and English Audio Transcription. The project browser also exposes the broader collection, including older mobile, data, and utility projects.

The OpenMed brief uses the [repository documentation](https://github.com/jadeleke/openmed-mlops/blob/main/README.md), provides reproduction links, and clearly identifies an educational synthetic-data demonstration. No published research, completed PhD, new scientific method, or clinical validation is inferred from portfolio code.

## Verification

- Static checks cover all 18 HTML pages, local links/anchors, unique IDs, metadata, shared controls, and sitemap entries.
- Curated selections are checked against the verified public snapshot; the static featured and project lists are checked against their source metadata.
- 126 browser layout checks cover all 18 pages, light and dark themes, 320–1440px viewports, and 200% text enlargement, with zero JavaScript page exceptions.
- 59 accessibility regressions cover keyboard focus, nested menus, system/explicit theme changes, cross-tab preferences, reduced motion, no JavaScript, and partial script failure.
- 71 reliability regressions cover blocked APIs, malformed data, saved and live results, pagination, filters, cache ownership, data freshness, offline pages, versioned assets, and the current PDF.
- Both current CV pages were rendered with Poppler and visually inspected. The PDF is searchable and has six clickable URI annotations. The structured web résumé remains available for accessible reading.

Browser tests use local HTTP and controlled external responses. Repository documentation supports project descriptions; this review does not independently reproduce project benchmarks or certify standards conformance.

## Maintenance

1. Update navigation in `templates/`, then run `python scripts/sync_shell.py`.
2. Refresh repository metadata with `python scripts/refresh_repos.py`.
3. Edit verified selections in `data/featured.json`, then run `python scripts/build_projects.py`.
4. Rebuild the CV after profile changes with `python scripts/build_resume.py`, update its build date, and visually verify every page.
5. Run the commands in the README before publishing. Increment the service-worker version when shared static assets change.
