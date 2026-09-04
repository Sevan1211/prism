import { StrictMode, useState } from 'react'
import { act, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { installFakeModelContext } from '../test/fakeModelContext'
import { textResult } from './context'
import { useModelContextTool } from './useModelContextTool'

let fake: ReturnType<typeof installFakeModelContext> | null = null

afterEach(() => {
  fake?.uninstall()
  fake = null
})

function Harness() {
  const [value, setValue] = useState('first')
  useModelContextTool({
    name: 'strict_mode_tool',
    description: 'Read the latest component value.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    readOnly: true,
    execute: async () => textResult({ value }),
  })

  return <button type="button" onClick={() => setValue('second')}>Update</button>
}

describe('useModelContextTool', () => {
  it('survives Strict Mode cleanup and keeps the current executor without re-registering', async () => {
    fake = installFakeModelContext({ rejectRegistrationOnAbort: true })
    const view = render(
      <StrictMode>
        <Harness />
      </StrictMode>,
    )

    expect(fake.tools.has('strict_mode_tool')).toBe(true)
    const registrationsAfterMount = fake.registrationCount

    await act(async () => {
      view.getByRole('button', { name: 'Update' }).click()
    })

    expect(fake.registrationCount).toBe(registrationsAfterMount)
    await expect(fake.execute('strict_mode_tool')).resolves.toMatchObject({ value: 'second' })

    view.unmount()
    await new Promise<void>((resolve) => queueMicrotask(() => resolve()))
    expect(fake.tools.has('strict_mode_tool')).toBe(false)
  })
})
