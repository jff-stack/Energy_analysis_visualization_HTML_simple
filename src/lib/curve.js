/**
 * curve.js — monotone cubic interpolation for SVG paths.
 *
 * Straight segments look mechanical; these curves flow through the points
 * without overshooting (a stacked area never dips below its own baseline).
 * Fritsch–Carlson tangents, same family as d3's curveMonotoneX.
 */
const f = (n) => n.toFixed(1)

/** "C…" segments that continue from the first point of `pts` (x strictly ordered, either direction). */
export function curveSegments(pts) {
  const n = pts.length
  if (n < 2) return ''
  const dx = []
  const m = []
  const t = new Array(n)
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1][0] - pts[i][0] || 1e-6
    m[i] = (pts[i + 1][1] - pts[i][1]) / dx[i]
  }
  t[0] = m[0]
  t[n - 1] = m[n - 2]
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0
      t[i + 1] = 0
    } else {
      const a = t[i] / m[i]
      const b = t[i + 1] / m[i]
      const s = a * a + b * b
      if (s > 9) {
        const tau = 3 / Math.sqrt(s)
        t[i] = tau * a * m[i]
        t[i + 1] = tau * b * m[i]
      }
    }
  }
  let d = ''
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3
    d += `C${f(pts[i][0] + h)},${f(pts[i][1] + t[i] * h)} ${f(pts[i + 1][0] - h)},${f(pts[i + 1][1] - t[i + 1] * h)} ${f(pts[i + 1][0])},${f(pts[i + 1][1])}`
  }
  return d
}

/** An open smooth line through points. */
export const smoothLine = (pts) => `M${f(pts[0][0])},${f(pts[0][1])}${curveSegments(pts)}`

/** A closed band between two smooth edges (both listed left → right). */
export function smoothBand(top, bottom) {
  const rev = bottom.slice().reverse()
  return `${smoothLine(top)}L${f(rev[0][0])},${f(rev[0][1])}${curveSegments(rev)}Z`
}
