import { useId, useState } from 'react'
import type { LessonBlockContent } from './lessonDocumentTypes'

export function NetworkDelayModel({ content }: {
  content: Extract<LessonBlockContent, { kind: 'network_delay' }>
}) {
  const id = useId()
  const [rate, setRate] = useState(content.link_mbps)
  const transmission = content.packet_bytes * 8 / (rate * 1000)
  const maximumTransmission = content.packet_bytes * 8 / (Math.max(0.1, content.link_mbps / 6) * 1000)
  const scale = maximumTransmission + content.propagation_ms
  const format = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 2 })
  return (
    <figure className="network-model" aria-labelledby={`${id}-title`}>
      <header><span>Explore the relationship</span><figcaption id={`${id}-title`}>{content.caption}</figcaption></header>
      <p>Send one {content.packet_bytes.toLocaleString()}-byte packet across one link. Follow the <strong>last bit</strong> until it arrives.</p>
      <div className="network-model-control">
        <label htmlFor={`${id}-rate`}>Link rate <strong>{format(rate)} Mb/s</strong></label>
        <input id={`${id}-rate`} type="range" min={Math.max(0.1, content.link_mbps / 6)} max={content.link_mbps * 2} step={Math.max(0.1, content.link_mbps / 60)} value={rate} onChange={(event) => setRate(Number(event.target.value))} />
        <div><span>Slower link</span><span>Faster link</span></div>
      </div>
      <div className="network-timeline" aria-hidden="true">
        <div style={{ width: `${100 * transmission / scale}%` }} className="network-transmit" />
        <div style={{ width: `${100 * content.propagation_ms / scale}%` }} className="network-propagate" />
      </div>
      <dl className="network-readout" aria-live="polite" aria-atomic="true">
        <div><dt><i className="network-transmit" />Transmission</dt><dd>{format(transmission)} <small>ms</small></dd></div>
        <div><dt><i className="network-propagate" />Propagation</dt><dd>{format(content.propagation_ms)} <small>ms</small></dd></div>
        <div><dt>Last bit arrives</dt><dd>{format(transmission + content.propagation_ms)} <small>ms</small></dd></div>
      </dl>
      <p className="network-insight">A faster link shortens the time spent putting bits onto the wire. The time a bit spends travelling stays fixed.</p>
      <details><summary>Model assumptions & calculation</summary><p>Transmission = packet bits ÷ link rate. Arrival time = transmission + propagation. This added model assumes an idle link and excludes queueing, processing, protocol overhead, and acknowledgements. The bars share a fixed time scale. Propagation begins as soon as the first bit leaves; the sum tracks the last bit.</p></details>
      <button type="button" className="quiet-button" disabled={rate === content.link_mbps} onClick={() => setRate(content.link_mbps)}>Reset link rate</button>
    </figure>
  )
}
