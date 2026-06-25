// EmptyState — fallback unificado pra listas vazias / erros de fetch.
// Apple/Stripe pattern: ícone monocromático + título curto + sub + 1 CTA.
// Aceita actionLabel/onAction (botão) OU children (slot livre).
import type { ReactNode } from 'react'

interface Props {
  /** Ícone à esquerda do título; pode ser emoji ou SVG inline. */
  icon?: ReactNode
  title: string
  description?: ReactNode
  /** Ação primária — botão lime. */
  actionLabel?: string
  onAction?: () => void
  /** Conteúdo livre (links, segunda ação). Renderizado abaixo do botão. */
  children?: ReactNode
  /** Variant compacta pra dentro de cards. */
  size?: 'sm' | 'md'
  className?: string
}

export default function EmptyState({
  icon = '✨',
  title,
  description,
  actionLabel,
  onAction,
  children,
  size = 'md',
  className,
}: Props) {
  return (
    <div className={`blx-empty blx-empty--${size} ${className || ''}`} role="status">
      <div className="blx-empty__icon" aria-hidden>
        {icon}
      </div>
      <div className="blx-empty__title">{title}</div>
      {description && <div className="blx-empty__desc">{description}</div>}
      {actionLabel && onAction && (
        <button className="blx-empty__cta" onClick={onAction}>
          {actionLabel}
        </button>
      )}
      {children && <div className="blx-empty__extra">{children}</div>}
    </div>
  )
}
