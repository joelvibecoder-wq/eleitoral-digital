# Eleitoral Digital — demonstração v1.3

Projeto educacional de **simulação eleitoral**, com candidatos, eleitores, urnas e resultados inteiramente fictícios. Não é um sistema oficial e não deve ser usado em eleições reais.

## Deploy no Netlify

- Build command: `npm run build`
- Publish directory: `public`
- Functions directory: `netlify/functions`

A configuração está em `netlify.toml`. Requer Node.js 20 ou superior. Para testar localmente: `npm install` e `npx netlify dev`.

## Limites importantes

O bloqueio de repetição é por sessão do navegador, não verifica a identidade de uma pessoa. Apagar cookies ou usar outro navegador cria outra sessão. Não insira CPF, telefone, e-mail real ou outros dados pessoais. Todos os dados exibidos são demonstrativos.

## Integração Firebase (em preparação)

O app Web usa Firebase Authentication (e-mail/senha) para cadastro/login e Cloud Firestore para perfil de usuário e voto demonstrativo. A configuração fica em `public/firebase-app.js` e contém somente identificadores públicos do app, nunca credenciais de conta de serviço.

### Antes de testar

1. No Firebase Console, abra **Authentication → Método de login** e habilite **E-mail/senha**.
2. Compare a configuração em `public/firebase-app.js` com os dados exatos do app Web no Console. Se `apiKey` ou `appId` diferirem, corrija-os.
3. Publique as regras de `firestore.rules` no Cloud Firestore (aba Regras) ou com Firebase CLI e o arquivo `firebase.json`.
4. Teste usando contas e dados fictícios. Não use este protótipo em eleições reais nem colete CPF, telefone ou dados sensíveis.

O voto é guardado por UID para impedir um segundo envio pelo mesmo usuário autenticado nesta demonstração. Isso não é uma solução eleitoral auditada. A gestão de eleições, candidatos e propostas requer backend confiável; as regras atuais deixam essas coleções somente para leitura.
