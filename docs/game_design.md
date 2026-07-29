# Game Design

## Overview
The core of **Ochimono Puzzle Game** will be rendered inside the HTML element with `id="game-container"`. The container lives in the Vento template (`src/index.vto`).  At runtime a small **bootstrap module** (`src/main.ts`) is loaded as an ES module and will:
1. Locate `#game‑container` in the DOM.
2. Create a `<canvas>` that fills the container's dimensions.
3. Initialise the game engine (currently a placeholder, later will import `src/game.ts`).
4. Attach event listeners for keyboard / touch input.

## Vento (`.vto`) Explanation
Vento is Lume’s built‑in templating language. Files ending with `.vto` are processed at build time and the result is plain HTML.  The template can contain normal HTML tags, inline CSS and a `<script type="module" src="/main.js"></script>` which tells the browser to load the compiled **main.ts** as a module.

```vto
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ochimono Puzzle Game</title>
  <style>
    body {margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#121212;color:#fff;}
    #game-container {width:400px;height:500px;background:rgba(255,255,255,0.05);border-radius:16px;box-shadow:0 4px 30px rgba(0,0,0,0.1);backdrop-filter:blur(5px);border:1px solid rgba(255,255,255,0.1);}
  </style>
</head>
<body>
  <div id="game-container"></div>
  <script type="module" src="/main.js"></script>
</body>
</html>
```

The only dynamic part is the script tag – everything else is static HTML/CSS.

## Bootstrap Module (`src/main.ts`)
```ts
export async function initGame() {
  const container = document.getElementById('game‑container');
  if (!container) throw new Error('Game container not found');

  const canvas = document.createElement('canvas');
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  container.appendChild(canvas);

  // future: import and start the real game engine
  // const { start } = await import('./game.ts');
  // start(canvas);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
```
* The module is compiled by Lume (TypeScript → `main.js`).
* It runs **once** after the page loads, guaranteeing that the container exists.

## Architecture Diagram
```mermaid
flowchart TD
    A[Browser loads generated HTML] --> B[Bootstrap module (main.js)]
    B --> C[Locate #game-container]
    C --> D[Create & append Canvas]
    D --> E[Initialize Game Engine (future import)]
    E --> F[Render loop, input handling]
```

## Future Extension Points
| Area | Planned Implementation |
|------|------------------------|
| **Game Engine** | `src/game.ts` will export a `start(canvas: HTMLCanvasElement)` function that sets up the game loop, renders blocks, and processes input. |
| **Asset Loading** | A small utility module (e.g., `src/assets.ts`) will handle loading images/audio via `fetch` and expose them to the engine. |
| **State Management** | A lightweight store (`src/store.ts`) can keep score, level, and pause state, accessible from both the engine and UI overlay. |
| **Responsive Layout** | If we later want the container to be responsive, `main.ts` will listen to `ResizeObserver` and adjust the canvas size accordingly. |

## Next Steps (Documentation Only)
1. **Create the Vento template** (`src/index.vto`) – already exists with the container and script tag.
2. **Add the bootstrap module** (`src/main.ts`).
3. **Add a placeholder game module** (`src/game.ts`).
4. **Update the build config** (`_config.ts`) to output to `dist` (already done).
5. **Add this design doc** to `docs/game_design.md`.

When the design doc is in place, we can proceed to the actual implementation (adding the files and committing).
