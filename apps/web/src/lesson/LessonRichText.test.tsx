import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import LessonRichText from './LessonRichText'

describe('lesson Markdown boundary', () => {
  it('renders readable structure and math without loading images or accepting executable markup', () => {
    const { container } = render(<LessonRichText markdown={'## A useful explanation\n\nRead **carefully**.\n\n- First\n- Second\n\n$L/R$\n\n![tracker](https://example.com/pixel.png)\n\n<script>alert(1)</script>\n\n[bad](javascript:alert(1))'} />)
    expect(screen.getByRole('heading', { name: 'A useful explanation' })).toBeVisible()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(container.querySelector('.katex')).not.toBeNull()
    expect(container.querySelector('script, img, iframe, a[href^="javascript:"]')).toBeNull()
  })
})
