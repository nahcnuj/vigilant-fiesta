# Design Document for OchimonoPuzzleGame (Web Version)

## Goal
Create a modern, premium‑looking web remake of the classic **OchimonoPuzzleGame** using **PixiJS** as the rendering engine.

## High‑level Architecture
- **Entry point**: `src/main.ts` (Deno entry, compiled to `dist/main.js`).
- **Renderer**: PixiJS Application attached to `<div id="game-container"></div>`.
- **Game Logic**: Pure TypeScript modules (no DOM dependencies) handling pieces, board state, gravity, and match detection.
- **Assets**: Images/Spritesheets stored in `assets/` and loaded via PixiJS Loader.
- **UI Overlay**: Vanilla HTML/CSS (glass‑morphism, dark mode) for score, level, controls.
- **Build**: Deno task copies sources to `dist/` and bundles with `deno bundle` (or `esbuild`) into a single JS file.

## Core Modules
| Module | Responsibility |
|--------|-----------------|
| `Game.ts` | Main game class – board grid, piece generation, tick loop. |
| `Piece.ts` | Representation of a falling piece (shape, rotation, position). |
| `Board.ts` | Fixed grid, collision detection, line‑clear logic. |
| `InputHandler.ts` | Keyboard handling (← → ↓ ↑) and touch fallback. |
| `Renderer.ts` | PixiJS wrapper – creates container, renders board, animates pieces, applies effects. |
| `Assets.ts` | Loads textures, defines sprite frames for each piece type. |
| `UI.ts` | Updates HTML overlay (score, next piece, level). |

## PixiJS Integration Steps
1. **Add dependency**: `deno add npm:pixi.js` (already done).
2. Create `src/renderer.ts`:
   ```ts
   import { Application } from "npm:pixi.js";
   const app = new Application({ width: 800, height: 600, backgroundAlpha: 0 });
   document.getElementById("game-container")!.appendChild(app.view);
   export default app;
   ```
3. Load textures via `Assets.ts` and render each board cell as a `Sprite`.
4. Use PixiJS ticker (`app.ticker.add(delta => game.update(delta))`) for the main loop.
5. Add particle effects on line clear using `ParticleContainer`.

## UI / Styling (Premium Design)
- **Glassmorphism** overlay panels (`backdrop-filter: blur(12px)`).
- **Dark‑mode** palette with vibrant accent (e.g., HSL(210, 70%, 45%)).
- **Typography**: Google Font **Inter**.
- **Micro‑animations**: button hover scaling, piece drop easing, score count‑up.
- **Responsive**: canvas scales to container, UI adapts to mobile.

## Asset Pipeline
- Store SVGs in `assets/svg/`.
- Convert to PNG spritesheet via a Deno script.
- Load with `PIXI.Loader.shared.add([...])` during init.

## Build & Deploy
1. `deno task build` → bundles `src/main.ts` + PixiJS into `dist/main.js`.
2. CI (GitHub Actions) copies `dist/` to `gh-pages` branch for GitHub Pages.
3. Enable source‑maps for debugging (dev) and minify for production.

## Testing & Quality
- **Unit tests** (Deno std) for `Board`, `Piece`, match detection.
- **Integration test**: headless browser (Playwright) to verify canvas appears and reacts to key events.
- **Performance**: target 60 fps, profile with Chrome DevTools.

## Milestones (TDD‑style)
| Milestone | Description | Tests |
|-----------|-------------|-------|
| M1 – Scaffold | Repo setup, Deno config, PixiJS dep, empty canvas. | Smoke test that `app` renders. |
| M2 – Board Logic | Implement `Board`, piece placement, gravity. | Unit tests for line clear. |
| M3 – Renderer | Map board state to PixiJS sprites. | Visual snapshot test. |
| M4 – Input | Keyboard + touch controls. | End‑to‑end key press test. |
| M5 – UI Overlay | Score, next piece panel, start/pause UI. | DOM tests. |
| M6 – Polish | Glassmorphism, animations, responsive scaling. | Manual visual QA. |
| M7 – Deploy | CI builds and publishes to GitHub Pages. | CI pass. |

## References
- PixiJS docs: https://pixijs.com/
- ADR‑001 (framework decision).
- Current project structure (`src/`, `docs/adr/`).

---
*This design document is now version‑controlled in the repository.*
