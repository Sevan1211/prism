/** A composited light layer follows the SVG beam without repainting its paths. */
export function PrismFlow() {
  return (
    <div className="prism-flow" aria-hidden="true">
      <div className="prism-flow-window">
        <div className="prism-flow-band" />
      </div>
    </div>
  )
}
