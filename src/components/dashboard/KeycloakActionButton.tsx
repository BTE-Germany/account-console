"use client"

import { type ComponentProps, type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { startKeycloakAction } from "@/lib/keycloak/required-action";

/** Button that starts a Keycloak application initiated action (see `startKeycloakAction`). */
export function KeycloakActionButton({
    action,
    returnTo,
    children,
    variant = "outline",
    size = "sm",
}: {
    action: string;
    returnTo?: string;
    children: ReactNode;
    variant?: ComponentProps<typeof Button>["variant"];
    size?: ComponentProps<typeof Button>["size"];
}) {
    const [loading, setLoading] = useState(false);

    return (
        <Button
            variant={variant}
            size={size}
            disabled={loading}
            onClick={() => {
                setLoading(true);
                void startKeycloakAction(action, returnTo);
            }}
        >
            {loading && <Spinner />}
            {children}
        </Button>
    );
}
