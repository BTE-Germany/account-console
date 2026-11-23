"use server"

import { revalidatePath } from "next/cache";
import { deleteApplicationSessions, deleteConsent } from "@/lib/keycloak/account-api";

const isValidClientId = (clientId: unknown): clientId is string => typeof clientId === "string" && clientId.length > 0;

export async function revokeConsent(clientId: string) {
    if (!isValidClientId(clientId)) return { ok: false };
    try {
        await deleteConsent(clientId);
        revalidatePath("/applications");
        return { ok: true };
    } catch (error) {
        console.error("Zugriff konnte nicht entzogen werden", error);
        return { ok: false };
    }
}

export async function endApplicationSessions(clientId: string) {
    if (!isValidClientId(clientId)) return { ok: false };
    try {
        await deleteApplicationSessions(clientId);
        revalidatePath("/applications");
        return { ok: true };
    } catch (error) {
        console.error("Anwendungssitzungen konnten nicht beendet werden", error);
        return { ok: false };
    }
}
