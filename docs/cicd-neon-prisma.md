# Guia: Automação de Migrações Prisma com Neon (Dev/Prod)

## Contexto e Problema
Atualmente, o repositório usa as branchs `dev` e `prod` no **Neon Serverless Postgres** para separar os ambientes de desenvolvimento e produção.
No entanto, quando fazemos alterações na estrutura do banco de dados (por exemplo, adicionando a opção `MULTIPLA_ESCOLHA` no enum `QuestionType`), nós geramos a migração apenas na branch `dev` localmente.
Quando o código com a nova estrutura vai para a branch `prod` e é feito o deploy, **o banco de dados de produção do Neon não é atualizado automaticamente**. Isso causa erros em produção, pois o código espera uma estrutura (ex: um novo enum) que ainda não existe no banco de produção.

## O Que Deve Acontecer (Solução)
Precisamos configurar um processo de **CI/CD (Continuous Integration / Continuous Deployment)** que rode o comando de migração do Prisma (`npx prisma migrate deploy`) automaticamente sempre que houver um deploy.

O guia a seguir detalha como resolver isso dependendo da sua plataforma de hospedagem (assumindo Vercel, que é o padrão para Next.js).

---

### Passo a Passo para Vercel (Recomendado)

Se você hospeda a aplicação na Vercel, a resolução é muito simples e não exige GitHub Actions, bastando configurar os comandos de build e variáveis de ambiente.

#### 1. Ajustar o Comando de Build (Build Command)
Vá até o painel do seu projeto na Vercel: **Settings > General > Build & Development Settings**.
Altere o **Build Command** padrão (que normalmente é `next build`) para:
```bash
npx prisma generate && npx prisma migrate deploy && next build
```
**O que isso faz?**
- `prisma generate`: Gera o Prisma Client atualizado.
- `prisma migrate deploy`: Verifica a pasta `prisma/migrations` e aplica todas as migrações que ainda não foram aplicadas no banco de dados.
- `next build`: Faz o build normal da aplicação.

#### 2. Configurar as Variáveis de Ambiente (Environment Variables)
Vá em **Settings > Environment Variables** na Vercel. Você precisa garantir que a Vercel aponte para o banco de dados correto dependendo do ambiente.

- Adicione/Edite a variável `DATABASE_URL`:
  - Para o ambiente **Production**: Cole a URL de conexão do Neon apontando para a branch `prod`.
  - Para os ambientes **Preview / Development**: Cole a URL de conexão do Neon apontando para a branch `dev` (ou configure a integração oficial da Vercel + Neon para criar branchs automáticas por Pull Request).

---

### Passo a Passo para GitHub Actions (Alternativa)

Se você não usa a Vercel ou prefere gerenciar o deploy via GitHub Actions:

1. Vá nas configurações do Repositório no GitHub (**Settings > Secrets and variables > Actions**).
2. Adicione uma nova secret chamada `DATABASE_URL_PROD` contendo a string de conexão da branch `prod` do Neon.
3. Crie um arquivo no projeto em `.github/workflows/deploy.yml` com um step para rodar as migrações antes do build:

```yaml
name: Deploy and Migrate
on:
  push:
    branches:
      - prod
jobs:
  migrate-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install Dependencies
        run: npm ci
      - name: Run Prisma Migrations on Prod
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL_PROD }}
        run: npx prisma migrate deploy
      - name: Build and Deploy
        run: npm run build
        # (Aqui entra o restante do seu script de deploy)
```

## Resumo da Regra de Ouro
**Sempre** que o Prisma estiver envolvido, use `npx prisma migrate dev` localmente para criar o arquivo de migração (isso é versionado no Git), e garanta que o servidor de produção rode `npx prisma migrate deploy` usando a string de conexão do banco de produção.

