# Arquitetura técnica: react_native_state

Cliente React Native (Expo) do CRUD de unidades federativas (estados), sobre a API do projeto `estado`. Mesmo comportamento do `android_state` e do `flutter_state`.

## 1. Stack

Expo SDK 57, React Native 0.86, React 19, TypeScript estrito, Expo Router (rotas por arquivos em `src/app`), TanStack Query (estado do servidor), Axios (rede), react-hook-form com Zod (formulários), expo-secure-store (token).

## 2. Estrutura

```
src/
  app/         rotas do Expo Router; o grupo (protected) exige sessão
  auth/        sessão, token, expiração
  components/  componentes visuais
  hooks/       hooks de dados e de tela
  ...          cliente HTTP, validação, utilidades
```

## 3. Estado e navegação

O servidor é a fonte de verdade e o TanStack Query a cacheia: listas e detalhes são queries, criar, editar e excluir são mutations que invalidam o cache. O estado local fica em hooks e nos formulários. O grupo `(protected)` redireciona para o login quando não há sessão, e o fim da sessão (401 ou expiração) volta o usuário ao login.

## 4. Rede

Interceptors do Axios: `X-Request-Id` (preservado entre tentativas), `Authorization: Bearer`, retry de GET com backoff e tratamento de 401 que encerra a sessão uma vez. Erros chegam à UI com mensagem e `request_id`. O Zod define os esquemas de entrada, com as mesmas mensagens do back-end, e o react-hook-form os usa por resolver.

## 5. Segurança

Token no `expo-secure-store` (Keystore/Keychain). Actions fixadas por SHA. CodeQL para TypeScript. Sem SBOM.

## 6. Testes

- Cerca de 180 testes com Jest (jest-expo) e React Native Testing Library 14, consultando por papel, rótulo e estado de acessibilidade (por exemplo `accessibilityState.selected` nos chips).
- Piso de cobertura: 90% em linhas, funções e instruções e 85% em branches, o único gate de branches dos três apps.
- **E2E**: 3 fluxos Maestro 3 em emulador Android no CI (`e2e-android.yml`).
- Sem verificação automática de tamanho de alvo ou contraste.

## 7. Qualidade

TypeScript estrito, ESLint, Prettier e Husky no pré-commit.

## 8. Pendências

SBOM, checagens automáticas de acessibilidade, chave de upload e ficha de loja, assinatura iOS.

## 9. Trade-offs

| Escolha            | Ganho                                                               | Custo                                    |
| ------------------ | ------------------------------------------------------------------- | ---------------------------------------- |
| Expo               | build e atualização simplificados, uma base para Android, iOS e web | menos controle sobre código nativo       |
| TanStack Query     | cache e invalidação prontos                                         | outro modelo mental além do estado local |
| Rotas por arquivos | estrutura legível                                                   | convenções do Expo Router a respeitar    |
| Zod para validar   | esquemas reutilizáveis e tipados                                    | duplica as regras do back-end no cliente |
