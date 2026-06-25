// Router com code-split por rota — cada página vira chunk lazy, Vite
// gera os arquivos separados em build/. RouteSkeleton segura o slot
// enquanto o chunk baixa (boundaries em <Suspense>).
import { createBrowserRouter } from 'react-router-dom'
import { lazy, Suspense, type ComponentType } from 'react'
import Shell from './components/Shell'
import RequireAuth from './components/RequireAuth'
import RouteSkeleton from './components/RouteSkeleton'

// Helper: lazy + Suspense num único elemento. Mantém router config legível.
const L = (loader: () => Promise<{ default: ComponentType<any> }>) => {
  const C = lazy(loader)
  return (
    <Suspense fallback={<RouteSkeleton />}>
      <C />
    </Suspense>
  )
}

export const router = createBrowserRouter([
  { path: '/',                       element: L(() => import('./pages/Home')) },
  { path: '/login',                  element: L(() => import('./pages/Login')) },
  { path: '/cadastro',               element: L(() => import('./pages/Cadastro')) },
  { path: '/recuperar-senha',        element: L(() => import('./pages/RecuperarSenha')) },
  { path: '/redefinir-senha',        element: L(() => import('./pages/RedefinirSenha')) },
  // Aliases .html: o backend (compartilhado com o EXE Windows) envia o link
  // de reset como `/redefinir-senha.html?token=…` por consistência entre
  // plataformas. Sem estes aliases, o link de e-mail abria a 404 na web.
  { path: '/recuperar-senha.html',   element: L(() => import('./pages/RecuperarSenha')) },
  { path: '/redefinir-senha.html',   element: L(() => import('./pages/RedefinirSenha')) },
  { path: '/validacao',              element: L(() => import('./pages/Validacao')) },
  { path: '/termos',                 element: L(() => import('./pages/Termos')) },
  // Status público — sem auth, reflete /health do backend canônico.
  { path: '/status',                 element: L(() => import('./pages/Status')) },
  // Mapa do site — pública, ajuda SEO + descoberta.
  { path: '/sitemap',                element: L(() => import('./pages/Sitemap')) },
  // Admin: rota autenticada com layout próprio (fora do shell da sidebar).
  {
    path: '/admin',
    element: (
      <RequireAuth>
        {L(() => import('./pages/Admin'))}
      </RequireAuth>
    ),
  },
  {
    element: (
      <RequireAuth>
        <Shell />
      </RequireAuth>
    ),
    children: [
      { path: '/dashboard',            element: L(() => import('./pages/Dashboard')) },
      { path: '/carteira',             element: L(() => import('./pages/Carteira')) },
      { path: '/cartao',               element: L(() => import('./pages/CartaoBlaxx')) },
      { path: '/extrato',              element: L(() => import('./pages/Extrato')) },
      // Fluxo de compra
      { path: '/comprar-pontos',       element: L(() => import('./pages/ComprarPontos')) },
      { path: '/checkout',             element: L(() => import('./pages/Checkout')) },
      { path: '/pagamento-pix',        element: L(() => import('./pages/PagamentoPix')) },
      { path: '/compra-aprovada',      element: L(() => import('./pages/CompraAprovada')) },
      // Fluxo de envio P2P
      { path: '/enviar-pontos',        element: L(() => import('./pages/EnviarPontos')) },
      { path: '/confirmar-envio',      element: L(() => import('./pages/ConfirmarEnvio')) },
      { path: '/envio-concluido',      element: L(() => import('./pages/EnvioConcluido')) },
      { path: '/saldo-insuficiente',   element: L(() => import('./pages/SaldoInsuficiente')) },
      // Fluxo de resgate (cashback)
      { path: '/vender-pontos',        element: L(() => import('./pages/VenderPontos')) },
      { path: '/resgate-pix',          element: L(() => import('./pages/ResgatePix')) },
      { path: '/resgate-concluido',    element: L(() => import('./pages/ResgateConcluido')) },
      // Marketplace (parceiros / benefícios / vouchers)
      { path: '/parceiros',            element: L(() => import('./pages/Parceiros')) },
      { path: '/detalhe-parceiro',     element: L(() => import('./pages/DetalheParceiro')) },
      { path: '/detalhe-beneficio',    element: L(() => import('./pages/DetalheBeneficio')) },
      { path: '/detalhe-voucher',      element: L(() => import('./pages/DetalheVoucher')) },
      { path: '/resgates',             element: L(() => import('./pages/Resgates')) },
      // Mundo Blaxx (novos · showcase + dados reais onde existem)
      { path: '/exchange',             element: L(() => import('./pages/Exchange')) },
      { path: '/viagens',              element: L(() => import('./pages/Viagens')) },
      { path: '/relatorios',           element: L(() => import('./pages/Relatorios')) },
      { path: '/intelligence',         element: L(() => import('./pages/Intelligence')) },
      // Engajamento e compra livre
      { path: '/comprar-livre',        element: L(() => import('./pages/ComprarLivre')) },
      { path: '/campanhas',            element: L(() => import('./pages/Campanhas')) },
      { path: '/indique',              element: L(() => import('./pages/Indique')) },
      { path: '/conquistas',           element: L(() => import('./pages/Conquistas')) },
      // Conta / segurança
      { path: '/perfil',               element: L(() => import('./pages/Perfil')) },
      { path: '/seguranca',            element: L(() => import('./pages/Seguranca')) },
      { path: '/excluir-conta',        element: L(() => import('./pages/ExcluirConta')) },
      { path: '/central-notificacoes', element: L(() => import('./pages/CentralNotificacoes')) },
    ],
  },
  { path: '*',                         element: L(() => import('./pages/NotFound')) },
])
