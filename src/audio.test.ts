import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { AudioManager } from "./audio.ts";

Deno.test("disabled: unlock/play/bgm do not throw", async () => {
  const a = new AudioManager({ disabled: true });
  await a.unlock();
  a.playSe("move");
  a.startBgm();
  a.stopBgm();
  assertEquals(a.isMuted, false);
});

Deno.test("setMuted toggles state", () => {
  const a = new AudioManager({ disabled: true });
  a.setMuted(true);
  assertEquals(a.isMuted, true);
  a.setMuted(false);
  assertEquals(a.isMuted, false);
});
