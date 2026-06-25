// Sitemap legível — pública, sem RequireAuth. Útil pra SEO (Google indexa) e
// pra usuários novos saberem o que existe na plataforma. Rotas protegidas
// aparecem como "requer login" — não viram links.
import { Link } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'

interface Entry {
  path: string
  label: string
  desc: string
  protected: boolean
}

const PUBLIC: Entry[] = [
  { path: '/',         label: 'Home',              desc: 'Apresentação do programa, globo de parceiros, CTAs de cadastro e login.', protected: false },
  { path: '/login',    label: 'Login',             desc: 'Entre com e-mail/CPF + senha. 2FA opcional via SMS ou TOTP.',              protected: false },
  { path: '/cadastro', label: 'Cadastro',          desc: 'Crie sua conta — gratuito, sem mensalidade.',                              protected: false },
  { path: '/recuperar-senha', label: 'Recuperar senha', desc: 'Receba um link de redefinição no e-mail cadastrado.',                 protected: false },
  { path: '/status',   label: 'Status público',    desc: 'Saúde dos sistemas em tempo real.',                                        protected: false },
  { path: '/termos',   label: 'Termos & Privacidade', desc: 'Documentos legais vigentes.',                                            protected: false },
]

const PROTECTED: Entry[] = [
  { path: '/dashboard',  label: 'Dashboard',          desc: 'Visão geral: saldo, tier, BlaXx Score, transações recentes.',              protected: true },
  { path: '/carteira',   label: 'Carteira',           desc: 'Lista completa de transações com filtros.',                                protected: true },
  { path: '/cartao',     label: 'Cartão BlaXx',       desc: 'Seu cartão virtual + Apple/Google Wallet.',                                protected: true },
  { path: '/parceiros',  label: 'Marketplace',        desc: 'Lojas e marcas que acumulam pontos.',                                      protected: true },
  { path: '/resgates',   label: 'Resgates',           desc: 'Benefícios e vouchers disponíveis para troca.',                            protected: true },
  { path: '/comprar-pontos', label: 'Comprar pontos', desc: 'Recarregue via PIX.',                                                      protected: true },
  { path: '/enviar-pontos', label: 'Enviar pontos',  desc: 'Transferência P2P entre contas BlaXx (sem taxa).',                          protected: true },
  { path: '/vender-pontos', label: 'Resgatar em PIX', desc: 'Converta pontos em cashback no seu Pix.',                                  protected: true },
  { path: '/campanhas',  label: 'Campanhas',          desc: 'Missões e desafios com pontos bônus.',                                     protected: true },
  { path: '/indique',    label: 'Indique e ganhe',    desc: 'Convide amigos e ganhe 1.000 pts a cada cadastro.',                        protected: true },
  { path: '/conquistas', label: 'Conquistas',         desc: 'Catálogo de badges — marcos de uso, acúmulo e tier.',                       protected: true },
  { path: '/perfil',     label: 'Perfil',             desc: 'Dados pessoais e preferências.',                                           protected: true },
  { path: '/seguranca',  label: 'Segurança',          desc: '2FA, senha, sessões ativas, exportação LGPD.',                             protected: true },
  { path: '/central-notificacoes', label: 'Notificações', desc: 'Histórico de avisos do programa.',                                     protected: true },
  { path: '/relatorios', label: 'Relatórios',         desc: 'Resumos financeiros e exportações.',                                       protected: true },
]

export default function Sitemap() {
  return (
    <div className="blx-sitemap">
      <ThemeToggle />
      <header>
        <span className="blx-status__eyebrow">MAPA DO SITE</span>
        <h1>Tudo que existe no BlaXx</h1>
        <p>
          Páginas públicas estão abertas. As marcadas como “requer login” pedem cadastro
          (é gratuito, sem mensalidade).
        </p>
      </header>

      <section>
        <h2>Públicas</h2>
        <ul>
          {PUBLIC.map((e) => (
            <li key={e.path}>
              <Link to={e.path}>
                <strong>{e.label}</strong>
                <span>{e.desc}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Requer login</h2>
        <ul>
          {PROTECTED.map((e) => (
            <li key={e.path}>
              <div className="blx-sitemap__locked" aria-disabled>
                <strong>{e.label}</strong>
                <span>{e.desc}</span>
                <em>requer login</em>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <footer>
        <Link to="/">Voltar para a home</Link>
      </footer>
    </div>
  )
}
