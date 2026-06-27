# BlaXx Rewards — Apresentação para Investidores

> **Compre. Ganhe. Troque. Envie.**
> A plataforma brasileira que transforma pontos em Pix na hora, milhas, diárias de hotel e salas VIP.

- **Produto:** [www.blaxxpontos.com.br](https://www.blaxxpontos.com.br)
- **Mercado:** Brasil 🇧🇷 (programa de pontos / fidelidade / fintech)
- **Estágio:** Plataforma em produção — SPA React migrada do site legado
- **Data:** Junho/2026

---

## 1. Sumário Executivo

A **BlaXx Rewards** é um programa de pontos premium que unifica, num só lugar, os
maiores programas de milhas, redes de hotéis e clubes de salas VIP do Brasil e do
mundo. O diferencial central é a **liquidez imediata**: o usuário converte pontos em
**Pix instantâneo**, sem mensalidade e sem letra miúda.

Diferente de programas de fidelidade tradicionais — onde os pontos ficam presos a um
único parceiro e expiram — a BlaXx funciona como uma **camada de troca (exchange) de
valor**, permitindo acumular, multiplicar, enviar para outras pessoas (P2P) e resgatar
em dinheiro real ou em benefícios de viagem.

**Tração declarada na plataforma:** mais de **800 mil pessoas** já utilizam a BlaXx
para trocar seus pontos.

---

## 2. O Problema

- **Pontos presos e que expiram:** programas de fidelidade tradicionais prendem o
  cliente a um único parceiro, com regras opacas e validade curta.
- **Baixa liquidez:** é difícil transformar pontos em algo de uso imediato; raramente
  viram dinheiro.
- **Fragmentação:** o consumidor brasileiro acumula saldo espalhado em dezenas de
  programas (companhias aéreas, bancos, hotéis) sem visão unificada.
- **Falta de transparência:** "letra miúda", mensalidades e taxas escondidas corroem a
  confiança.

---

## 3. A Solução

A BlaXx oferece uma carteira única de pontos com **quatro verbos de valor**:

| Verbo | O que faz |
|-------|-----------|
| **Compre** | Acumule pontos comprando em parceiros ou comprando pontos diretamente |
| **Ganhe** | Multiplique com campanhas, indicações (indique & ganhe) e conquistas |
| **Troque** | Resgate em **Pix instantâneo**, milhas aéreas ou diárias de hotel |
| **Envie** | Transfira pontos para outra pessoa (P2P), como um Pix de pontos |

**Pilares de produto:**
- **Pix na hora** — liquidez real, o pontos vira dinheiro em minutos.
- **Sem mensalidade, sem letra miúda** — modelo transparente.
- **Mapa global de destinos** — hotéis e salas VIP mapeados sobre um globo interativo.
- **Simulador de valor** — o usuário vê em tempo real quanto seus pontos rendem em Pix,
  milhas e diárias.
- **Rede de parceiros** — milhas & pontos, redes de hotéis, salas VIP e bancos
  integrados num só lugar.

---

## 4. Como Funciona (Jornada do Usuário)

> **Quatro passos. Zero complicação.**

1. **Acumule** pontos no dia a dia, comprando em parceiros ou adquirindo pontos.
2. **Multiplique** com campanhas, indicações e conquistas (gamificação).
3. **Escolha** o destino: Pix, milhas, hotel, sala VIP ou enviar para alguém.
4. **Use** — resgate o primeiro Pix em minutos.

---

## 5. Produto & Funcionalidades

A plataforma já cobre o ciclo de vida completo do usuário (mais de 40 telas em
produção):

**Aquisição & Conta**
- Landing premium com globo interativo, simulador e prova social
- Cadastro com consentimento LGPD, recuperação e redefinição de senha
- Verificação de e-mail, segurança da conta e MFA

**Carteira & Transações**
- Dashboard com saldo, extrato e visão de carteira
- Cartão BlaXx
- Compra de pontos (fluxo de checkout + pagamento Pix)
- Resgate / cashback em Pix
- Envio de pontos P2P (enviar / confirmar / concluído)

**Marketplace & Mundo BlaXx**
- Parceiros, benefícios e vouchers
- Exchange (troca de pontos)
- Viagens, Relatórios e Intelligence (analytics do usuário)
- Campanhas, Indique & Ganhe, Conquistas (engajamento e gamificação)

**Administração**
- Painel admin com estatísticas (usuários, VIPs, volume 30d, saldo total em pontos)

---

## 6. Modelo de Negócio (Vetores de Receita)

A arquitetura do produto sugere múltiplos vetores de monetização:

- **Spread na conversão de pontos** — margem entre o valor de aquisição e o resgate em
  Pix/milhas.
- **Venda direta de pontos** — fluxo de compra de pontos integrado (checkout + Pix).
- **Comissão de parceiros** — take-rate sobre resgates no marketplace (hotéis, salas
  VIP, milhas).
- **Tier premium (PRO/VIP)** — usuários VIP e funcionalidades premium.
- **Float financeiro** — saldo de pontos em circulação (passivo) gera oportunidade de
  rendimento.

> *Os parâmetros de pricing/take-rate devem ser confirmados com o time financeiro — esta
> seção descreve os vetores habilitados pela plataforma, não números auditados.*

---

## 7. Mercado

- **TAM:** mercado brasileiro de fidelidade e cashback, em forte expansão impulsionado
  pelo Pix como trilho de pagamento instantâneo.
- **Tendência:** consumidor busca **liquidez e transparência** — exatamente a lacuna que
  os programas tradicionais não preenchem.
- **Posicionamento:** "o Pix dos seus pontos" — camada de exchange que conecta os
  programas existentes em vez de competir de frente com eles.

---

## 8. Diferenciais Competitivos

| Diferencial | Por que importa |
|-------------|-----------------|
| **Pix instantâneo** | Liquidez real, contra pontos que expiram |
| **Agregação multi-programa** | Milhas, hotéis e VIP num só lugar |
| **P2P de pontos** | Efeito de rede — pontos circulam entre pessoas |
| **Sem mensalidade** | Remove fricção de entrada |
| **Gamificação** | Campanhas, conquistas e indicações elevam retenção |
| **Transparência (LGPD-first)** | Consentimento explícito e confiança |

---

## 9. Tecnologia

Stack moderna, performática e de baixo custo de manutenção — pronta para escalar.

- **Frontend:** SPA em **React 18 + Vite 5 + TypeScript**, com Tailwind CSS e
  Framer Motion. Code-splitting por rota (cada tela é um chunk lazy), PWA (service
  worker, manifest, push web).
- **Visualização:** Chart.js e globo interativo em D3 + TopoJSON (vendorizado, zero
  dependência de CDN).
- **Backend:** API REST canônica compartilhada (a mesma fonte de verdade do app Windows),
  sessão com Bearer token, fluxos de pagamento Pix, MFA e painel admin.
- **Infra/Deploy:** **Netlify** (build Vite → `dist/`, Node 20 LTS), domínio
  `www.blaxxpontos.com.br`, CI com Lighthouse (performance/SEO monitorados).
- **Qualidade:** SEO completo (canonical, Open Graph, JSON-LD Schema.org), acessibilidade
  (prefers-reduced-motion), fontes self-hosted para LCP otimizado.

**Por que essa stack importa para o investidor:**
- Devs fáceis de contratar (ecossistema React).
- Deploy estático = custo de infra baixíssimo e escalável.
- Base de código tipada e testável, com hot-reload e bundle otimizado.

---

## 10. Tração & Prova Social

- **+800 mil pessoas** trocando pontos na plataforma (declarado em produto).
- Plataforma em produção, migração do site legado concluída.
- Cobertura funcional completa: aquisição → carteira → resgate → engajamento → admin.

> *Métricas de GMV, usuários ativos, retenção e volume de Pix devem ser anexadas a partir
> do painel admin (estatísticas de usuários, VIPs e volume dos últimos 30 dias já são
> coletadas pela plataforma).*

---

## 11. Roadmap

A plataforma evoluiu por sprints de migração (do site legado para a SPA React). Próximos
eixos sugeridos:

- **Crescimento:** ativação de novos parceiros (logos oficiais), expansão da rede de
  resgate.
- **Produto:** aprofundar Intelligence/Relatórios (analytics do usuário) e Exchange.
- **Monetização:** estruturar tiers PRO/VIP e take-rates de parceiros.
- **Confiabilidade:** página de status pública conectada ao `/health` do backend.
- **Mobile:** PWA já habilitado; avaliar apps nativos conforme tração.

---

## 12. O Pedido (Ask)

*Seção a ser preenchida pelos fundadores:*

- **Rodada:** _(valor / tipo — ex.: seed, Series A)_
- **Uso dos recursos:** aquisição de usuários, expansão de parceiros, time de produto.
- **Marcos:** metas de GMV, base ativa e novos vetores de receita.

---

## Apêndice — Glossário

- **Pix:** sistema de pagamento instantâneo do Banco Central do Brasil.
- **P2P:** *peer-to-peer* — envio de pontos entre usuários.
- **GMV:** *Gross Merchandise Value* — volume total transacionado.
- **Take-rate:** percentual de comissão retido pela plataforma por transação.
- **Float:** saldo em circulação que a plataforma mantém antes do resgate.

---

*Documento gerado a partir do código-fonte e dos conteúdos de produto do repositório
`blaxx-pontos-app`. Números marcados como "declarado/sugerido" requerem validação do time
de negócio antes de uso externo.*
