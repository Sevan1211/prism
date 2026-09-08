import { useEffect, useState } from 'react'
import { getLessonIllustration, type LessonIllustration } from '../storage/lessonIllustrations'

export function GeneratedIllustration({ sourceId, assetId, alt, caption }: { sourceId: string; assetId: string; alt: string; caption: string }) {
  const [asset, setAsset] = useState<{ image: LessonIllustration; url: string } | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let cancelled = false, url: string | undefined
    void getLessonIllustration(assetId, sourceId).then(image => {
      if (cancelled) return
      if (!image) { setFailed(true); return }
      url = URL.createObjectURL(image.blob); setAsset({ image, url })
    }).catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url) }
  }, [assetId, sourceId])
  return <figure className="generated-illustration"><span className="generated-image-label">AI-generated illustration</span>{asset ? <a href={asset.url} target="_blank" rel="noopener noreferrer" aria-label="Open illustration at original size"><img src={asset.url} alt={alt} width={asset.image.width} height={asset.image.height} loading="lazy" /></a> : <p role="status">{failed ? 'This illustration is unavailable in this browser.' : 'Opening illustration…'}</p>}<figcaption>{caption}{asset ? <small>{asset.image.attribution} · Illustrative content, not original source evidence.</small> : null}</figcaption></figure>
}
