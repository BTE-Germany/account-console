import { AlertCircleIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const describeStatus = (status: number) => {
    if (status === 401) return "Deine Sitzung ist abgelaufen. Bitte lade die Seite neu oder melde dich erneut an.";
    if (status === 403) return "Dein Konto hat keine Berechtigung, diese Daten abzurufen.";
    return "Keycloak hat die Anfrage nicht beantwortet. Bitte versuche es später erneut.";
};

export function LoadError({ status, title = "Daten konnten nicht geladen werden" }: { status: number; title?: string }) {
    return (
        <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>{describeStatus(status)}</AlertDescription>
        </Alert>
    );
}
