// Força de senha — port fiel de passwordStrength() (cadastro.html / redefinir-senha.html).
export interface StrengthResult {
  score: number
  label: string
  hints: string[]
  ok: boolean
}

export const STRENGTH_COLORS = ['#ff6b6b', '#ff6b6b', '#ffb74d', '#a4d65e', '#a4d65e']

// Política (spec do user): senha livre, no formato que o cliente quiser,
// bastando ter no mínimo 7 caracteres.
export const PASSWORD_MIN_LENGTH = 7

export function passwordStrength(pwd: string): StrengthResult {
  pwd = pwd || ''
  const ok = pwd.length >= PASSWORD_MIN_LENGTH
  const hints: string[] = ok ? [] : [`${PASSWORD_MIN_LENGTH}+ caracteres`]
  return {
    score: ok ? 5 : Math.min(4, pwd.length),
    label: ok ? 'ok' : `mínimo ${PASSWORD_MIN_LENGTH} caracteres`,
    hints,
    ok,
  }
}

/** Aplica a máscara de CPF 000.000.000-00 (espelha o handler de input do cadastro). */
export function maskCPF(value: string): string {
  const v = value.replace(/\D/g, '').slice(0, 11)
  return v
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}
