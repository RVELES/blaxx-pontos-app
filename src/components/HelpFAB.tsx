// HelpFAB — botão flutuante de ajuda que substitui o WhatsAppFab antigo.
// Clique abre painel com FAQ inline + atalho pro WhatsApp. Mais útil que
// o WhatsApp direto: muitos atritos têm resposta sem precisar abrir chat.
import { useEffect, useRef, useState } from 'react'

const WHATSAPP_NUMBER = '5511999999999'  // homologação — substituir em prod

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Quanto vale cada ponto?',
    a: 'Cada ponto BlaXx equivale a R$ 0,09 no resgate via Pix. O valor exato aparece sempre antes de você confirmar.',
  },
  {
    q: 'Os pontos expiram?',
    a: 'Têm validade longa e você é avisado por e-mail e push com antecedência antes de qualquer expiração.',
  },
  {
    q: 'Como acumulo pontos?',
    a: 'Compras em parceiros, missões semanais, indicações de amigos e campanhas. Cada tier (Plus/Prime/Black/VIP) multiplica o ganho.',
  },
  {
    q: 'O resgate Pix demora quanto?',
    a: 'Geralmente em poucos minutos após a confirmação. Em casos raros pode levar até 2 horas úteis.',
  },
  {
    q: 'Posso enviar pontos para outra pessoa?',
    a: 'Sim, em "Enviar pontos". A pessoa precisa ter uma conta BlaXx; envios são instantâneos e gratuitos.',
  },
]

export default function HelpFAB() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const panelRef = useRef<HTMLDivElement | null>(null)

  // Fecha ao clicar fora ou pressionar Esc.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  const items = query
    ? FAQ.filter(
        (f) =>
          f.q.toLowerCase().includes(query.toLowerCase()) ||
          f.a.toLowerCase().includes(query.toLowerCase()),
      )
    : FAQ

  const waHref =
    'https://wa.me/' +
    WHATSAPP_NUMBER +
    '?text=' +
    encodeURIComponent(
      query
        ? `Olá! Procurei "${query}" na BlaXx e ainda preciso de ajuda.`
        : 'Olá! Preciso de ajuda com a BlaXx.',
    )

  return (
    <div ref={panelRef} className="blx-help">
      {open && (
        <div className="blx-help__panel" role="dialog" aria-label="Central de ajuda">
          <div className="blx-help__head">
            <span className="blx-help__title">Como podemos ajudar?</span>
            <button
              className="blx-help__close"
              aria-label="Fechar"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>
          <input
            className="blx-help__search"
            type="search"
            placeholder="Pesquisar dúvida…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <ul className="blx-help__list">
            {items.map((f, i) => (
              <FAQItem key={i} q={f.q} a={f.a} />
            ))}
            {items.length === 0 && (
              <li className="blx-help__empty">
                Nenhuma resposta encontrada — fale com a gente no WhatsApp.
              </li>
            )}
          </ul>
          <a
            className="blx-help__wa"
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span aria-hidden>💬</span> Falar no WhatsApp
          </a>
        </div>
      )}
      <button
        className="blx-help__fab"
        aria-label={open ? 'Fechar ajuda' : 'Abrir ajuda'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        title="Ajuda"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        )}
      </button>
    </div>
  )
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <li className={'blx-help__item' + (open ? ' is-open' : '')}>
      <button
        className="blx-help__q"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{q}</span>
        <span aria-hidden className="blx-help__chev">{open ? '−' : '+'}</span>
      </button>
      {open && <p className="blx-help__a">{a}</p>}
    </li>
  )
}
