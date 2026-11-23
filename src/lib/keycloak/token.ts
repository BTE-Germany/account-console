import { getSession } from "@/lib/auth";

type AccessTokenClaims = {
    sid?: string;
    resource_access?: Record<string, { roles?: string[] }>;
};

/**
 * Reads the claims of the current access token without verifying it. Only use this to decide
 * what to show in the UI – Keycloak checks every request with the token again.
 */
export async function getAccessTokenClaims(): Promise<AccessTokenClaims | null> {
    const session = await getSession();
    const payload = session?.accessToken?.split(".")[1];
    if (!payload) return null;
    try {
        return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AccessTokenClaims;
    } catch {
        return null;
    }
}

/** Roles of the user on Keycloak's built-in `account` client (e.g. `manage-account`, `delete-account`). */
export async function getAccountClientRoles(): Promise<string[]> {
    const claims = await getAccessTokenClaims();
    return claims?.resource_access?.account?.roles ?? [];
}
