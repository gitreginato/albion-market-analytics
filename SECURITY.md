# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest  | sim       |

## Reporting a Vulnerability

Se você encontrar uma vulnerabilidade de segurança, **não abra uma issue pública**.

Envie um email para [inserir-email] com:

1. Descrição da vulnerabilidade
2. Passos para reproduzir
3. Impacto estimado
4. Sugestão de correção (se houver)

Você receberá uma resposta em até 72 horas.

## Security Measures

Este projeto implementa:

- **Validação de input**: todos os query params das rotas de API são validados com Zod (allowlist, não denylist).
- **Rate limiting**: o cliente da API Albion implementa rate-limit e retry com backoff.
- **Server-side proxy**: a API pública é consumida server-side para evitar exposição de CORS e controlar cache.
- **SQLite local**: dados sensíveis de sessão não são armazenados no banco local.
- **Sem chaves de API**: o projeto usa a API keyless do Albion Online Data Project.
- **HTML escaping**: todo conteúdo dinâmico renderizado na UI é escapado pelo React por padrão.

## Dependencies

Todas as dependências são pinadas em `package-lock.json`. Rodar `npm audit` regularmente.
