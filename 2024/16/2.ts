import * as p from 'https://deno.land/std@0.165.0/path/mod.ts'
import { PriorityQueue } from '../../utils/priority-queue.ts'

const input = await Deno.readTextFile(
  p.fromFileUrl(import.meta.resolve('./input.txt'))
)

type Point = { x: number; y: number }
const dirs: Point[] = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
]
const key = (p: Point) => `${p.x},${p.y}`
const s_key = (s: StackItem) => `${s.x},${s.y},${s.dir.x},${s.dir.y}`

const getNextPoints = (dir: Point) => {
  const idx = dirs.findIndex((d) => d === dir)
  return [
    [1, dir],
    [1001, dirs[(idx + 1) % dirs.length]],
    [1001, dirs[(idx + 3) % dirs.length]],
  ] as const
}

const grid = input
  .trimEnd()
  .split('\n')
  .map((l) => l.split(''))

const walls = new Set<string>()
const start: Point = { x: 0, y: 0 }
const end: Point = { x: 0, y: 0 }

for (const [y, row] of grid.entries()) {
  for (const [x, cell] of row.entries()) {
    if (cell === '#') {
      walls.add(key({ x, y }))
    }

    if (cell === 'S') {
      start.x = x
      start.y = y
    }

    if (cell === 'E') {
      end.x = x
      end.y = y
    }
  }
}

type StackItem = Point & { dir: Point; score: number; tiles: Set<string> }

const queue = new PriorityQueue<StackItem>(
  [
    {
      x: start.x,
      y: start.y,
      dir: dirs[0],
      score: 0,
      tiles: new Set<string>([key(start)]),
    },
  ],
  (a, b) => a.score - b.score
)

const visited = new Map<string, StackItem>()

let solution: StackItem | null = null
while (queue.length) {
  const c = queue.pop()!

  if (key(c) === key(end)) {
    if (c.score < (solution?.score ?? Infinity)) {
      solution = c
    }
    continue
  }

  for (const [cost, d] of getNextPoints(c.dir)) {
    const next: StackItem = {
      x: c.x + d.x,
      y: c.y + d.y,
      dir: d,
      score: c.score + cost,
      tiles: new Set<string>(c.tiles),
    }
    if (next.tiles.has(key(next))) {
      continue
    } else {
      next.tiles.add(key(next))
    }

    if (next.score > (solution?.score ?? Infinity)) {
      continue
    }

    if (walls.has(key(next))) {
      continue
    }

    const seen = visited.get(s_key(next))
    if (seen && seen.score < next.score) {
      continue
    }
    if (seen && seen.score === next.score) {
      seen.tiles = seen.tiles.union(next.tiles)
      continue
    }

    visited.set(s_key(next), next)
    queue.push(next)
  }
}

function _printGrid(s: StackItem) {
  const g = [...grid.map((r) => [...r])]
  g[s.y][s.x] = 'X'
  s.tiles.forEach((t) => {
    const [x, y] = t.split(',').map(Number)
    g[y][x] = 'O'
  })
  console.log(g.map((r) => r.join('')).join('\n'))
}
console.log(solution?.tiles.size)
