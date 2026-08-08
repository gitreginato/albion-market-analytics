# Copilot Instructions: albion-market-analytics

## Visao geral
Dashboard full-stack para analise de mercado do Albion Online. Detecta oportunidades
de arbitragem, refinamento e Black Market consumindo a API publica do Albion Online
Data Project. Next.js 16 com Turbopack, TypeScript, better-sqlite3 para cache.

## Stack
- Next.js 16 (App Router, Turbopack) + TypeScript 5
- better-sqlite3 para cache persistente de scans e precos
- Zod para validacao de input em todas as rotas de API
- Vitest para testes (163 testes, 18 arquivos)
- ESLint para lint

## Convencoes
- Toda rota de API valida query params com schemas Zod tipados
- Logs estruturados (JSON) com latencia e status em cada endpoint
- Proxy server-side para APIs externas (evitar CORS, controlar cache)
- Allowlist para validacao de input, nunca denylist
- Rate-limit com retry e backoff exponencial em chamadas externas
- CSP headers configurados em next.config.ts

## NAO faca
- Nao consumir a API do Albion client-side (sempre server-side)
- Nao usar float para valores monetarios (usar integer em centavos ou Decimal)
- Nao remover CSP headers do next.config.ts
- Nao commitar .env ou database local
- Nao adicionar dependencias sem pinar versao exata
