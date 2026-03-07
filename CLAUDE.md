# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**papaya.party** is a static website hosted via GitHub Pages (CNAME points to papaya.party). There is no build system, package manager, or server — all pages are standalone HTML files opened directly in a browser or served as static files.

## Development

No build step is required. To preview:
- Open any `.html` file directly in a browser, or
- Use any static file server: `python3 -m http.server 8080`

The `term/` directory is the only exception — it contains SCSS partials (`_*.scss`) compiled into `term/styles.css`. If modifying terminal styles, edit the SCSS source and recompile manually (there is no configured build pipeline for this).

## Architecture

### Main landing page (`index.html` + `style.css` + `script.js`)
Animated landing page with floating papaya images (CSS keyframe animations) and a typewriter effect (`script.js` uses jQuery to restart the CSS animation on click).

### Plant life simulation (`plants.js` + `plants.css`)
A canvas-based physics simulation using **Verlet integration**. The core engine is in the bottom half of `script.js` (inlined as `runVerlet()`) and the plant logic is in `plants.js`. Three primitive types compose everything:
- **Points** — 2D masses with current/previous position (velocity is implicit)
- **Spans** — rigid-length constraints between two points (enforced via iterative refinement)
- **Skins** — filled polygon outlines over an array of points

Plants are built from **Segments**, each containing base points, extension points, cross-spans for rigidity, and optional leaf spans with scaffolding. Growth is driven by incrementally lengthening span lengths each frame. The `Tl` utility object (at the bottom of `script.js`) provides `rib`/`rfb` (random int/float between), degree/radian conversion, and a busy-wait `pause`.

### Seattle restaurant guide (`seattle.html`, `about.html`, `suggest.html`)
Self-contained single-file app. Uses **Apple MapKit JS** for the map view. Restaurant data is hardcoded as a JS array inside the HTML. Features star ratings (full and half stars rendered with SVG/CSS), category filtering, and a list/map toggle. `about.html` and `suggest.html` are companion pages sharing the same Inter font and CSS variable palette.

### Top Ten (`top-ten.html`, `top-ten-beta.html`)
Single-file movie ranking page. All data, styles, and logic are inline. Two-column layout with a sticky sidebar.

### Mini-games
- `connections.html` — NYT-style word connections game, self-contained
- `bingo.html` — Coworker bingo card generator using Bootstrap 4

### Terminal (`term/`)
CRT-aesthetic terminal emulator. `terminal.js` is an ES module. Styles are split into SCSS partials (`_animations`, `_crt`, `_fonts`, `_layout`, `_responsive`, `_variables`) compiled into `styles.css`.
