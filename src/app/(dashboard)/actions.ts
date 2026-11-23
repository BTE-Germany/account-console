"use server"

import getKcAdminClient from "@/lib/kcAdmin";
import { AccountApiError, loadPersonalInfo, updatePersonalInfo } from "@/lib/keycloak/account-api";
import { getKeycloakMessages, translate } from "@/lib/keycloak/messages";
import type { PersonalInfo } from "@/lib/keycloak/types";
import { ROOT_ATTRIBUTES, attributeLabel, isHiddenAttribute, isRootAttribute } from "@/lib/keycloak/user-profile";

export type SaveProfileResult =
    | { status: "success"; message: string; reauthenticate: boolean }
    | { status: "error"; message: string; fieldErrors?: Record<string, string> };

type KeycloakFieldError = { field?: string; errorMessage?: string; params?: unknown[] };

const GENERIC_ERROR = "Beim Speichern ist ein Fehler aufgetreten.";

/**
 * Saves the profile through Keycloak's Account REST API. Keycloak validates the values
 * against the realm's user profile configuration (permissions, validators, required fields).
 *
 * Only attributes the user may edit and that the form shows are taken from the submitted
 * values. Everything else is sent back unchanged, because Keycloak removes editable
 * attributes that are missing from the request.
 */
export async function savePersonalInfo(values: Record<string, string[]>): Promise<SaveProfileResult> {
    let current: PersonalInfo;
    try {
        current = await loadPersonalInfo();
    } catch {
        return { status: "error", message: GENERIC_ERROR };
    }

    const attributes: Record<string, string[]> = { ...(current.attributes ?? {}) };
    const payload: Omit<PersonalInfo, "userProfileMetadata"> = {
        id: current.id,
        username: current.username,
        email: current.email,
        firstName: current.firstName,
        lastName: current.lastName,
        emailVerified: current.emailVerified,
        attributes,
    };

    const metadata = current.userProfileMetadata?.attributes ?? [];
    for (const attribute of metadata) {
        if (attribute.readOnly || isHiddenAttribute(attribute) || !(attribute.name in values)) continue;
        const submitted = (values[attribute.name] ?? []).map((value) => value.trim()).filter((value) => value !== "");

        if (isRootAttribute(attribute.name)) {
            payload[attribute.name] = submitted[0] ?? "";
        } else {
            attributes[attribute.name] = attribute.multivalued ? submitted : submitted.slice(0, 1);
        }
    }
    ROOT_ATTRIBUTES.forEach((name) => delete attributes[name]);

    try {
        await updatePersonalInfo(payload);
    } catch (error) {
        if (error instanceof AccountApiError && error.status === 400) {
            const messages = await getKeycloakMessages();
            const body = (error.body ?? {}) as KeycloakFieldError & { errors?: KeycloakFieldError[] };
            const errors = body.errors ?? (body.errorMessage ? [body] : []);
            const fieldErrors: Record<string, string> = {};
            let globalMessage: string | undefined;

            for (const { field, errorMessage, params = [] } of errors) {
                if (!errorMessage) continue;
                const attribute = metadata.find((entry) => entry.name === field);
                const translatedParams = params.map((param, index) =>
                    index === 0 && attribute ? attributeLabel(messages, attribute) : String(param),
                );
                const text = translate(messages, errorMessage, translatedParams);
                if (field && values[field] !== undefined) fieldErrors[field] = text;
                else globalMessage ??= text;
            }

            return {
                status: "error",
                message: globalMessage ?? "Bitte überprüfe deine Eingaben.",
                fieldErrors,
            };
        }
        console.error("Profil konnte nicht gespeichert werden", error);
        return { status: "error", message: GENERIC_ERROR };
    }

    const emailChanged = (payload.email ?? "") !== (current.email ?? "");
    const usernameChanged = (payload.username ?? "") !== (current.username ?? "");

    if (emailChanged && payload.email && current.id) {
        // Keycloak resets "email verified" when the address changes. Send the verification mail
        // right away (as before) instead of waiting for the next login.
        try {
            const updated = await loadPersonalInfo();
            if (!updated.emailVerified) {
                const kcAdminClient = await getKcAdminClient();
                await kcAdminClient.users.sendVerifyEmail({ id: current.id });
            }
        } catch (error) {
            console.error("Bestätigungs-E-Mail konnte nicht gesendet werden", error);
        }
    }

    return {
        status: "success",
        message: emailChanged
            ? "Deine Profildaten wurden gespeichert. Bitte bestätige deine neue E-Mail-Adresse über den Link, den wir dir geschickt haben."
            : "Deine Profildaten wurden gespeichert.",
        reauthenticate: emailChanged || usernameChanged,
    };
}
