import KcAdminClient from '@keycloak/keycloak-admin-client';

let kcAdminClient: KcAdminClient | null = null;

export default async function getKcAdminClient(): Promise<KcAdminClient> {
    if (!kcAdminClient) {
        kcAdminClient = new KcAdminClient({
            baseUrl: process.env.KEYCLOAK_BASE_URL,
            realmName: process.env.KEYCLOAK_REALM
        });

        await kcAdminClient.auth({
            clientId: process.env.KEYCLOAK_CLIENT_ID || '',
            clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
            grantType: 'client_credentials',
        })
    }
    return kcAdminClient
}