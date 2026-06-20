// BlaxxBrand — marca oficial recriada em SVG (B-mark) + wordmark "BlaXx".
// "Bla" acompanha a superfície (claro/escuro); "Xx" sempre no verde neon da marca.
import { useId } from 'react'

const NEON = '#7CFF00'        // verde mais neon da paleta (Secondary)
const NEON_DARK = '#5AB800'   // companheiro legível sobre fundo claro

export function BlaxxMark({ size = 28, color }: { size?: number; color?: string }) {
  const id = useId()
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0, display: 'block', color: color ?? NEON }}
    >
      <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
        <rect width="64" height="64" fill="#000" />
        <rect x="14" y="10" width="11" height="44" rx="2.5" fill="#fff" />
        <path d="M14 10H33a11 11 0 0 1 0 22H14Z" fill="#fff" />
        <path d="M14 31h21a11.5 11.5 0 0 1 0 23H14Z" fill="#fff" />
        <rect x="25" y="16" width="12" height="10" rx="2.5" fill="#000" />
        <rect x="25" y="36" width="13" height="12" rx="2.5" fill="#000" />
      </mask>
      <rect width="64" height="64" fill="currentColor" mask={`url(#${id})`} />
    </svg>
  )
}

export function BlaxxBrand({
  markSize = 26,
  fontSize = 19,
  showText = true,
  tone = 'light',
  className = '',
}: {
  markSize?: number
  fontSize?: number
  showText?: boolean
  tone?: 'light' | 'dark'
  className?: string
}) {
  const onDark = tone === 'light'
  const baseText = onDark ? '#FFFFFF' : '#0A0A0A'
  const neon = onDark ? NEON : NEON_DARK
  return (
    <span
      className={'bxbrand ' + className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: Math.round(markSize * 0.3) }}
    >
      <BlaxxMark size={markSize} color={neon} />
      {showText && (
        <span
          style={{
            fontFamily: "'Sora', var(--font-body)",
            fontWeight: 800,
            fontSize,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            color: baseText,
          }}
        >
          Bla<span style={{ color: neon }}>Xx</span>
        </span>
      )}
    </span>
  )
}

export default BlaxxBrand
