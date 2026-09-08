import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react'
import { navigatePrism } from './navigation'

interface PrismLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  children: ReactNode
  href: string
}

export function PrismLink({ children, href, onClick, ...props }: PrismLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event)
    if (
      event.defaultPrevented
      || event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
      || props.target === '_blank'
    ) return
    event.preventDefault()
    navigatePrism(href)
  }

  return <a {...props} href={href} onClick={handleClick}>{children}</a>
}
