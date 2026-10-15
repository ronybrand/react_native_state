# Security Policy

## Supported versions

This is a single-branch portfolio project (no maintained release lines): security fixes land on
`main` only. There is no LTS/backport policy.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for a suspected vulnerability. Instead, use
[GitHub's private vulnerability reporting](../../security/advisories/new) for this repository
(Security tab, "Report a vulnerability"), or contact the maintainer through the email on the
[GitHub profile](https://github.com/ronybrand).

Include, where applicable: a description and impact, steps to reproduce, and the affected screen
or module.

This project is maintained on a best-effort basis (no SLA), but reports are taken seriously.

## Scope

In scope: the application code in this repository and its CI/CD workflows.

Out of scope: the [`estado`](https://github.com/ronybrand/estado) API it talks to, covered by its
own policy. Dependency vulnerabilities are tracked automatically via Dependabot and CodeQL.

## What this app already does

- **Session token in the OS keychain** (`expo-secure-store`: iOS Keychain, Android Keystore), not
  in plain storage. It is mirrored in memory only because the HTTP layer needs it synchronously.
- **A stored token is validated at launch** (expired or malformed ones are dropped and deleted) and
  the session ends on time through a timer at the JWT's `exp`. The client-side `exp` decode is a UI
  hint only: the signature is never verified here, and the backend authorizes every request.
- **No secrets in the app bundle.** Expo inlines every `EXPO_PUBLIC_*` value, so the only such value
  (`EXPO_PUBLIC_API_URL`) is a public URL. The bearer token is attached only to requests aimed at
  the API's own base url, never to a look-alike host (`https://api.example.comevil.com`).
- **A failing keychain degrades to "logged out"** instead of crashing or leaking state; a failed
  write keeps the session in memory for that run only.
- **Route params are validated** before they reach the API (a deep link can put anything in `[id]`).
- **Request correlation ids** (`X-Request-Id`, a UUID from `expo-crypto`) are generated once per
  action; only a UUID echoed by the server is ever displayed.
- Automated dependency updates via Dependabot and static analysis on every push and pull request
  with [CodeQL](.github/workflows/codeql.yml).

## Known limits

- There is no certificate pinning: the app trusts the system certificate store.
- A rooted/jailbroken device can read the keychain. That is outside what an app can defend.
- Android release builds block cleartext HTTP by default and iOS enforces ATS; keep the API on
  `https`.
