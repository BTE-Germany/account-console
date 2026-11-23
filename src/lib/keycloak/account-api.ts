import { unstable_rethrow } from "next/navigation";
import { cache } from "react";
import { getSession } from "@/lib/auth";
import type {
    ApplicationRepresentation,
    CredentialContainer,
    DeviceRepresentation,
    OrganizationRepresentation,
    PersonalInfo,
} from "@/lib/keycloak/types";

/**
 * Server-side client for the Keycloak Account REST API
 * (`/realms/{realm}/account`), which is also what Keycloak's own account console (v26) uses.
 *
 * Every call is made with the signed-in user's access token. Keycloak therefore checks the
 * permissions (`manage-account`, `view-profile`, ...) and the user profile configuration
 * itself, so this console cannot do more than the user is allowed to do.
 *
 * Requirement: the access token has to contain the audience `account`. Keycloak's default
 * `roles` client scope adds it as long as the user holds roles of the `account` client
 * (default roles: `manage-account`, `view-profile`).
 */

export class AccountApiError extends Error {
    constructor(
        public readonly status: number,
        public readonly body: unknown,
        message?: string,
    ) {
        super(message ?? `Keycloak Account API antwortete mit HTTP ${status}`);
        this.name = "AccountApiError";
    }
}

type RequestOptions = {
    method?: "GET" | "POST" | "DELETE";
    body?: unknown;
    searchParams?: Record<string, string>;
};

const accountBaseUrl = () => {
    const issuer = process.env.KEYCLOAK_URL;
    if (!issuer) throw new Error("KEYCLOAK_URL ist nicht gesetzt.");
    return `${issuer.replace(/\/+$/, "")}/account`;
};

async function accountRequest(path: string, { method = "GET", body, searchParams }: RequestOptions = {}) {
    const session = await getSession();
    if (!session?.accessToken || session.error) {
        throw new AccountApiError(401, null, "Keine gültige Sitzung vorhanden.");
    }

    const url = new URL(accountBaseUrl() + path);
    Object.entries(searchParams ?? {}).forEach(([key, value]) => url.searchParams.set(key, value));

    const response = await fetch(url, {
        method,
        cache: "no-store",
        headers: {
            Authorization: `Bearer ${session.accessToken}`,
            Accept: "application/json",
            ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        let errorBody: unknown = null;
        try {
            errorBody = await response.json();
        } catch {
            // Keycloak does not always send a JSON body (e.g. 403/404).
        }
        throw new AccountApiError(response.status, errorBody);
    }

    return response;
}

async function getJson<T>(path: string, options?: RequestOptions): Promise<T> {
    const response = await accountRequest(path, options);
    return (await response.json()) as T;
}

export type Result<T> = { ok: true; data: T } | { ok: false; status: number };

/** Runs an Account API call and returns the HTTP status instead of throwing on API errors. */
export async function tryAccount<T>(call: () => Promise<T>): Promise<Result<T>> {
    try {
        return { ok: true, data: await call() };
    } catch (error) {
        // Let Next.js-internal control flow (dynamic rendering, redirect, notFound) through.
        unstable_rethrow(error);
        if (error instanceof AccountApiError) return { ok: false, status: error.status };
        console.error("Keycloak Account API Fehler", error);
        return { ok: false, status: 500 };
    }
}

// ---- Personal info ----------------------------------------------------------------------

/** Uncached – use when the data has to be fresh (e.g. inside server actions). */
export const loadPersonalInfo = () =>
    getJson<PersonalInfo>("/", { searchParams: { userProfileMetadata: "true" } });

export const getPersonalInfo = cache(loadPersonalInfo);

export const getSupportedLocales = cache(() => getJson<string[]>("/supportedLocales"));

export async function updatePersonalInfo(user: Omit<PersonalInfo, "userProfileMetadata">) {
    await accountRequest("/", { method: "POST", body: user });
}

// ---- Signing in -------------------------------------------------------------------------

export const getCredentials = cache(() => getJson<CredentialContainer[]>("/credentials"));

// ---- Device activity --------------------------------------------------------------------

export const getDevices = cache(() => getJson<DeviceRepresentation[]>("/sessions/devices"));

/** Signs out a single session, or – without id – all sessions (optionally including the current one). */
export async function deleteSessions(options: { id?: string; includeCurrent?: boolean } = {}) {
    if (options.id) {
        await accountRequest(`/sessions/${encodeURIComponent(options.id)}`, { method: "DELETE" });
        return;
    }
    await accountRequest("/sessions", {
        method: "DELETE",
        searchParams: options.includeCurrent ? { current: "true" } : undefined,
    });
}

// ---- Applications -----------------------------------------------------------------------

export const getApplications = cache(() => getJson<ApplicationRepresentation[]>("/applications"));

export async function deleteConsent(clientId: string) {
    await accountRequest(`/applications/${encodeURIComponent(clientId)}/consent`, { method: "DELETE" });
}

export async function deleteApplicationSessions(clientId: string) {
    await accountRequest(`/applications/${encodeURIComponent(clientId)}/sessions`, { method: "DELETE" });
}

// ---- Organizations ----------------------------------------------------------------------

export const getOrganizations = cache(() => getJson<OrganizationRepresentation[]>("/organizations"));
