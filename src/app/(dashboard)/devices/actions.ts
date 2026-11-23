"use server"

import { revalidatePath } from "next/cache";
import { deleteSessions } from "@/lib/keycloak/account-api";

export async function signOutSession(sessionId: string) {
    if (typeof sessionId !== "string" || sessionId.length === 0) return { ok: false };
    try {
        await deleteSessions({ id: sessionId });
        revalidatePath("/devices");
        return { ok: true };
    } catch (error) {
        console.error("Sitzung konnte nicht beendet werden", error);
        return { ok: false };
    }
}

/** Signs out every session of the user, including the current one (like Keycloak's account console). */
export async function signOutAllSessions() {
    try {
        await deleteSessions({ includeCurrent: true });
        return { ok: true };
    } catch (error) {
        console.error("Sitzungen konnten nicht beendet werden", error);
        return { ok: false };
    }
}
