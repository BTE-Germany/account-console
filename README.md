# BTE Germany Account Console

Die Account Console ist die Selbstverwaltung für Konten von [BuildTheEarth Germany](https://bte-germany.de). Hier verwalten Mitglieder ihr Profil, ihre Anmeldemethoden, Sitzungen, verbundene Konten (Minecraft, Discord, …) und den Plus Rang.

Die App ersetzt die eingebaute Account Console von Keycloak und spricht dafür dieselbe [Account REST API](https://www.keycloak.org/docs/latest/server_development/) an. Sie ist mit **Keycloak 26.8** getestet.

## Funktionen

| Bereich | Route | Umsetzung |
|---|---|---|
| Profildaten | `/` | Formular aus der User-Profile-Konfiguration des Realms (eigene Attribute, Feldgruppen, Auswahllisten, Sprache, Validierung durch Keycloak). E-Mail-Änderung und Kontolöschung über Keycloak-Aktionen. |
| Anmeldung & Sicherheit | `/security` | Passwort, Authenticator-App (OTP), Passkeys und Wiederherstellungscodes einrichten, ändern und löschen. Welche Arten angezeigt werden, entscheidet Keycloak. |
| Geräteaktivität | `/devices` | Aktive Sitzungen je Gerät; einzelne Sitzungen oder alle Geräte abmelden. |
| Verbundene Konten | `/links` | Identity Provider (z. B. Discord) und Minecraft verknüpfen oder trennen. |
| Anwendungen | `/applications` | Erteilte Berechtigungen ansehen und entziehen, Sitzungen einer Anwendung beenden. |
| Organisationen | `/organizations` | Nur sichtbar, wenn der Benutzer einer Keycloak-Organisation angehört. |
| Plus Rang | `/plus` | Abo über Stripe; der Rang wird mit Keycloak, Discord und LuckPerms abgeglichen. |

## Architektur

- **Next.js 16** (App Router, Server Components, Server Actions), React 19, Tailwind CSS 4 und shadcn/ui.
- **Anmeldung:** NextAuth (v4) mit dem Keycloak-Provider. Das Access Token liegt in der NextAuth-Session und wird automatisch erneuert (`src/lib/auth.ts`).
- **Account REST API** (`src/lib/keycloak/account-api.ts`): Alle Profil- und Sicherheitsfunktionen laufen serverseitig mit dem Token des Benutzers. Keycloak prüft also selbst Berechtigungen, Validierung und Realm-Einstellungen.
- **Keycloak-Aktionen** (`src/lib/keycloak/required-action.ts`): Einrichten und Löschen von Anmeldemethoden, Konten verknüpfen, E-Mail ändern und Konto löschen laufen als *Application Initiated Actions* (`kc_action`) über das Login-Theme, genau wie in der Keycloak-eigenen Konsole.
- **Admin REST API** (`src/lib/kcAdmin.ts`): Nur für das, was die Account API nicht kann – Minecraft-Verknüpfung, Rank-Sync, Stripe-Webhook und den Versand der Bestätigungs-E-Mail. Sie nutzt den Service Account des Clients.
- **Übersetzungen:** Texte, die die Console nicht selbst mitbringt (Attributnamen, Validierungsfehler), lädt sie aus Keycloak (`/resources/{realm}/account/de`), inklusive der Realm-Übersetzungen.

```
src/
├── app/
│   ├── (dashboard)/      Seiten der Console (je Bereich ein Ordner mit page.tsx / actions.ts)
│   ├── api/auth/         NextAuth
│   ├── api/stripe/       Stripe-Webhook
│   └── auth/signin/      Weiterleitung zum Keycloak-Login
├── components/
│   ├── dashboard/        Komponenten der einzelnen Bereiche
│   └── ui/               shadcn/ui
└── lib/
    ├── keycloak/         Account API, Typen, Übersetzungen, User Profile, Keycloak-Aktionen
    ├── auth.ts           NextAuth-Konfiguration
    ├── kcAdmin.ts        Admin-Client
    └── rankSync.ts       Abgleich des Plus Rangs (Keycloak, Discord, LuckPerms)
```

## Entwicklung

Voraussetzungen: Node.js 22 und pnpm (die Version ist in `package.json` festgelegt, `corepack enable` reicht).

```bash
pnpm install
# .env mit den Variablen aus „Konfiguration“ anlegen
pnpm dev     # http://localhost:3000
```

| Befehl | Zweck |
|---|---|
| `pnpm dev` | Entwicklungsserver (Turbopack) |
| `pnpm build` | Produktions-Build |
| `pnpm start` | Produktions-Build starten |
| `pnpm exec tsc --noEmit` | Typprüfung |

## Konfiguration

Alle Einstellungen kommen aus Umgebungsvariablen (lokal aus `.env`).

### Keycloak & Anmeldung

| Variable | Beispiel | Beschreibung |
|---|---|---|
| `KEYCLOAK_URL` | `https://auth.bte-germany.de/realms/btegermany` | Issuer-URL des Realms. Daraus werden auch die Account API und die Übersetzungen abgeleitet. |
| `KEYCLOAK_BASE_URL` | `https://auth.bte-germany.de` | Basis-URL für die Admin API |
| `KEYCLOAK_REALM` | `btegermany` | Realm für die Admin API |
| `KEYCLOAK_CLIENT_ID` | `bte-account-console` | Client der Console |
| `KEYCLOAK_CLIENT_SECRET` | | Client Secret |
| `KEYCLOAK_ADMIN_SCOPES` | `kc-admin-api` | Optional. Scopes, die der Admin-Client anfordert (Standard: `kc-admin-api`, leer zum Abschalten) |
| `NEXTAUTH_URL` | `https://account.bte-germany.de` | Öffentliche URL der Console |
| `NEXTAUTH_SECRET` | | Zufälliger Schlüssel für die Session-Cookies (`openssl rand -base64 32`) |

### Plus Rang, Stripe, Discord, Minecraft

| Variable | Beschreibung |
|---|---|
| `STRIPE_SECRET` | Stripe Secret Key |
| `STRIPE_WEBHOOK_SECRET` | Signatur-Secret des Webhooks `/api/stripe/webhook` |
| `PLUS_MONTHLY_PRICE_ID`, `PLUS_YEARLY_PRICE_ID` | Stripe-Preise für das Plus-Abo |
| `KEYCLOAK_PLUS_ROLE_ID` | Keycloak-Rolle für Plus-Mitglieder |
| `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID`, `DISCORD_PLUS_ROLE_ID` | Discord-Bot, Server und Plus-Rolle |
| `LP_API_URL`, `LP_API_KEY` | LuckPerms REST API für den Rang auf dem Minecraft-Server |
| `MC_LINK_SECRET` | Secret, mit dem der Minecraft-Server die Tokens für `/link/minecraft?token=…` signiert (`/accountlink`) |

## Keycloak einrichten

Der Client `bte-account-console` braucht:

1. **Client authentication** an (vertraulicher Client) mit *Standard Flow* und der Redirect-URI `<NEXTAUTH_URL>/*`.
2. **Service Account** an, mit den `realm-management`-Rollen `view-users`, `manage-users`, `view-identity-providers` und `view-realm`.
3. **Client-Scope `kc-admin-api` als *Optional*.** Seit Keycloak 26.8.2 nimmt die Admin API nur noch Tokens mit diesem Scope an, sonst antwortet sie mit `401`. *Optional* statt *Default*, damit die Login-Tokens der Benutzer keinen Zugriff auf die Admin API bekommen – die Console fordert den Scope nur für den Service Account an.

Für die Benutzer:

- Die Standardrollen `manage-account` und `view-profile` des `account`-Clients müssen vergeben sein. Dadurch enthält das Access Token die Audience `account`, die die Account API verlangt.
- **Konto löschen** erscheint nur, wenn die Required Action `delete_account` aktiviert ist und der Benutzer die Rolle `delete-account` hat.
- **E-Mail ändern über Keycloak** erscheint, wenn die Required Action `UPDATE_EMAIL` aktiv ist. Sonst ist die E-Mail direkt im Profil änderbar.
- **Benutzername ändern** ist nur möglich, wenn im Realm *Edit username* aktiviert ist.
- Welche Profilfelder angezeigt und bearbeitet werden dürfen, steuert das **User Profile** des Realms. Das Attribut `minecraft_uuid` blendet die Console im Profil aus; es wird über *Verbundene Konten* verwaltet.
- Die Keycloak-Seiten (Login, Aktionen) kommen aus dem Login-Theme [BTE-Germany/kc-theme](https://github.com/BTE-Germany/kc-theme).

## Deployment

Jeder Push auf `master` baut über GitHub Actions ein Docker-Image und veröffentlicht es in der GitHub Container Registry:

```
ghcr.io/bte-germany/account-console:latest
ghcr.io/bte-germany/account-console:sha-<commit>
ghcr.io/bte-germany/account-console:v1.2.3   # bei Git-Tags v*.*.*
```

Das Image wird mit cosign signiert. Pull Requests bauen das Image nur, ohne es zu veröffentlichen. Die Console läuft im Container auf Port `3000` und erwartet die Umgebungsvariablen von oben.

```bash
docker run -p 3000:3000 --env-file .env ghcr.io/bte-germany/account-console:latest
```

Commits mit `[skip ci]` in der Nachricht lösen keinen Build aus.
