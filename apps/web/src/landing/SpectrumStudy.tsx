import { useId, useRef, useState } from 'react'
import { ArrowRight, ArrowUpRight } from '@phosphor-icons/react'

const colors = ['#9568dc', '#497fe3', '#53b9c3', '#74b970', '#e4c55d', '#e9a163', '#e76d67']
const ideas = [
  { label: 'The visible spectrum', title: 'A small window into light.', explanation: 'Our eyes detect only part of the electromagnetic spectrum. That visible window runs from about 380 to 700 nanometers.', source: 'Visible light is the portion of the electromagnetic spectrum detectable by the human eye, typically spanning wavelengths of approximately 380–700 nanometers.' },
  { label: 'Wavelength & color', title: 'Different spacing. Different color.', explanation: 'Wavelength is the distance between repeating peaks. Violet’s peaks sit closer together; red’s spread farther apart. A prism separates these wavelengths into a spectrum. Move the slider to compare the spacing.', source: 'Within this range, violet corresponds to the shortest wavelengths and red to the longest; a prism separates visible light into its constituent colors according to wavelength.' },
]

export function SpectrumStudy() {
  const [wavelength, setWavelength] = useState(550)
  const [idea, setIdea] = useState(1)
  const passageRef = useRef<HTMLSpanElement>(null)
  const id = useId().replaceAll(':', '')
  const position = (wavelength - 380) / 320
  const colorIndex = Math.min(5, Math.floor(position * 6))
  const mix = position * 6 - colorIndex
  const color = `rgb(${[1, 3, 5].map(offset => {
    const from = parseInt(colors[colorIndex].slice(offset, offset + 2), 16)
    const to = parseInt(colors[colorIndex + 1].slice(offset, offset + 2), 16)
    return Math.round(from + (to - from) * mix)
  }).join(' ')})`
  const period = wavelength / 4
  const wave = Array.from({ length: 301 }, (_, index) => {
    const x = 20 + index * 2
    return `${index ? 'L' : 'M'}${x} ${(128 - 35 * Math.cos((x - 70) / period * Math.PI * 2)).toFixed(1)}`
  }).join(' ')
  const observation = wavelength < 490 ? 'Shorter wavelength · closer peaks'
    : wavelength > 590 ? 'Longer wavelength · wider peaks' : 'Move toward either end to compare the spacing.'

  function showSource() {
    passageRef.current?.focus({ preventScroll: true })
    passageRef.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' })
  }

  return (
    <div className="passage-demo">
      <div className="demo-column-labels" aria-hidden="true"><span>The source</span><ArrowRight /><span>Explored in PRISM</span></div>
      <div className="demo-spread">
        <article className="demo-original" aria-labelledby="original-title">
          <div className="demo-source-kicker">The source <span>Science / Light</span></div>
          <h3 id="original-title">The visible<br /><em>spectrum.</em></h3>
          <p className="demo-passage">{ideas.map((item, index) => <span key={item.label} ref={idea === index ? passageRef : undefined} tabIndex={-1} className={idea === index ? 'is-connected' : undefined}>{item.source}{' '}</span>)}</p>
          <div className="demo-original-foot"><span>Textbook-style passage<br />Adapted from NASA’s Visible Light</span><a href="https://science.nasa.gov/ems/09_visiblelight/" target="_blank" rel="noreferrer" aria-label="Read NASA’s Visible Light (opens in a new tab)"><ArrowUpRight aria-hidden="true" /></a></div>
        </article>
        <div className="demo-lesson" aria-label="Interactive PRISM example">
          <div className="demo-lesson-kicker"><span>In PRISM</span><span>Same ideas. Open to exploration.</span></div>
          <div className="demo-ideas" role="group" aria-label="Choose an idea to explore">{ideas.map((item, index) => <button key={item.label} type="button" aria-pressed={idea === index} onClick={() => setIdea(index)}><span aria-hidden="true">0{index + 1}</span>{item.label}</button>)}</div>
          <div className="demo-explanation" aria-live="polite" aria-atomic="true"><h3>{ideas[idea].title}</h3><p>{ideas[idea].explanation}</p></div>
          <figure className="study-figure">
            <svg className="study-art" viewBox="0 0 640 244" role="img" aria-label={`Visible spectrum and an enlarged wave at ${wavelength} nanometers.`}>
              <defs><linearGradient id={`${id}-spectrum`}>{colors.map((stop, index) => <stop key={stop} offset={index / 6} stopColor={stop} />)}</linearGradient></defs>
              <rect x="20" y="10" width="600" height="14" fill={`url(#${id}-spectrum)`} />
              <path className="study-indicator" d={`M${20 + position * 600} 3v30`} />
              <text x="20" y="52" className="study-svg-label">380 nm · violet</text><text x="620" y="52" textAnchor="end" className="study-svg-label">700 nm · red</text>
              <path className="study-axis" d="M20 128H620" />
              <path d={wave} className="study-wave-outline" /><path d={wave} fill="none" stroke={color} strokeWidth="3" />
              <path className="study-measure" d={`M70 183v12m0-6h${period}m0-6v12`} />
              <text x={70 + period / 2} y="220" textAnchor="middle" className="study-svg-label">one wavelength</text>
            </svg>
            <figcaption className="sr-only">The wave peaks get closer toward 380 nanometers and farther apart toward 700 nanometers. Colors and distances are illustrative.</figcaption>
          </figure>
          <div className="study-controls">
            <output className="study-reading" htmlFor={`${id}-wavelength`}><span>{wavelength}</span><abbr title="nanometers">nm</abbr></output>
            <div className="study-slider"><label htmlFor={`${id}-wavelength`}>Try a different wavelength</label><input id={`${id}-wavelength`} type="range" min="380" max="700" step="5" value={wavelength} onChange={event => { setWavelength(Number(event.target.value)); setIdea(1) }} aria-valuetext={`${wavelength} nanometers`} aria-describedby={`${id}-observation`} /><div className="study-scale" aria-hidden="true"><span>shorter</span><span>longer</span></div></div>
          </div>
          <p className="study-observation" id={`${id}-observation`}>{observation}</p>
          <div className="demo-lesson-foot"><button type="button" onClick={showSource}>Find this in the passage <ArrowUpRight aria-hidden="true" /></button><button className="study-reset" type="button" onClick={() => { setWavelength(550); setIdea(1) }}>Reset</button></div>
        </div>
      </div>
      <p className="demo-caption">An interactive example of a PRISM explanation. Adapted for this page; colors and scale are illustrative.</p>
    </div>
  )
}
