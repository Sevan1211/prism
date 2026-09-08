import { useEffect, useRef, useState } from 'react'
import prismHero from './assets/prism-hero.svg'
import { PrismFlow } from './PrismFlow'

export function PrismIllustration() {
  const [visible, setVisible] = useState(true)
  const figureRef = useRef<HTMLElement>(null)
  useEffect(() => {
    let inView = true
    const updateVisibility = () => setVisible(inView && document.visibilityState !== 'hidden')
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      updateVisibility()
    })
    if (figureRef.current) observer?.observe(figureRef.current)
    document.addEventListener('visibilitychange', updateVisibility)
    updateVisibility()
    return () => {
      observer?.disconnect()
      document.removeEventListener('visibilitychange', updateVisibility)
    }
  }, [])
  return (
    <div className="prism-experience" data-motion={visible ? 'playing' : 'paused'}>
      <figure className="prism-illustration" ref={figureRef}>
        <img className="prism-hero-image" src={prismHero} width={1600} height={850} alt="White light enters a black prism and emerges as a spectrum." />
        <PrismFlow />
        <figcaption className="sr-only">A spectrum of understanding, from one source.</figcaption>
      </figure>
    </div>
  )
}
