/**
 * Translations from Keycloak itself.
 *
 * Keycloak serves the account theme messages – including the realm's own localization
 * overrides (e.g. `profile.attributes.minecraft_uuid`) – at the public endpoint
 * `/resources/{realm}/account/{locale}`. Keycloak's account console uses the same endpoint.
 * We only fall back to it for texts the console does not translate itself
 * (user profile labels, validation errors, credential info texts, ...).
 */

export type Messages = Record<string, string>;

const resourcesUrl = (locale: string) => {
    const issuer = process.env.KEYCLOAK_URL ?? "";
    const index = issuer.indexOf("/realms/");
    if (index === -1) return null;
    const base = issuer.slice(0, index);
    const realm = issuer.slice(index + "/realms/".length).split("/")[0];
    return `${base}/resources/${encodeURIComponent(realm)}/account/${encodeURIComponent(locale)}`;
};

export async function getKeycloakMessages(locale = "de"): Promise<Messages> {
    const url = resourcesUrl(locale);
    if (!url) return {};
    try {
        const response = await fetch(url, { next: { revalidate: 3600 } });
        if (!response.ok) return {};
        const entries = (await response.json()) as { key: string; value: string }[];
        return Object.fromEntries(entries.map(({ key, value }) => [key, value]));
    } catch (error) {
        console.error("Keycloak-Übersetzungen konnten nicht geladen werden", error);
        return {};
    }
}

const BUNDLE_KEY = /^\$\{(.+)\}$/;

/** Returns the key of a `${key}` reference, or null if the text is a literal. */
export const unwrapBundleKey = (text: string) => BUNDLE_KEY.exec(text)?.[1] ?? null;

/**
 * Translates a Keycloak message key (or `${key}` reference). Literal texts are returned as is.
 * Placeholders `{{0}}` / `{0}` are replaced, `<0>…</0>` markup is removed.
 */
export function translate(
    messages: Messages,
    keyOrText: string | undefined,
    params: (string | number)[] = [],
    fallback?: string,
): string {
    if (!keyOrText) return fallback ?? "";
    const key = unwrapBundleKey(keyOrText) ?? keyOrText;
    let text = messages[key] ?? fallback ?? key;
    params.forEach((param, index) => {
        text = text.replaceAll(`{{${index}}}`, String(param)).replaceAll(`{${index}}`, String(param));
    });
    return text.replace(/<\/?\d+>/g, "");
}
