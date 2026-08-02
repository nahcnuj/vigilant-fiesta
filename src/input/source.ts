import type { ActionHandler } from "./controller.ts";

/**
 * An input device or UI surface that produces {@link GameAction}s.
 * Call the returned function to detach listeners / tear down DOM.
 *
 * Current: keyboard. Planned: on-screen buttons (and other sources as needed).
 */
export interface InputSource {
  attach(handler: ActionHandler): () => void;
}

/** Attach many sources; dispose() detaches all. */
export function attachSources(
  handler: ActionHandler,
  sources: InputSource[],
): () => void {
  const detachers = sources.map((s) => s.attach(handler));
  return () => {
    for (const d of detachers) d();
  };
}
