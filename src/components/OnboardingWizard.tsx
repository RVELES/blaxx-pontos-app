// OnboardingWizard — modal de 3 passos exibido na 1ª entrada após cadastro.
// Padrão Nubank/Stripe: explicar valor + reduzir time-to-first-action.
// Trigger: localStorage('blaxx_onboarding_pending') === '1' (gravado em Cadastro/Validacao).
// Estado mantido localmente; ao fechar, marca 'blaxx_onboarded' e nunca reabre.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const KEY_PENDING   = 'blaxx_onboarding_pending'
const KEY_COMPLETED = 'blaxx_onboarded'

type Step = {
  eyebrow: string
  title: string
  body: string
  cta: { label: string; route: string }
  emoji: string
}

const STEPS: Step[] = [
  {
    eyebrow: 'PASSO 1 DE 3',
    emoji: '🏬',
    title: 'Conheça seus parceiros',
    body:
      'Mais de 50 marcas devolvem pontos em cada compra. Veja os principais antes do seu primeiro resgate.',
    cta: { label: 'Ver parceiros', route: '/parceiros' },
  },
  {
    eyebrow: 'PASSO 2 DE 3',
    emoji: '🎁',
    title: 'Ganhe 200 pontos grátis',
    body:
      'Indique 1 amigo e ambos ganham 200 pontos quando ele faz a primeira compra. Sem letra miúda.',
    cta: { label: 'Pegar meu link', route: '/indique' },
  },
  {
    eyebrow: 'PASSO 3 DE 3',
    emoji: '💸',
    title: 'Resgate em Pix em minutos',
    body:
      'Quando juntar pontos suficientes, o cashback cai direto no seu Pix. Sem mensalidade, sem letra miúda.',
    cta: { label: 'Ver minha carteira', route: '/carteira' },
  },
]

export default function OnboardingWizard() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    try {
      const pending = localStorage.getItem(KEY_PENDING) === '1'
      const done = localStorage.getItem(KEY_COMPLETED) === '1'
      if (pending && !done) setOpen(true)
    } catch {
      /* storage indisponível — segue sem onboarding */
    }
  }, [])

  function dismiss(redirectTo?: string) {
    try {
      localStorage.setItem(KEY_COMPLETED, '1')
      localStorage.removeItem(KEY_PENDING)
    } catch {
      /* noop */
    }
    setOpen(false)
    if (redirectTo) navigate(redirectTo)
  }

  if (!open) return null
  const s = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div
      className="blx-onb"
      role="dialog"
      aria-modal="true"
      aria-labelledby="blx-onb-title"
      onClick={() => dismiss()}  // clique no overlay fecha
    >
      <div className="blx-onb__card" onClick={(e) => e.stopPropagation()}>
        <button
          className="blx-onb__skip"
          onClick={() => dismiss()}
          aria-label="Pular onboarding"
        >
          Pular
        </button>
        <div className="blx-onb__emoji" aria-hidden>
          {s.emoji}
        </div>
        <div className="blx-onb__eyebrow">{s.eyebrow}</div>
        <h2 id="blx-onb-title" className="blx-onb__title">
          {s.title}
        </h2>
        <p className="blx-onb__body">{s.body}</p>

        <div className="blx-onb__dots" aria-hidden>
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={'blx-onb__dot' + (i === step ? ' is-on' : '')}
            />
          ))}
        </div>

        <div className="blx-onb__actions">
          {step > 0 && (
            <button
              className="blx-onb__back"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              Voltar
            </button>
          )}
          <button
            className="blx-onb__primary"
            onClick={() =>
              isLast ? dismiss(s.cta.route) : setStep((s) => s + 1)
            }
          >
            {isLast ? s.cta.label : 'Próximo'}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Helper público: marca que o usuário acabou de se cadastrar (chamar no
 *  fim do flow de Cadastro/Validacao). Renderiza-se sozinho na próxima rota
 *  autenticada (montagem do Shell). */
export function flagOnboardingPending() {
  try {
    localStorage.setItem(KEY_PENDING, '1')
  } catch {
    /* noop */
  }
}
