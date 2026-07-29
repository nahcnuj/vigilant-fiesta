# Design Overview

This repository contains the **OchimonoPuzzleGame** web remake.

## High‑Level Architecture
- **Entry point**: `src/main.ts` (Deno entry point, compiled to `dist/main.js`).
- **Renderer**: PixiJS `Application` attached to `<div id="game-container"></div>`.
- **Game Logic**: Pure TypeScript modules handling board state, piece generation, gravity, and match detection. No direct DOM manipulation.
- **Asset Loading**: PixiJS `Loader` loads spritesheets from the `assets/` directory.
- **UI Overlay**: Vanilla HTML/CSS (glass‑morphism, dark mode) for score, level, and controls, layered over the canvas.
- **Build**: Deno tasks copy sources to `dist/` and bundle with `deno bundle` (or `esbuild`) into a single JS file for deployment.

## Module Breakdown
| Module | Responsibility |
|--------|-----------------|
| `Game.ts` | Core game loop, board updates, piece spawning. |
| `Board.ts` | Grid representation, collision detection, line clear logic. |
| `Piece.ts` | Shape definitions, rotation, position handling. |
| `Renderer.ts` | PixiJS wrapper: creates the app, renders board cells as sprites, animates piece movement. |
| `Assets.ts` | Loads textures, defines sprite frames for each piece type. |
| `InputHandler.ts` | Keyboard (← → ↓ ↑) and optional touch controls. |
| `UI.ts` | Updates HTML overlay (score, next piece preview, level indicator). |

## UI / UX Guidelines
- **Glassmorphism** for overlay panels (`backdrop-filter: blur(12px)`).
- **Dark‑mode palette** with vibrant accent (e.g., HSL(210, 70%, 45%)).
- **Typography**: Google Font **Inter**.
- **Micro‑animations**: button hover scaling, piece drop easing, score count‑up.
- **Responsive layout**: canvas scales to container width; UI adapts to mobile screens.

## Development Roadmap (TDD‑style)
1. **Scaffold** – set up Deno config, add PixiJS dependency, create empty canvas.
2. **Board Logic** – implement `Board.ts` with unit tests for line clearing.
3. **Renderer Integration** – map board state to PixiJS sprites, use ticker for the game loop.
4. **Input Handling** – keyboard and touch support.
5. **UI Overlay** – score, level, next piece panel.
6. **Polish** – glassmorphism, animations, responsive design.
7. **Build & Deploy** – CI builds and publishes to GitHub Pages.

## Testing Strategy
- **Unit tests** (Deno standard library) for `Board`, `Piece`, and core game logic.
- **Integration tests** using Playwright to verify canvas rendering and input handling.
- **Performance**: target 60 fps; profile with Chrome DevTools.

---
*All design documentation is now consolidated in this single file for simplicity.*
