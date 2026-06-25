// Banner de consentimento LGPD — primeira visita ou quando o usuário pedir
// pra revisar. Três categorias: necessário (sempre on), analytics, marketing.
// A escolha é guardada em localStorage com timestamp e versão da política.
import { useEffect, useState } from 'react'

const KEY = 'blaxx_consent_v1'
const VERSION = 1

export interface ConsentChoice {
  v: number              // versão da política
  necessary: true        // sempre true (só pra mostrar no UI)
  analytics: boolean
  marketing: boolean
  ts: number             // quando salvou
}

const DEFAULT_CHOICE: Omit<ConsentChoice, 'ts'> = {
  v: VERSION,
  necessary: true,
  analytics: false,
  marketing: false,
}

export function getConsent(): ConsentChoice | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const c = JSON.parse(raw) as ConsentChoice
    // Se a versão mudou, devolvemos null pra forçar nova escolha.
    return c.v === VERSION ? c : null
  } catch {
    return null
  }
}

function setConsent(c: Omit<ConsentChoice, 'ts'>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...c, ts: Date.now() }))
  } catch {
    /* noop */
  }
}

/** Dispara evento global pra outras partes do app reagirem (ex.: analytics). */
function emit(c: Omit<ConsentChoice, 'ts'>) {
  window.dispatchEvent(new CustomEvent('blaxx:consent', { detail: c }))
}

export default function ConsentBanner() {
  const [open, setOpen] = useState(false)
  const [details, setDetails] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  // Abre na 1ª visita ou quando alguém disparar `blaxx:reopen-consent`.
  useEffect(() => {
    if (!getConsent()) setOpen(true)
    function onReopen() {
      const c = getConsent()
      if (c) {
        setAnalytics(c.analytics)
        setMarketing(c.marketing)
      }
      setDetails(true)
      setOpen(true)
    }
    window.addEventListener('blaxx:reopen-consent', onReopen)
    return () => window.removeEventListener('blaxx:reopen-consent', onReopen)
  }, [])

  function acceptAll() {
    const c = { ...DEFAULT_CHOICE, analytics: true, marketing: true }
    setConsent(c)
    emit(c)
    setOpen(false)
    setDetails(false)
  }
  function necessaryOnly() {
    setConsent(DEFAULT_CHOICE)
    emit(DEFAULT_CHOICE)
    setOpen(false)
    setDetails(false)
  }
  function saveCustom() {
    const c = { ...DEFAULT_CHOICE, analytics, marketing }
    setConsent(c)
    emit(c)
    setOpen(false)
    setDetails(false)
  }

  if (!open) return null

  return (
    <div className="blx-consent" role="dialog" aria-label="Preferências de cookies">
      <div className="blx-consent__panel">
        {!details ? (
          <>
            <div className="blx-consent__body">
              <strong>Cookies e privacidade</strong>
              <p>
                Usamos cookies <b>necessários</b> pra te manter logado e proteger a conta.
                Pode autorizar também cookies de <b>analytics</b> (entender o uso e
                melhorar a UX) e <b>marketing</b> (mensurar campanhas). Sua escolha
                pode ser revista a qualquer momento no rodapé do site.
              </p>
            </div>
            <div className="blx-consent__actions">
              <button className="blx-consent__btn ghost" onClick={() => setDetails(true)}>
                Personalizar
              </button>
              <button className="blx-consent__btn ghost" onClick={necessaryOnly}>
                Apenas necessário
              </button>
              <button className="blx-consent__btn primary" onClick={acceptAll}>
                Aceitar todos
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="blx-consent__body">
              <strong>Preferências de cookies</strong>
              <ul>
                <li>
                  <label>
                    <input type="checkbox" checked disabled />
                    <div>
                      <b>Necessários</b>
                      <span>Login, sessão, segurança. Não podem ser desligados.</span>
                    </div>
                  </label>
                </li>
                <li>
                  <label>
                    <input
                      type="checkbox"
                      checked={analytics}
                      onChange={(e) => setAnalytics(e.target.checked)}
                    />
                    <div>
                      <b>Analytics</b>
                      <span>Métricas agregadas e anônimas pra entender o uso.</span>
                    </div>
                  </label>
                </li>
                <li>
                  <label>
                    <input
                      type="checkbox"
                      checked={marketing}
                      onChange={(e) => setMarketing(e.target.checked)}
                    />
                    <div>
                      <b>Marketing</b>
                      <span>Mensurar campanhas e personalização de comunicação.</span>
                    </div>
                  </label>
                </li>
              </ul>
            </div>
            <div className="blx-consent__actions">
              <button className="blx-consent__btn ghost" onClick={() => setDetails(false)}>
                Voltar
              </button>
              <button className="blx-consent__btn primary" onClick={saveCustom}>
                Salvar preferências
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/** Helper público — outras partes (ex.: link no rodapé) chamam pra reabrir. */
export function reopenConsent() {
  window.dispatchEvent(new CustomEvent('blaxx:reopen-consent'))
}
