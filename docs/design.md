# Design Overview

[落ち物パズルゲーム](https://www.nahcnuj.work/works/2013/01_ochimono.html) の Web リメイク。  
上から降る数字・記号ブロックを「数字・記号・数字」の並びにし、計算結果をスコアにする。  
仕様の正本は [`requirements.md`](./requirements.md)。オリジナル実装は [OchimonoPuzzleGame](https://github.com/nahcnuj/OchimonoPuzzleGame)。

## High-level architecture

| 層 | 役割 |
|----|------|
| `index.html` + `style.css` | シェルとオーバーレイ（リポジトリ直下） |
| `src/main.ts` | エントリ。Game + Renderer + Input を接続 |
| `src/game.ts` | ミュータブルなセッション（落下・操作・スコア） |
| `src/board.ts` / `piece.ts` / `formula.ts` | 盤・2 ブロックペア・数式検出 |
| `src/renderer/` | 描画パッケージ（公開 API は `index.ts`） |
| `src/input.ts` | キー割当（←→移動、↓回転、↑ハードドロップ） |

```
src/renderer/
  index.ts       # 公開: Renderer を re-export
  renderer.ts    # Pixi Application / canvas / draw
  layout.ts      # 矩形・色相（renderer 専用）
  layout.test.ts
```

ビルド: `deno task build` → `dist/main.js`。

## テスト配置

| 種類 | 置き場 | 対象 |
|------|--------|------|
| **Unit** | `src/**/*.test.ts`（実装隣） | ドメイン仕様（Board / Pair / formula / Game） |
| **Integration** | `tests/integration/` | 複数モジュールを公開 API でつなぐ |
| **E2E** | `tests/e2e/` | ブラウザで index + bundle + Pixi canvas |

`layout.ts` は renderer パッケージ内のヘルパ（Unit: `layout.test.ts`）。ドメインは Unit / Integration、画面接続は E2E。

```bash
deno task test           # unit + integration
deno task test:e2e       # browser smoke (Playwright)
```

## UI

- フィールド 8×10
- オーバーレイ: スコア・レベル（glassmorphism）
- アセット: 実スプライトが必要になった時点で `assets/` を追加
