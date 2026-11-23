import { signIn } from "next-auth/react";

/**
 * Starts a Keycloak "application initiated action" (AIA) – the same mechanism Keycloak's own
 * account console uses for setting up, changing and deleting credentials, linking accounts,
 * changing the email address and deleting the account.
 *
 * Keycloak shows the action in the login theme, then redirects back through the regular
 * OAuth flow, so the session afterwards contains fresh tokens.
 *
 * Examples: `UPDATE_PASSWORD`, `CONFIGURE_TOTP`, `webauthn-register-passwordless`,
 * `CONFIGURE_RECOVERY_AUTHN_CODES`, `delete_credential:<id>`, `idp_link:<alias>`,
 * `UPDATE_EMAIL`, `delete_account`.
 *
 * Client components only.
 */
export function startKeycloakAction(action: string, returnTo?: string) {
    const callbackUrl = returnTo ?? `${window.location.pathname}${window.location.search}`;
    return signIn("keycloak", { callbackUrl }, { kc_action: action });
}
