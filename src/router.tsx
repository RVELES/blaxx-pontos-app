import { createBrowserRouter } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import RecuperarSenha from './pages/RecuperarSenha'
import RedefinirSenha from './pages/RedefinirSenha'
import Validacao from './pages/Validacao'
import Termos from './pages/Termos'
import Dashboard from './pages/Dashboard'
import Carteira from './pages/Carteira'
import CartaoBlaxx from './pages/CartaoBlaxx'
import Extrato from './pages/Extrato'
import ComprarPontos from './pages/ComprarPontos'
import Checkout from './pages/Checkout'
import PagamentoPix from './pages/PagamentoPix'
import CompraAprovada from './pages/CompraAprovada'
import EnviarPontos from './pages/EnviarPontos'
import ConfirmarEnvio from './pages/ConfirmarEnvio'
import EnvioConcluido from './pages/EnvioConcluido'
import VenderPontos from './pages/VenderPontos'
import ResgatePix from './pages/ResgatePix'
import ResgateConcluido from './pages/ResgateConcluido'
import SaldoInsuficiente from './pages/SaldoInsuficiente'
import Parceiros from './pages/Parceiros'
import DetalheParceiro from './pages/DetalheParceiro'
import DetalheBeneficio from './pages/DetalheBeneficio'
import DetalheVoucher from './pages/DetalheVoucher'
import Resgates from './pages/Resgates'
import ComprarLivre from './pages/ComprarLivre'
import Campanhas from './pages/Campanhas'
import Indique from './pages/Indique'
import Exchange from './pages/Exchange'
import Viagens from './pages/Viagens'
import Relatorios from './pages/Relatorios'
import Intelligence from './pages/Intelligence'
import Perfil from './pages/Perfil'
import Seguranca from './pages/Seguranca'
import ExcluirConta from './pages/ExcluirConta'
import CentralNotificacoes from './pages/CentralNotificacoes'
import Admin from './pages/Admin'
import NotFound from './pages/NotFound'
import Shell from './components/Shell'
import RequireAuth from './components/RequireAuth'

export const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/login', element: <Login /> },
  { path: '/cadastro', element: <Cadastro /> },
  { path: '/recuperar-senha', element: <RecuperarSenha /> },
  { path: '/redefinir-senha', element: <RedefinirSenha /> },
  // Aliases .html: o backend (compartilhado com o EXE Windows) envia o link
  // de reset como `/redefinir-senha.html?token=…` por consistência entre
  // plataformas. Sem estes aliases, o link de e-mail abria a 404 na web.
  { path: '/recuperar-senha.html', element: <RecuperarSenha /> },
  { path: '/redefinir-senha.html', element: <RedefinirSenha /> },
  { path: '/validacao', element: <Validacao /> },
  { path: '/termos', element: <Termos /> },
  // Admin: rota autenticada com layout próprio (fora do shell da sidebar).
  {
    path: '/admin',
    element: (
      <RequireAuth>
        <Admin />
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
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/carteira', element: <Carteira /> },
      { path: '/cartao', element: <CartaoBlaxx /> },
      { path: '/extrato', element: <Extrato /> },
      // Fluxo de compra
      { path: '/comprar-pontos', element: <ComprarPontos /> },
      { path: '/checkout', element: <Checkout /> },
      { path: '/pagamento-pix', element: <PagamentoPix /> },
      { path: '/compra-aprovada', element: <CompraAprovada /> },
      // Fluxo de envio P2P
      { path: '/enviar-pontos', element: <EnviarPontos /> },
      { path: '/confirmar-envio', element: <ConfirmarEnvio /> },
      { path: '/envio-concluido', element: <EnvioConcluido /> },
      { path: '/saldo-insuficiente', element: <SaldoInsuficiente /> },
      // Fluxo de resgate (cashback)
      { path: '/vender-pontos', element: <VenderPontos /> },
      { path: '/resgate-pix', element: <ResgatePix /> },
      { path: '/resgate-concluido', element: <ResgateConcluido /> },
      // Marketplace (parceiros / benefícios / vouchers)
      { path: '/parceiros', element: <Parceiros /> },
      { path: '/detalhe-parceiro', element: <DetalheParceiro /> },
      { path: '/detalhe-beneficio', element: <DetalheBeneficio /> },
      { path: '/detalhe-voucher', element: <DetalheVoucher /> },
      { path: '/resgates', element: <Resgates /> },
      // Mundo Blaxx (novos · showcase + dados reais onde existem)
      { path: '/exchange', element: <Exchange /> },
      { path: '/viagens', element: <Viagens /> },
      { path: '/relatorios', element: <Relatorios /> },
      { path: '/intelligence', element: <Intelligence /> },
      // Engajamento e compra livre
      { path: '/comprar-livre', element: <ComprarLivre /> },
      { path: '/campanhas', element: <Campanhas /> },
      { path: '/indique', element: <Indique /> },
      // Conta / segurança
      { path: '/perfil', element: <Perfil /> },
      { path: '/seguranca', element: <Seguranca /> },
      { path: '/excluir-conta', element: <ExcluirConta /> },
      { path: '/central-notificacoes', element: <CentralNotificacoes /> },
    ],
  },
  { path: '*', element: <NotFound /> },
])
