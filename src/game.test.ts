import { assertEquals, assert } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { Game } from "./game.ts";
import { FallingPair, num, op } from "./piece.ts";

function pair(a: ReturnType<typeof num> | ReturnType<typeof op>, b: ReturnType<typeof num> | ReturnType<typeof op>) {
  return new FallingPair(a, b);
}

Deno.test("1 tick でペアが1マス落下する", () => {
  const game = new Game(8, 10, {
    current: pair(num(1), num(2)),
    next: pair(num(3), num(4)),
  });
  const y = game.position.y;
  game.tick();
  assertEquals(game.position.y, y + 1);
});

Deno.test("接地すると盤に固定され next が current になる", () => {
  const game = new Game(8, 10, {
    current: pair(num(1), num(2)),
    next: pair(num(5), op("+")),
  });
  game.hardDrop();
  assertEquals(game.current.pivot, num(5));
  assertEquals(game.current.secondary, op("+"));
  const filled = game.board.getGrid().some((row) => row.some((c) => c !== null));
  assert(filled);
});

Deno.test("数式が揃うと消えスコアが増える", () => {
  const game = new Game(8, 10, {
    current: pair(num(9), num(9)),
    next: pair(num(0), num(0)),
  });
  // 盤面に 1 +  を置き、落下で 3 を置く… ペアは2個なので事前配置で 1 + 3
  game.board.placeBlocks([
    { x: 0, y: 9, block: num(1) },
    { x: 1, y: 9, block: op("+") },
    { x: 2, y: 9, block: num(3) },
  ]);
  // 強制 resolve: hardDrop の lock で formula 解決
  // すでに数式があるので、何かロックすれば resolveFormulas が走る
  game.hardDrop();
  assertEquals(game.score >= 4, true);
  // 1+3 のセルは消えている
  assertEquals(game.board.get(0, 9), null);
});

Deno.test("出現位置に置けないとゲームオーバー", () => {
  const game = new Game(8, 10, {
    current: pair(num(1), num(2)),
    next: pair(num(3), num(4)),
  });
  // 盤を埋める（lock 後の重力で上方が空かないようにする）
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 8; x++) {
      game.board.placeBlocks([{ x, y, block: num(1) }]);
    }
  }
  game.hardDrop();
  assert(game.isGameOver);
});

Deno.test("左右に移動でき、壁では動かない", () => {
  const game = new Game(8, 10, {
    current: pair(num(1), num(2)),
    next: pair(num(3), num(4)),
  });
  const x0 = game.position.x;
  game.moveRight();
  assertEquals(game.position.x, x0 + 1);
  game.moveLeft();
  assertEquals(game.position.x, x0);
  for (let i = 0; i < 20; i++) game.moveLeft();
  const atWall = game.position.x;
  game.moveLeft();
  assertEquals(game.position.x, atWall);
});

Deno.test("回転でき、衝突時は向きが戻る", () => {
  const game = new Game(8, 10, {
    current: pair(num(1), num(2)),
    next: pair(num(3), num(4)),
  });
  game.rotateCW();
  assertEquals(game.current.orientation, 1);

  // 左端に寄せて CW（secondary が左へ）→ 場外で戻る
  const blocked = new Game(8, 10, {
    current: pair(num(1), num(2)),
    next: pair(num(3), num(4)),
  });
  for (let i = 0; i < 20; i++) blocked.moveLeft();
  blocked.rotateCW();
  assertEquals(blocked.current.orientation, 0);
});

Deno.test("ゲームオーバー後は tick / hardDrop が状態を変えない", () => {
  // 高さ 1 では縦並びペアが置けず即ゲームオーバー
  const game = new Game(8, 1, {
    current: pair(num(1), num(2)),
    next: pair(num(3), num(4)),
  });
  assert(game.isGameOver);
  const score = game.score;
  game.tick();
  game.hardDrop();
  assertEquals(game.score, score);
  assert(game.isGameOver);
});

Deno.test("tick で接地すると固定される", () => {
  const game = new Game(8, 4, {
    current: pair(num(1), num(2)),
    next: pair(num(5), num(6)),
  });
  // 縦向き: pivot と secondary が y と y+1。底付近まで落とす
  while (!game.isGameOver && game.current.pivot.value === 1) {
    game.tick();
  }
  assertEquals(game.current.pivot, num(5));
});

Deno.test("スコア 250 ごとにレベルが上がる", () => {
  const game = new Game(8, 10, {
    current: pair(num(9), num(9)),
    next: pair(num(0), num(0)),
  });
  // 5*5=25 を 10 本 → 250。落下帯と重ならない下段に置く
  for (let i = 0; i < 10; i++) {
    const x = (i % 2) * 3;
    const y = 5 + Math.floor(i / 2);
    game.board.placeBlocks([
      { x, y, block: num(5) },
      { x: x + 1, y, block: op("*") },
      { x: x + 2, y, block: num(5) },
    ]);
  }
  game.hardDrop();
  assertEquals(game.score >= 250, true);
  assertEquals(game.level >= 2, true);
});

Deno.test("コンストラクタで rng を渡せる", () => {
  const game = new Game(8, 10, { rng: () => 0.5 });
  assertEquals(game.current.pivot, num(5));
  assertEquals(game.next.pivot, num(5));
  assert(!game.isGameOver);
});

Deno.test("水平向きのハードドロップ後、片方は下まで落ちる", () => {
  // 左列だけ床があり、右列は空 → 横向きで着地すると右が浮くので重力で落とす
  const game = new Game(4, 4, {
    current: new FallingPair(num(1), num(2)),
    next: new FallingPair(num(3), num(4)),
  });
  // orientation 3: secondary が pivot の右
  game.current.rotateCW();
  game.current.rotateCW();
  game.current.rotateCW();
  assertEquals(game.current.orientation, 3);
  game.position = { x: 1, y: 0 };
  // 左下に障害（pivot側の列を埋める）
  game.board.placeBlocks([{ x: 1, y: 3, block: num(9) }]);
  game.hardDrop();
  // pivot(1) は y=2 に載り、secondary(2) は空列なので y=3 まで落ちる
  assertEquals(game.board.get(1, 2)?.kind, "num");
  assertEquals(game.board.get(1, 2)?.value, 1);
  assertEquals(game.board.get(2, 3)?.kind, "num");
  assertEquals(game.board.get(2, 3)?.value, 2);
  assertEquals(game.board.get(2, 2), null);
});
