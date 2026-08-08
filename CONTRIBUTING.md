# Contributing

Obrigado pelo interesse em contribuir.

## Antes de começar

1. Verifique se não há uma issue aberta para o que você quer fazer.
2. Abra uma issue descrevendo a mudança proposta antes de começar a codar (para mudanças grandes).

## Fluxo

1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/nome-da-feature`
3. Faça commits seguindo [Conventional Commits](https://www.conventionalcommits.org/)
4. Garanta que os testes passam: `npm run test && npm run lint`
5. Abra um Pull Request com descrição do que mudou e por quê

## Padrões

- **Commits**: Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`)
- **Código**: TypeScript estrito, sem `any` sem justificativa
- **Testes**: toda nova feature ou bugfix deve incluir teste
- **Dependências**: não adicionar sem justificativa. Preferir o que já está no projeto.

## Rodando localmente

```bash
npm install
npm run dev
```

Requer Node.js >= 18.
