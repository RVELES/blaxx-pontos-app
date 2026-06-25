// Preferências de UI persistidas em localStorage — uma única fonte pra todas
// as opt-ins/outs que NÃO pertencem ao perfil do usuário no backend (são
// preferências de DEVICE, não de conta).
//
// Dispara 'blaxx:prefs' (CustomEvent) quando algo muda, pra componentes
// reagirem sem precisar fazer poll do localStorage.

const KEY = 'blaxx_prefs_v1'

export interface Prefs {
  /** Confetti, sweeps de brilho, transições exuberantes. Default ligado. */
  celebrations: boolean
  /** Auto-rotate do globo (a Home já tinha esse comportamento implícito). */
  globeAutoRotate: boolean
}

const DEFAULT: Prefs = {
  celebrations: true,
  globeAutoRotate: true,
}

export function getPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT
    return { ...DEFAULT, ...(JSON.parse(raw) as Partial<Prefs>) }
  } catch {
    return DEFAULT
  }
}

export function setPref<K extends keyof Prefs>(key: K, value: Prefs[K]): void {
  const cur = getPrefs()
  const next = { ...cur, [key]: value }
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* storage indisponível */
  }
  // Emite evento global pra componentes reagirem em tempo real.
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('blaxx:prefs', { detail: next }))
  }
}

/** Reage a mudanças. Devolve cleanup. */
export function onPrefsChange(cb: (p: Prefs) => void): () => void {
  const handler = () => cb(getPrefs())
  window.addEventListener('blaxx:prefs', handler)
  // Também react a mudanças vindas de outras abas
  const storageHandler = (e: StorageEvent) => {
    if (e.key === KEY) cb(getPrefs())
  }
  window.addEventListener('storage', storageHandler)
  return () => {
    window.removeEventListener('blaxx:prefs', handler)
    window.removeEventListener('storage', storageHandler)
  }
}
