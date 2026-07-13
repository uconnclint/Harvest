// 4-directional A* on a boolean grid. grid[ty][tx] === true means walkable.
// The farm is 30x20, so a simple open list is plenty fast.

export function findPath(grid, sx, sy, tx, ty) {
  const H = grid.length, W = grid[0].length;
  if (tx < 0 || ty < 0 || tx >= W || ty >= H || !grid[ty][tx]) return null;
  if (sx === tx && sy === ty) return [];

  const key = (x, y) => y * W + x;
  const open = [{ x: sx, y: sy, g: 0, f: 0, parent: null }];
  const best = new Map([[key(sx, sy), 0]]);
  const closed = new Set();
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let guard = 0;

  while (open.length && guard++ < 4000) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
    const cur = open.splice(bi, 1)[0];

    if (cur.x === tx && cur.y === ty) {
      const path = [];
      let n = cur;
      while (n.parent) { path.push({ x: n.x, y: n.y }); n = n.parent; }
      return path.reverse();
    }
    closed.add(key(cur.x, cur.y));

    for (const [dx, dy] of DIRS) {
      const nx = cur.x + dx, ny = cur.y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || !grid[ny][nx]) continue;
      const k = key(nx, ny);
      if (closed.has(k)) continue;
      const g = cur.g + 1;
      if (best.has(k) && best.get(k) <= g) continue;
      best.set(k, g);
      open.push({ x: nx, y: ny, g, f: g + Math.abs(tx - nx) + Math.abs(ty - ny), parent: cur });
    }
  }
  return null;
}
