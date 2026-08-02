import { assertEquals, assert } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { Game } from "./game.ts";

/** Soft-drop until current piece type changes (locked) or game over. */
function softDropUntilLock(game: Game): void {
  const type = game.currentPiece.type;
  for (let i = 0; i < 40; i++) {
    if (game.isGameOver || game.currentPiece.type !== type) return;
    game.tick();
  }
}

Deno.test("1 tick でカレントが1マス落下する", () => {
  const game = new Game(10, 20, { currentPiece: "O", nextPiece: "I" });
  const y = game.position.y;
  game.tick();
  assertEquals(game.position.y, y + 1);
  assert(!game.isGameOver);
});

Deno.test("接地すると盤面に固定され、next が current になる", () => {
  const game = new Game(10, 20, { currentPiece: "O", nextPiece: "I" });
  softDropUntilLock(game);

  assertEquals(game.currentPiece.type, "I");
  const filled = game.board.getGrid().some((row) => row.some((c) => c !== null));
  assert(filled);
});

Deno.test("左右に移動でき、壁では止まって位置が変わらない", () => {
  const game = new Game(10, 20, { currentPiece: "O", nextPiece: "O" });
  const x0 = game.position.x;

  game.moveRight();
  assertEquals(game.position.x, x0 + 1);
  game.moveLeft();
  assertEquals(game.position.x, x0);

  // 左端まで寄せてさらに左へ → 動かない
  for (let i = 0; i < 20; i++) game.moveLeft();
  const atLeft = game.position.x;
  game.moveLeft();
  assertEquals(game.position.x, atLeft);
});

Deno.test("回転でき、衝突するときは回転前の形のまま", () => {
  const game = new Game(10, 20, { currentPiece: "T", nextPiece: "O" });
  const open = game.currentPiece.shape;
  game.rotateCW();
  assertEquals(game.currentPiece.shape !== open, true);

  // 左端に寄せた I を縦に回せない状況は盤面ブロックで再現
  const blocked = new Game(10, 20, { currentPiece: "T", nextPiece: "O" });
  blocked.board.place([[1]], blocked.position.x + 1, blocked.position.y);
  const before = blocked.currentPiece.shape;
  blocked.rotateCW();
  assertEquals(blocked.currentPiece.shape, before);
});

Deno.test("ライン消去でスコアと消去本数が増える", () => {
  const game = new Game(4, 8, { currentPiece: "O", nextPiece: "O" });
  // 最下段を埋めておき、接地ロック時の clear で消える
  game.board.place([[1, 1, 1, 1]], 0, 7);
  softDropUntilLock(game);

  assertEquals(game.linesCleared >= 1, true);
  assertEquals(game.score >= 100, true);
});

Deno.test("新しいピースを出現させられないとゲームオーバー", () => {
  // 2x2 に O は置けるが、ロック後の next O の出現位置と衝突しうるよう盤を塞ぐ
  const game = new Game(4, 4, { currentPiece: "O", nextPiece: "O" });
  // 出現帯 (中央付近 y=0) を埋める
  game.board.place(
    [
      [1, 1, 1, 1],
      [1, 1, 1, 1],
    ],
    0,
    0,
  );
  // すでに出現マスが塞がっているなら即ゲームオーバー
  // そうでなければ接地まで落としてスポーン衝突を起こす
  if (!game.isGameOver) {
    softDropUntilLock(game);
  }
  assert(game.isGameOver);
});
