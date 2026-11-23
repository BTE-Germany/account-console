import KcAdminClient from '@keycloak/keycloak-admin-client';

/**
 * Since Keycloak 26.8.2 the Admin REST API only accepts tokens that carry the `kc-admin-api`
 * scope (audience check, RFC 9700). The scope has to be assigned to the client (preferably as
 * an *optional* client scope, so user tokens of this client do not get admin access).
 * Override with KEYCLOAK_ADMIN_SCOPES (space separated, empty to disable).
 */
const ADMIN_SCOPES = (process.env.KEYCLOAK_ADMIN_SCOPES ?? 'kc-admin-api').split(' ').filter(Boolean);

let kcAdminClient: KcAdminClient | null = null;
let warnedAboutMissingScope = false;

export default async function getKcAdminClient(): Promise<KcAdminClient> {
    if (!kcAdminClient) {
        kcAdminClient = new KcAdminClient({
            baseUrl: process.env.KEYCLOAK_BASE_URL,
            realmName: process.env.KEYCLOAK_REALM
        });
    }

    const credentials = {
        clientId: process.env.KEYCLOAK_CLIENT_ID || '',
        clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
        grantType: 'client_credentials' as const,
    };

    try {
        await kcAdminClient.auth({ ...credentials, ...(ADMIN_SCOPES.length ? { scopes: ADMIN_SCOPES } : {}) });
    } catch (error) {
        if (!ADMIN_SCOPES.length) throw error;
        // Older Keycloak versions (< 26.8.2) or clients without the scope reject the request
        // with "invalid_scope". Fall back to a token without the scope.
        if (!warnedAboutMissingScope) {
            warnedAboutMissingScope = true;
            console.warn(
                `Keycloak lehnt den Scope "${ADMIN_SCOPES.join(' ')}" ab. Ab Keycloak 26.8.2 muss der Client-Scope ` +
                `"kc-admin-api" dem Client "${credentials.clientId}" zugewiesen sein, sonst antwortet die Admin-API mit 401.`,
                error,
            );
        }
        await kcAdminClient.auth(credentials);
    }
    return kcAdminClient
}
