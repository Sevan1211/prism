import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

// Markdown is data, never executable HTML/MDX. Images must use a separately
// validated source-figure block; reading private material cannot ping a host.
export default function LessonRichText({ markdown }: { markdown: string }) {
  return (
    <div className="lesson-rich-text">
      <Markdown
        skipHtml
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { trust: false, strict: 'warn', throwOnError: false }]]}
        urlTransform={(url) => /^https?:\/\//i.test(url) ? url : ''}
        components={{
          h1: ({ children }) => <h4>{children}</h4>,
          h2: ({ children }) => <h4>{children}</h4>,
          h3: ({ children }) => <h4>{children}</h4>,
          img: ({ alt }) => <span className="lesson-image-fallback">{alt || 'Image'} · use a source figure to display this image.</span>,
          a: ({ href, children }) => href
            ? <a href={href} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">{children}<span className="sr-only"> (opens a new tab)</span></a>
            : <span>{children}</span>,
          table: ({ children }) => <div className="lesson-table" tabIndex={0} role="region" aria-label="Scrollable table"><table>{children}</table></div>,
        }}
      >{markdown}</Markdown>
    </div>
  )
}
