// Máscaras de input BR — funções puras, idempotentes (rodar 2x = mesmo
// resultado). Strip de caracteres não-dígito antes de aplicar pattern.
// Uso típico: <input value={cpf} onChange={(e)=>setCpf(maskCPF(e.target.value))} />

function onlyDigits(s: string): string {
  return s.replace(/\D+/g, '')
}

/** 000.000.000-00 (11 dígitos). */
export function maskCPF(value: string): string {
  const d = onlyDigits(value).slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

/** 00.000.000/0000-00 (14 dígitos). */
export function maskCNPJ(value: string): string {
  const d = onlyDigits(value).slice(0, 14)
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

/** Aceita CPF (11) ou CNPJ (14) — decide dinamicamente pelo tamanho. */
export function maskCpfOrCnpj(value: string): string {
  return onlyDigits(value).length > 11 ? maskCNPJ(value) : maskCPF(value)
}

/** 00000-000 (CEP, 8 dígitos). */
export function maskCEP(value: string): string {
  const d = onlyDigits(value).slice(0, 8)
  if (d.length <= 5) return d
  return `${d.slice(0, 5)}-${d.slice(5)}`
}

/** Telefone BR: aceita 10 (fixo) ou 11 (celular) dígitos.
 *  Formato fixo:    (00) 0000-0000
 *  Formato celular: (00) 00000-0000
 */
export function maskPhoneBR(value: string): string {
  const d = onlyDigits(value).slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/** Strip — útil pra mandar pro backend, que espera só dígitos. */
export function unmaskDigits(value: string): string {
  return onlyDigits(value)
}

/** 0000 0000 0000 0000 (cartão genérico, 16 dígitos). */
export function maskCardNumber(value: string): string {
  const d = onlyDigits(value).slice(0, 16)
  return d.replace(/(.{4})/g, '$1 ').trim()
}

/** MM/AA (validade de cartão). */
export function maskExpiry(value: string): string {
  const d = onlyDigits(value).slice(0, 4)
  if (d.length <= 2) return d
  return `${d.slice(0, 2)}/${d.slice(2)}`
}

/** Helper one-liner pra usar no onChange. */
export function withMask(masker: (v: string) => string) {
  return (e: { target: { value: string } }) => masker(e.target.value)
}
