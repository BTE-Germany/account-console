"use client"

import { LogOutIcon, ShieldOffIcon } from "lucide-react";
import { toast } from "sonner";
import { endApplicationSessions, revokeConsent } from "@/app/(dashboard)/applications/actions";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";

export function RevokeConsentButton({ clientId, name }: { clientId: string; name: string }) {
    return (
        <ConfirmButton
            title={"Zugriff entziehen?"}
            description={`${name} verliert alle Berechtigungen, denen du zugestimmt hast. Bei der nächsten Anmeldung fragt dich die Anwendung erneut.`}
            confirmLabel={"Zugriff entziehen"}
            onConfirm={async () => {
                const result = await revokeConsent(clientId);
                if (result.ok) toast.success(`Der Zugriff von ${name} wurde entzogen.`);
                else toast.error("Der Zugriff konnte nicht entzogen werden.");
            }}
        >
            <ShieldOffIcon />
            Zugriff entziehen
        </ConfirmButton>
    );
}

export function EndApplicationSessionsButton({ clientId, name }: { clientId: string; name: string }) {
    return (
        <ConfirmButton
            title={"Sitzungen beenden?"}
            description={`Du wirst in ${name} auf allen Geräten abgemeldet.`}
            confirmLabel={"Sitzungen beenden"}
            variant={"outline"}
            onConfirm={async () => {
                const result = await endApplicationSessions(clientId);
                if (result.ok) toast.success(`Du wurdest in ${name} abgemeldet.`);
                else toast.error("Die Sitzungen konnten nicht beendet werden.");
            }}
        >
            <LogOutIcon />
            Sitzungen beenden
        </ConfirmButton>
    );
}
