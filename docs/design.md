# Design Overview

[落ち物パズルゲーム](https://www.nahcnuj.work/works/2013/01_ochimono.html) の Web リメイク。  
上から降る数字・記号ブロックを「数字・記号・数字」の並びにし、計算結果をスコアにする。  
仕様の正本は [`requirements.md`](./requirements.md)。オリジナル実装は [OchimonoPuzzleGame](https://github.com/nahcnuj/OchimonoPuzzleGame)。

## High-level architecture

| 層 | 役割 |
|----|------|
| `index.html` + `style.css` | シェル（タイトル / プレイ / 結果） |
| `src/main.ts` | 画面遷移と Game + Renderer + Input の配線 |
| `src/game.ts` | ミュータブルなセッション（落下・操作・スコア） |
| `src/board.ts` / `piece.ts` / `formula.ts` | 盤・2 ブロックペア・数式検出 |
| `src/renderer/` | 描画パッケージ（公開 API は `index.ts`） |
| `src/input/` | 操作意図 → Game（デバイス非依存） |

```
src/renderer/
  index.ts       # 公開: Renderer を re-export
  renderer.ts    # Pixi Application / canvas / draw
  layout.ts      # 矩形・色相（renderer 専用）
  layout.test.ts

src/input/
  index.ts         # 公開 API + setupInput（現状はキーボード）
  action.ts        # GameAction と表示用ラベル
  controller.ts    # GameAction → Game メソッド
  source.ts        # InputSource（attach / detach）
  keyboard.ts      # キーボード実装
```

ビルド: `deno task build` → `dist/main.js`。

## 画面フロー

1. **title** (`#screen-title`) — スタート
2. **playing** (`#screen-playing`) — フィールド・スコア、入力有効
3. **result** (`#screen-result`) — 最終スコア、もう一度

DOM の `data-screen` / `hidden` で E2E から観測する。

## 入力アーキテクチャ

操作はすべて **`GameAction`** に正規化する。

| GameAction | 現行キーボード | 画面上ボタン（想定） |
|------------|----------------|----------------------|
| `moveLeft` | ← | 「左へ」 |
| `moveRight` | → | 「右へ」 |
| `rotateCW` | ↓ | 「回転」 |
| `hardDrop` | ↑ | 「一気に落とす」 |

```
InputSource (keyboard / on-screen buttons / …)
        │ GameAction
        ▼
ActionHandler = createGameController(game)
        │
        ▼
    Game の public API
```

現状: `setupInput(game)` はキーボードのみ。

## テスト配置

| 種類 | 置き場 | 対象 |
|------|--------|------|
| **Unit** | `src/**/*.test.ts` | ドメイン仕様 |
| **Integration** | `tests/integration/` | 複数モジュール |
| **E2E** | `tests/e2e/playthrough.mjs` | 開始 → ハードドロップのみ → 結果表示 |

E2E は `?e2e=1` で数字のみのペアを使い、数式消去なしで盤面が埋まりゲームオーバーまで到達できるようにする。

```bash
deno task test           # unit + integration
deno task test:e2e       # playthrough
```

## UI

- フィールド 8×10
- オーバーレイ: スコア・レベル
- アセット: 実スプライトが必要になった時点で `assets/` を追加
