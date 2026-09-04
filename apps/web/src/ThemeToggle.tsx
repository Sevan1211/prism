import { useCallback, useState } from 'react'
import { Desktop, Moon, Sun } from '@phosphor-icons/react'

type ThemeChoice = 'system' | 'light' | 'dark'

const ORDER: ThemeChoice[] = ['system', 'light', 'dark']
const LABELS: Record<ThemeChoice, string> = {
  system: 'Auto',
  light: 'Light',
  dark: 'Night',
}

function storedChoice(): ThemeChoice {
  try {
    const value = localStorage.getItem('prism-theme')
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    return 'system'
  }
}

function applyTheme(choice: ThemeChoice) {
  if (choice === 'system') {
    delete document.documentElement.dataset.theme
  } else {
    document.documentElement.dataset.theme = choice
  }
  try {
    if (choice === 'system') {
      localStorage.removeItem('prism-theme')
    } else {
      localStorage.setItem('prism-theme', choice)
    }
  } catch {
    // Preference persistence is a convenience; theming still applies live.
  }
}

export function ThemeToggle() {
  const [choice, setChoice] = useState<ThemeChoice>(storedChoice)
  const advance = useCallback(() => {
    setChoice((current) => {
      const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length]
      applyTheme(next)
      return next
    })
  }, [])
  const Icon = choice === 'light' ? Sun : choice === 'dark' ? Moon : Desktop
  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={advance}
      aria-label={`Theme: ${LABELS[choice]}. Activate to change.`}
    >
      <Icon aria-hidden="true" weight="duotone" />
      <span>{LABELS[choice]}</span>
    </button>
  )
}
