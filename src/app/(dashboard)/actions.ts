"use server"

import {getSession} from "@/lib/auth";
import getKcAdminClient from "@/lib/kcAdmin";



export const saveProfile = async (username: string, email: string) => {
    const session = await getSession()
    if (!session) {
        return {"status": "error", "message": "Beim Speichern ist ein Fehler aufgetreten.", "field": "global"}
    }

    const kcAdminClient = await getKcAdminClient()
    if (!kcAdminClient) {
        return {"status": "error", "message": "Beim Speichern ist ein Fehler aufgetreten.", "field": "global"}
    }

    if (username !== session.user.username) {
        try {
            const updatePayload: Record<string, unknown> = { username }
            if (email) {
                (updatePayload as any).email = email
            }
            await kcAdminClient.users.update({ id: session.user.id }, updatePayload)
        } catch (e: unknown) {
            const err = e as { response?: { status?: number } } | undefined
            const status = err?.response?.status

            if (status === 409) {
                return {"status": "error", "message": "Der angegebene Benutzername ist bereits vergeben.", "field": "username"}
            }

            return {"status": "error", "message": "Beim Speichern ist ein Fehler aufgetreten.", "field": "global"}
        }
    }


    if (email !== session.user.email) {
        try {
            await kcAdminClient.users.update({ id: session.user.id }, {
                email,
                emailVerified: false,
                requiredActions: ["VERIFY_EMAIL"]
            })
            await kcAdminClient.users.sendVerifyEmail({ id: session.user.id })
            return {"status": "success", "message": "Deine Profildaten wurden erfolgreich gespeichert. Bitte überprüfe deine E-Mails, um deine neue E-Mail Adresse zu verifizieren."}
        } catch (e: unknown) {
            const err = e as { response?: { status?: number } } | undefined
            const status = err?.response?.status

            if (status === 409) {
                return {"status": "error", "message": "Der angegebene E-Mail Adresse ist bereits vergeben.", "field": "email"}
            }

            return {"status": "error", "message": "Beim Speichern ist ein Fehler aufgetreten.", "field": "global"}
        }
    }


    return {"status": "success", "message": "Deine Profildaten wurden erfolgreich gespeichert."}
}