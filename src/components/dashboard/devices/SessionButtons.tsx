"use client"

import { LogOutIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { signOutAllSessions, signOutSession } from "@/app/(dashboard)/devices/actions";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";

export function SignOutSessionButton({ sessionId, description }: { sessionId: string; description: string }) {
    return (
        <ConfirmButton
            title={"Sitzung abmelden?"}
            description={description}
            confirmLabel={"Abmelden"}
            variant={"outline"}
            onConfirm={async () => {
                const result = await signOutSession(sessionId);
                if (result.ok) toast.success("Die Sitzung wurde abgemeldet.");
                else toast.error("Die Sitzung konnte nicht abgemeldet werden.");
            }}
        >
            <LogOutIcon />
            Abmelden
        </ConfirmButton>
    );
}

export function SignOutAllButton() {
    return (
        <ConfirmButton
            title={"Alle Geräte abmelden?"}
            description={
                "Du wirst auf allen Geräten abgemeldet, auf denen du mit deinem Konto angemeldet bist – auch auf diesem."
            }
            confirmLabel={"Alle abmelden"}
            onConfirm={async () => {
                const result = await signOutAllSessions();
                if (!result.ok) {
                    toast.error("Die Geräte konnten nicht abgemeldet werden.");
                    return;
                }
                await signOut({ callbackUrl: "/" });
            }}
        >
            <LogOutIcon />
            Alle Geräte abmelden
        </ConfirmButton>
    );
}
