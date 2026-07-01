---
name: Morphic Studio Nav & Routing
description: Navigation link status, URL convention, and which hrefs are intentional placeholders vs. real destinations
---

## URL Convention
All internal links must use root-relative paths (e.g. `/dashboard.html`, not `dashboard.html`). story-hub.html and character-manager.html have been normalized to this convention.

## Page Map (as of 2026-07-01)

| File | Sidebar active item | Real? |
|---|---|---|
| `/dashboard.html` | Story Writing | ✅ |
| `/story-hub.html` | Story Bible | ✅ |
| `/character-manager.html` | Character Manager | ✅ |
| `/world-builder.html` | World Builder | ✅ |
| `/asset-library.html` | Asset Library | ✅ |
| `/storyboard.html` | Storyboard | ✅ |
| `/comic-studio.html` | Comic Studio | ✅ |
| `/animation-studio.html` | Animation Studio | ✅ |
| `/motion-comic-studio.html` | Motion Comic | ✅ |
| `/new-project.html` | (modal flow) | ✅ |

## Intentional Placeholder hrefs (`href="#"`)
- "Plot Map" in story-hub.html sidebar — page not yet built
- "Overview" tab in story-hub.html top-nav — tab content not yet built
- "Dashboard" in all sidebars pointing to dashboard already — works fine

## Pipeline Bar (dashboard.html top header)
All 7 pipeline steps are now clickable `<a>` tags:
Story → Story Bible → Characters → Storyboard → Comic → Animation → Export/Asset Library

**Why:** Code review flagged non-clickable `<div>` elements in the pipeline bar; replaced with `<a href>` to complete the navigation flow.
