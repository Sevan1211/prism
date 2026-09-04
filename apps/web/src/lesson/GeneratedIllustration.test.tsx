import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { GeneratedIllustration } from './GeneratedIllustration'
import { getLessonIllustration } from '../storage/lessonIllustrations'

vi.mock('../storage/lessonIllustrations', () => ({ getLessonIllustration: vi.fn() }))
it('retains the AI disclosure and gives an explicit fallback when the local image is missing', async () => {
  vi.mocked(getLessonIllustration).mockResolvedValue(undefined)
  render(<GeneratedIllustration sourceId="source" assetId="missing" alt="Conceptual spatial model" caption="An explanatory illustration" />)
  expect(screen.getByText('AI-generated illustration')).toBeVisible()
  expect(await screen.findByText('This illustration is unavailable in this browser.')).toBeVisible()
  expect(screen.queryByRole('img')).not.toBeInTheDocument()
  expect(getLessonIllustration).toHaveBeenCalledWith('missing', 'source')
})
