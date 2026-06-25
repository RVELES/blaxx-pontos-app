// Fallback genérico mostrado entre o clique numa rota lazy e o chunk chegar.
// Visual sutil pra manter a "memória do layout" — evita flash de tela vazia.
// Usado em <Suspense fallback> tanto nas rotas públicas quanto dentro do Shell.
import './route-skeleton.css'

export default function RouteSkeleton() {
  return (
    <div className="blx-skel" role="status" aria-label="Carregando">
      <div className="blx-skel__bar blx-skel__bar--eyebrow" />
      <div className="blx-skel__bar blx-skel__bar--title" />
      <div className="blx-skel__grid">
        <div className="blx-skel__card" />
        <div className="blx-skel__card" />
        <div className="blx-skel__card" />
      </div>
      <div className="blx-skel__bar blx-skel__bar--row" />
      <div className="blx-skel__bar blx-skel__bar--row" />
      <div className="blx-skel__bar blx-skel__bar--row blx-skel__bar--short" />
      <span className="blx-skel__sr">Carregando…</span>
    </div>
  )
}
