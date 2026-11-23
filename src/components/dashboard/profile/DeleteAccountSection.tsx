"use client"

import { Trash2Icon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { startKeycloakAction } from "@/lib/keycloak/required-action";

/**
 * Account deletion via Keycloak's `delete_account` action. Keycloak shows its own
 * confirmation page (login theme) and deletes the account afterwards.
 */
export function DeleteAccountSection() {
    const [loading, setLoading] = useState(false);

    return (
        <section className={"mt-12 rounded-lg border border-destructive/40 p-4"}>
            <h3 className={"font-semibold"}>Konto löschen</h3>
            <p className={"mt-1 mb-4 text-sm text-muted-foreground"}>
                Dein Konto und alle damit verbundenen Daten werden dauerhaft gelöscht. Das kann nicht rückgängig gemacht
                werden. Bevor dein Konto gelöscht wird, musst du den Vorgang noch einmal bestätigen.
            </p>
            <Button
                variant="destructive"
                size="sm"
                disabled={loading}
                onClick={() => {
                    setLoading(true);
                    void startKeycloakAction("delete_account", "/");
                }}
            >
                {loading ? <Spinner /> : <Trash2Icon />}
                Konto löschen
            </Button>
        </section>
    );
}
