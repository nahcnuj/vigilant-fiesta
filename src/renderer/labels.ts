/** Options forwarded to PIXI display objects when disposing a label. */
export interface DestroyOptions {
  children?: boolean;
  texture?: boolean;
  baseTexture?: boolean;
}

export interface DestroyableChild {
  destroy(options?: DestroyOptions): void;
}

export interface ChildContainer {
  removeChildren(): DestroyableChild[];
}

/**
 * Remove and destroy every child of a label container.
 * PIXI's removeChildren() alone only detaches children, leaving their
 * textures alive; over a long session that leaks GPU memory until the
 * browser stalls.
 */
export function disposeChildren(container: ChildContainer): void {
  for (const child of container.removeChildren()) {
    child.destroy({ children: true, texture: true, baseTexture: true });
  }
}

export interface PoolNode {
  visible: boolean;
}

/**
 * Reuse pooled display objects for a per-frame redraw instead of allocating
 * and destroying one label per visible cell.
 *
 * PIXI keeps uploaded label textures alive for a while, so creating tens of
 * texts every frame grows GPU memory without bound and eventually freezes the
 * tab during a long session. Keeping a fixed pool makes texture use flat.
 */
export function syncPool<T extends PoolNode>(
  pool: T[],
  count: number,
  create: (index: number) => T,
): T[] {
  while (pool.length < count) pool.push(create(pool.length));
  for (let i = 0; i < pool.length; i++) pool[i].visible = i < count;
  return pool;
}
