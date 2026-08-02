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
| `src/input/` | 操作意図 → Game（デバイス非依存） |

```
src/renderer/
  index.ts       # 公開: Renderer を re-export
  renderer.ts    # Pixi Application / canvas / draw
  layout.ts      # 矩形・色相（renderer 専用）
  layout.test.ts

src/input/
  index.ts         # 公開 API + setupInput（現状はキーボード）
  action.ts        # GameAction（操作意図）と表示用ラベル
  controller.ts    # GameAction → Game メソッド
  source.ts        # InputSource（attach / detach）
  keyboard.ts      # キーボード実装（現行）
  # 予定: 画面上ボタン用 InputSource（ジェスチャは別途検討）
```

ビルド: `deno task build` → `dist/main.js`。

## 入力アーキテクチャ（スマホ対応の布石）

操作はすべて **`GameAction`** に正規化する。Game は具体的な入力デバイスを知らない。

| GameAction | 現行キーボード | 想定 UI（画面上ボタン） |
|------------|----------------|-------------------------|
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
    Game.moveLeft | moveRight | rotateCW | hardDrop
```

- **画面上ボタン**: 各 `GameAction` に 1 コントロール。ラベルは `GAME_ACTION_LABELS` を再利用（操作説明にも使える）。
- **操作説明**: 「キー ↔ ラベル」または「ボタン ↔ ラベル」を出せばよい（文言の単一ソースは `GAME_ACTION_LABELS` + キーマップ表）。
- **ジェスチャ**: 未定。必要になったら同じ `InputSource` 契約で検討する。

現状の配線: `setupInput(game)` はキーボード source のみ attach。

## テスト配置

| 種類 | 置き場 | 対象 |
|------|--------|------|
| **Unit** | `src/**/*.test.ts`（実装隣） | ドメイン仕様（Board / Pair / formula / Game） |
| **Integration** | `tests/integration/` | 複数モジュールを公開 API でつなぐ |
| **E2E** | `tests/e2e/` | 現状は起動スモーク（ページ＋ canvas）。開始〜終了の一連プレイは未カバー |

`layout.ts` は renderer パッケージ内のヘルパ（Unit: `layout.test.ts`）。ドメインは Unit / Integration、画面接続は E2E。

```bash
deno task test           # unit + integration
deno task test:e2e       # browser smoke (Playwright)
```

## UI

- フィールド 8×10
- オーバーレイ: スコア・レベル（glassmorphism）
- アセット: 実スプライトが必要になった時点で `assets/` を追加
