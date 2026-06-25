// BlaxxBrand — marca oficial (artwork exportado do guia de marca BlaXx Rewards).
// O símbolo e o lockup completo vêm dos SVGs oficiais servidos em /public:
//   /blaxx_simbolo_color.svg     → símbolo "B" neon (#59FD27)
//   /blaxx_principal_color.svg   → lockup vertical completo (B + BlaXx + REWARDS), fundos escuros
//   /blaxx_principal_preto.svg   → lockup vertical completo em preto, fundos claros
// O wordmark horizontal (chrome do app) usa o símbolo oficial + texto "BlaXx"
// ("Bla" acompanha a superfície; "Xx" no verde neon da marca).
const NEON = '#59FD27' // Verde oficial (#59FD27)
const MARK_RATIO = 451 / 520 // proporção do símbolo oficial (blaxx_simbolo_color.svg)

export function BlaxxMark({ size = 28, className = '' }: { size?: number; className?: string }) {
  const w = Math.round(size * MARK_RATIO)
  return (
    <img
      src="/blaxx_simbolo_color.svg"
      alt=""
      aria-hidden="true"
      className={className}
      width={w}
      height={size}
      style={{ flexShrink: 0, display: 'block', width: w, height: size }}
    />
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
  return (
    <span
      className={'bxbrand ' + className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: Math.round(markSize * 0.3) }}
    >
      <BlaxxMark size={markSize} />
      {showText && (
        <span
          style={{
            fontFamily: "'Space Grotesk', var(--font-body)",
            fontWeight: 800,
            fontSize,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            color: baseText,
          }}
        >
          Bla<span style={{ color: NEON }}>Xx</span>
        </span>
      )}
    </span>
  )
}

// Lockup vertical oficial completo (símbolo + "BlaXx" + "REWARDS").
// tone='light' → versão colorida (para fundos escuros);
// tone='dark'  → versão preta (para fundos claros).
export function BlaxxLockup({
  height = 140,
  tone = 'light',
  className = '',
}: {
  height?: number
  tone?: 'light' | 'dark'
  className?: string
}) {
  const src = tone === 'light' ? '/blaxx_principal_color.svg' : '/blaxx_principal_preto.svg'
  return (
    <img
      src={src}
      alt="BlaXx Rewards"
      className={className}
      width={height}
      height={height}
      style={{ width: height, height, display: 'block', objectFit: 'contain' }}
    />
  )
}

export default BlaxxBrand
