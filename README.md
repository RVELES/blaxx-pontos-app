# Blaxx Pontos SPA · Sprint 5 skeleton

Substitui o site Netlify (`blaxx/` com 75 HTMLs + 3300 linhas de
`blaxx-app.js`) por uma SPA React + Vite + Tailwind, com codigo
ergonomico, testavel, com hot reload e bundle otimizado.

## Status

**Skeleton apenas** — 4 paginas mostrando o caminho.

- Home, Login, Dashboard, NotFound funcionando
- Roteamento react-router-dom
- `api()` helper igual ao do `blaxx-app.js` mas com types
- Tailwind config com palette Blaxx (#080907, #7CFF00, #F6F8F2)
- Vendor chunk separado (cache-friendly)

## Run

```bash
cd blaxx-spa
npm install
npm run dev   # http://localhost:8080
```

## Build

```bash
npm run build
# dist/ pronto pra Netlify deploy. Configurar netlify.toml com:
#   [build]
#     command = "npm run build"
#     publish = "dist"
```

## Roadmap migração do site antigo

| Sprint | Foco | Telas |
|---|---|---|
| 5.0 (skeleton) | Setup | Home, Login, Dashboard, NotFound |
| 5.1 | Auth + LGPD | Cadastro (3 checkboxes), recuperar, validacao, redefinir, seguranca |
| 5.2 | Wallet core | Dashboard real, carteira, extrato, comprar-pontos, comprar-livre |
| 5.3 | Resgates | resgates, beneficio-detalhe, confirmar-resgate, meus-resgates, resgate-pix |
| 5.4 | Parceiros + Campanhas | parceiros, parceiro-detalhe, campanhas, campanha-detalhe |
| 5.5 | Social | enviar-pontos, indique-ganhe |
| 5.6 | Suporte | central-ajuda, abrir-chamado, meus-chamados |
| 5.7 | Perfil + Admin | perfil, seguranca, excluir-conta + dashboard admin |

Cada sprint 5.x = 1-2 semanas. Total ~3 meses pra migrar 100%.

## Por que React + Vite + Tailwind?

- **React**: ecossistema gigante, devs faceis de contratar, types completos
- **Vite**: dev start em <1s, build com Rollup optimizado, HMR perfeito
- **Tailwind**: ja usamos design tokens (lime, ink, bg), sem CSS-in-JS
  overhead

Alternativas consideradas: Astro (overkill pra SPA), SvelteKit (curva
adicional), Next.js (RSC nao ajuda no caso, e Netlify e' deploy estatico).

## Migracao do design system

O `assets/styles.css` (2386 linhas) tem boas decisoes — vamos copiar
custom properties pra `tailwind.config.js` extend.theme e implementar
componentes (Button, Card, Input) como React components.

## Decisoes pendentes

- **State manager**: `zustand` (escolhido — leve) vs Context API
- **Forms**: `react-hook-form` + `zod` (proxima sprint)
- **i18n**: pt-BR only por enquanto, ja preparar com `react-intl` se virar global
- **Analytics**: respeitar `window.blaxxConsent('analytics')` do cookie banner

## Como integrar com backend novo (S5-1)

Configurar VITE_API_BASE no `.env.production` apontando pro Render do
backend. CORS ja esta aberto pra `blaxxpontos.netlify.app` e dominios
relacionados (S3-5).
