// Indique e ganhe — refresh com Web Share API, texto pré-formatado e
// deep-links para WhatsApp/Telegram. Tracking via UTM (?utm_source=referral
// &utm_medium=share-{canal}&utm_campaign=indique&ref={CODE}) — backend pode
// atribuir o crédito da indicação ao decodificar `ref` no cadastro.
import { useState } from 'react'
import { Session, toast } from '../lib/api-client'
import { Topbar } from '../components/Shell'

const REFERRAL_CODE = 'BLAXX-A7K3'
const SITE_URL = 'https://blaxxpontos.com.br'

// Constrói URL com UTM por canal. Mantém a `ref` mesmo se UTM forem
// ignorados — backend usa só a `ref` como fonte de verdade.
function buildShareUrl(channel: string): string {
  const url = new URL(SITE_URL + '/cadastro')
  url.searchParams.set('utm_source', 'referral')
  url.searchParams.set('utm_medium', `share-${channel}`)
  url.searchParams.set('utm_campaign', 'indique')
  url.searchParams.set('ref', REFERRAL_CODE)
  return url.toString()
}

// Texto convidativo padrão. Curto pra caber em status do WhatsApp + e-mail.
function shareMessage(channel: string, firstName?: string): string {
  const url = buildShareUrl(channel)
  const intro = firstName ? `Oi, sou ${firstName}!` : 'Oi!'
  return (
    `${intro} Tô usando o BlaXx Rewards — programa de pontos com cashback em Pix.\n` +
    `Use meu código ${REFERRAL_CODE} no cadastro e a gente ganha 1.000 pts cada quando você fizer a 1ª compra.\n\n` +
    url
  )
}

