import { describe, expect, it } from 'vitest'
import { AUTHORING_GUIDE, getAuthoringGuide } from './authoringGuide'

describe('focused authoring guidance', () => {
  it('keeps the core smaller while preserving consent, full coverage and approval', () => {
    const core = JSON.stringify(getAuthoringGuide())
    expect(core.length).toBeLessThan(4200)
    expect(core).toContain('Agents cannot approve')
    expect(core).toContain('qualifications')
    expect(core).toContain('provider')
    expect(core).not.toContain('Run validate_lesson')
    expect(JSON.stringify(getAuthoringGuide('writing'))).toContain(AUTHORING_GUIDE.writing)
    expect(getAuthoringGuide('visuals')).toMatchObject({ visuals: AUTHORING_GUIDE.visuals })
    expect(JSON.stringify(getAuthoringGuide('revisions'))).toContain('coverage_review')
    expect(() => getAuthoringGuide('everything')).toThrow()
  })
})
