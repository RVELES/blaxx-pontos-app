// BlaxxBrand — marca oficial, arte vetorial do pacote BlaXx Rewards.
//
// Antes: o wordmark era TEXTO ("Bla" + "Xx" em Space Grotesk com font-weight
// 800). A marca mudava de forma conforme a fonte que o navegador carregasse,
// e não era a arte oficial — só uma aproximação tipográfica dela.
//
// Agora vem de /marca/*.svg, vetorizado da arte oficial. Duas variantes,
// porque a arte só existe para fundo preto ("Bla" branco):
//   *.svg        → superfícies ESCURAS  ("Bla" branco, "Xx" neon #59FD27)
//   *-claro.svg  → superfícies CLARAS   ("Bla" tinta,  "Xx" lime-dark #5AB800)
// A regra do "Xx" em #5AB800 no claro é a mesma já registrada no projeto —
// neon puro sobre claro dá 1,08:1.


export function BlaxxMark({
  size = 28,
  tone = 'light',
  className = '',
}: {
  size?: number
  tone?: 'light' | 'dark'
  className?: string
}) {
  // tone='light' = marca clara, para superfície escura (nome herdado do resto
  // do componente); tone='dark' = marca escura, para superfície clara.
  const src = tone === 'light' ? '/marca/blaxx-simbolo-b.svg' : '/marca/blaxx-simbolo-b-claro.svg'
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className={className}
      style={{ flexShrink: 0, display: 'block', height: size, width: 'auto' }}
    />
  )
}

export function BlaxxBrand({
  markSize = 26,
  showText = true,
  tone = 'light',
  className = '',
}: {
  markSize?: number
  /** @deprecated a arte é uma peça só; o tamanho vem de markSize */
  fontSize?: number
  showText?: boolean
  tone?: 'light' | 'dark'
  className?: string
}) {
  // showText=false → só o símbolo "B"; caso contrário o lockup horizontal
  // completo (BlaXx + REWARDS), que é uma peça única de arte.
  if (!showText) return <BlaxxMark size={markSize} tone={tone} className={className} />
  const src = tone === 'light' ? '/marca/blaxx-wordmark.svg' : '/marca/blaxx-wordmark-claro.svg'
  return (
    <img
      src={src}
      alt="BlaXx Rewards"
      className={'bxbrand ' + className}
      style={{ display: 'block', height: Math.round(markSize * 1.15), width: 'auto', flexShrink: 0 }}
    />
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
  const src = tone === 'light' ? '/marca/blaxx-logo-completo.svg' : '/marca/blaxx-logo-completo-claro.svg'
  return (
    <img
      src={src}
      alt="BlaXx Rewards"
      className={className}
      style={{ height, width: 'auto', display: 'block' }}
    />
  )
}

export default BlaxxBrand