export default function Indique() {
  const user = Session.user()
  const firstName = (user?.name || '').split(' ')[0] || undefined
  const [shared, setShared] = useState<string | null>(null)

  function copy(text: string, label: string) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setShared(label)
        toast(label + ' copiado', 'success')
        window.setTimeout(() => setShared(null), 1800)
      })
      .catch(() => toast('Não consegui copiar — copie manualmente', 'error'))
  }

  function shareNative() {
    const text = shareMessage('native', firstName)
    const url = buildShareUrl('native')
    if (typeof navigator.share === 'function') {
      navigator
        .share({
          title: 'BlaXx Rewards',
          text,
          url,
        })
        .catch(() => {/* usuário cancelou — silencioso */})
    } else {
      // fallback: copia texto e abre WhatsApp Web
      copy(text, 'Mensagem')
      window.open(
        'https://wa.me/?text=' + encodeURIComponent(text),
        '_blank',
        'noopener,noreferrer',
      )
    }
  }

  return (
    <>
      <Topbar eyebrow="Indique e ganhe" title="Indicações" />
      <div className="main center" style={{ minHeight: '60vh', padding: '8px 0 40px' }}>
        <div className="card elevated center-text" style={{ maxWidth: 520, width: '100%' }}>
          <span className="eyebrow">Indique e ganhe</span>
          <h2>1.000 pts pra cada amigo</h2>
          <p className="subtitle" style={{ maxWidth: 380, margin: '6px auto 16px' }}>
            Quando seu amigo se cadastrar com seu código e fizer a 1ª compra,
            os <b>1.000 pts</b> caem na sua carteira automaticamente.
          </p>

          {/* Código grande + copy */}
          <div className="card lime mt-2" style={{ padding: 18 }}>
            <div
              className="mono"
              style={{
                fontSize: 28,
                letterSpacing: '0.12em',
                fontWeight: 800,
                fontVariantNumeric: 'tabular-nums',
              }}
              aria-label="Seu código de indicação"
            >
              {REFERRAL_CODE}
            </div>
            <button
              className="btn primary mt-3"
              style={{ width: '100%' }}
              onClick={() => copy(REFERRAL_CODE, 'Código')}
            >
              {shared === 'Código' ? '✓ Copiado!' : 'Copiar código'}
            </button>
          </div>

          {/* Compartilhar — share nativo + canais diretos (B2C + B2B) */}
          <div className="mt-4" style={{ display: 'grid', gap: 10 }}>
            <button
              className="btn primary"
              onClick={shareNative}
              style={{ background: 'var(--blaxx-lime)', color: '#0A0A0A' }}
            >
              📲 Compartilhar
            </button>

            {/* B2C: WhatsApp + Telegram (chat 1:1) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <a
                className="btn"
                href={
                  'https://wa.me/?text=' +
                  encodeURIComponent(shareMessage('whatsapp', firstName))
                }
                target="_blank"
                rel="noopener noreferrer"
                style={{ background: '#25D366', color: '#fff', textDecoration: 'none' }}
              >
                WhatsApp
              </a>
              <a
                className="btn"
                href={
                  'https://t.me/share/url?url=' +
                  encodeURIComponent(buildShareUrl('telegram')) +
                  '&text=' +
                  encodeURIComponent(shareMessage('telegram', firstName))
                }
                target="_blank"
                rel="noopener noreferrer"
                style={{ background: '#0088CC', color: '#fff', textDecoration: 'none' }}
              >
                Telegram
              </a>
            </div>

            {/* B2B: redes sociais + e-mail (alcance amplo / colegas) */}
            <details style={{ textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: 13, padding: '6px 0' }}>
                Mais opções — LinkedIn, X, e-mail
              </summary>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                <a
                  className="btn"
                  href={
                    'https://www.linkedin.com/sharing/share-offsite/?url=' +
                    encodeURIComponent(buildShareUrl('linkedin'))
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ background: '#0A66C2', color: '#fff', textDecoration: 'none' }}
                >
                  LinkedIn
                </a>
                <a
                  className="btn"
                  href={
                    'https://twitter.com/intent/tweet?text=' +
                    encodeURIComponent(
                      `${firstName ? `Aqui no BlaXx Rewards eu (${firstName}) ` : 'No BlaXx Rewards '}` +
                      `pontos viram Pix. Código: ${REFERRAL_CODE} → `,
                    ) +
                    '&url=' +
                    encodeURIComponent(buildShareUrl('x'))
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ background: '#0F1419', color: '#fff', textDecoration: 'none' }}
                >
                  X (Twitter)
                </a>
                <a
                  className="btn"
                  href={
                    'mailto:?subject=' +
                    encodeURIComponent('BlaXx Rewards — cashback em Pix') +
                    '&body=' +
                    encodeURIComponent(shareMessage('email', firstName))
                  }
                  style={{ background: 'transparent', border: '1px solid var(--border)', textDecoration: 'none' }}
                >
                  ✉️ E-mail
                </a>
                <button
                  className="btn"
                  onClick={() => copy(buildShareUrl('slack'), 'Link Slack')}
                  style={{ background: '#4A154B', color: '#fff' }}
                >
                  {shared === 'Link Slack' ? '✓ Link copiado' : 'Slack (link)'}
                </button>
              </div>
            </details>

            <button
              className="btn"
              onClick={() => copy(shareMessage('clipboard', firstName), 'Mensagem')}
              style={{ background: 'transparent', border: '1px solid var(--border)' }}
            >
              {shared === 'Mensagem' ? '✓ Mensagem copiada' : 'Copiar mensagem pronta'}
            </button>
          </div>

          {/* Link cru pra quem prefere */}
          <details className="mt-4" style={{ textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              Ver link direto
            </summary>
            <div
              className="mono mt-2"
              style={{
                fontSize: 11,
                wordBreak: 'break-all',
                background: 'rgba(0,0,0,0.04)',
                padding: 10,
                borderRadius: 8,
              }}
            >
              {buildShareUrl('link')}
            </div>
          </details>
        </div>
      </div>
    </>
  )
}
