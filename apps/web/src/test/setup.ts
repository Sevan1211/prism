import '@testing-library/jest-dom/vitest'

if (typeof HTMLDialogElement !== 'undefined') HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }

if (typeof window !== 'undefined') Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }),
})

if (typeof HTMLCanvasElement !== 'undefined') Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  value: () => ({}),
})
