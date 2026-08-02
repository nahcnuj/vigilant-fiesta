# Design Overview

落ち物パズルゲーム・蘇（数字・演算子で数式を作る Web リメイク）。  
仕様の正本は [`requirements.md`](./requirements.md)。**テトリス／テトロミノではない。**

## High-level architecture

| 層 | 役割 |
|----|------|
| `index.html` + `style.css` | シェルとオーバーレイ（リポジトリ直下） |
| `src/main.ts` | エントリ。Game + Renderer + Input を接続 |
| `src/game.ts` | ミュータブルなセッション（落下・操作・スコア） |
| `src/board.ts` / `piece.ts` / `formula.ts` | 盤・2 ブロックペア・数式検出 |
| `src/renderer.ts` | Pixi 描画。色・矩形配置の純関数は単体テスト可 |
| `src/input.ts` | キー割当（←→移動、↓回転、↑ハードドロップ） |

ビルド: `deno task build` → `dist/main.js`（`deno.json` の tasks。別途 `build.ts` は置かない）。

## テスト方針

- ドメイン（Board / FallingPair / formula / Game）: 仕様を表す単体テスト（`*.test.ts` を実装隣）
- Renderer: Pixi 本体はブラウザ前提のため、**純関数**（セルサイズ・色相・paint リスト）を単体テスト
- 将来: Playwright 等で canvas / 入力の結合テスト

## UI

- フィールド 8×10
- オーバーレイ: スコア・レベル（glassmorphism）
- アセット: 実スプライトが必要になった時点で `assets/` を追加（空の placeholder は使わない）
