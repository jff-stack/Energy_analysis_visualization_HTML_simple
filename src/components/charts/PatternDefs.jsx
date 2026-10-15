/** A small square legend chip in the same solid colour as its chart series. */
export function Swatch({ fill, size = 12 }) {
  return (
    <svg width={size} height={size} aria-hidden="true" className="shrink-0">
      <rect width={size} height={size} fill={fill} />
    </svg>
  )
}
