import { AppWindowIcon, ExternalLinkIcon } from "lucide-react";
import {
    EndApplicationSessionsButton,
    RevokeConsentButton,
} from "@/components/dashboard/applications/ApplicationButtons";
import { LoadError } from "@/components/dashboard/LoadError";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { getApplications, tryAccount } from "@/lib/keycloak/account-api";
import { getKeycloakMessages, type Messages, translate } from "@/lib/keycloak/messages";
import type { ApplicationRepresentation } from "@/lib/keycloak/types";

/** Only show links Keycloak got from the client configuration if they are http(s). */
const safeUrl = (url?: string) => {
    if (!url) return undefined;
    try {
        const parsed = new URL(url);
        return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : undefined;
    } catch {
        return undefined;
    }
};

const applicationName = (application: ApplicationRepresentation, messages: Messages) =>
    application.clientName ? translate(messages, application.clientName) : application.clientId;

export default async function ApplicationsPage() {
    const [applications, messages] = await Promise.all([tryAccount(getApplications), getKeycloakMessages()]);

    const header = (
        <SectionHeader
            title={"Anwendungen"}
            description={"Anwendungen, auf die du mit deinem Konto Zugriff hast oder denen du Berechtigungen erteilt hast."}
        />
    );

    if (!applications.ok) {
        return (
            <div>
                {header}
                <LoadError status={applications.status} />
            </div>
        );
    }

    const sorted = [...applications.data].sort(
        (a, b) =>
            Number(b.inUse || b.offlineAccess) - Number(a.inUse || a.offlineAccess) ||
            applicationName(a, messages).localeCompare(applicationName(b, messages), "de"),
    );

    return (
        <div>
            {header}
            {sorted.length === 0 && <p className={"text-sm text-muted-foreground"}>Keine Anwendungen gefunden.</p>}
            <ul className={"flex flex-col gap-4"}>
                {sorted.map((application) => (
                    <ApplicationCard key={application.clientId} application={application} messages={messages} />
                ))}
            </ul>
        </div>
    );
}

function ApplicationCard({ application, messages }: { application: ApplicationRepresentation; messages: Messages }) {
    const name = applicationName(application, messages);
    const url = safeUrl(application.effectiveUrl);
    const logo = safeUrl(application.logoUri);
    const tos = safeUrl(application.tosUri);
    const policy = safeUrl(application.policyUri);
    const active = application.inUse || application.offlineAccess;
    const scopes = application.consent?.grantedScopes ?? [];

    return (
        <li className={"rounded-md border border-border p-4"}>
            <div className={"flex flex-wrap items-start justify-between gap-4"}>
                <div className={"flex min-w-0 gap-3"}>
                    {logo ? (
                        // eslint-disable-next-line @next/next/no-img-element -- external logo from the Keycloak client config
                        <img src={logo} alt="" className={"size-10 shrink-0 rounded-md object-contain"} />
                    ) : (
                        <AppWindowIcon className={"size-10 shrink-0 p-2 text-muted-foreground"} aria-hidden />
                    )}
                    <div className={"min-w-0"}>
                        <div className={"flex flex-wrap items-center gap-2"}>
                            {url ? (
                                <a href={url} target="_blank" rel="noopener noreferrer" className={"inline-flex items-center gap-1 font-medium hover:underline"}>
                                    {name}
                                    <ExternalLinkIcon className={"size-3.5"} aria-hidden />
                                </a>
                            ) : (
                                <p className={"font-medium"}>{name}</p>
                            )}
                            {active && <Badge>In Verwendung</Badge>}
                            {application.offlineAccess && <Badge variant={"secondary"}>Offline-Zugriff</Badge>}
                        </div>
                        {application.description && (
                            <p className={"text-sm text-muted-foreground"}>{translate(messages, application.description)}</p>
                        )}
                        <p className={"text-sm text-muted-foreground"}>
                            {application.userConsentRequired ? "Drittanbieter-Anwendung" : "Interne Anwendung"}
                        </p>
                    </div>
                </div>
                <div className={"flex flex-wrap gap-2"}>
                    {active && <EndApplicationSessionsButton clientId={application.clientId} name={name} />}
                    {(application.consent || application.offlineAccess) && (
                        <RevokeConsentButton clientId={application.clientId} name={name} />
                    )}
                </div>
            </div>

            {(application.consent || tos || policy) && (
                <dl className={"mt-4 grid grid-cols-1 gap-x-4 gap-y-1 border-t border-border pt-4 text-sm sm:grid-cols-[auto_1fr]"}>
                    {application.consent && (
                        <>
                            <dt className={"text-muted-foreground"}>Erteilte Berechtigungen</dt>
                            <dd>
                                {scopes.length > 0
                                    ? scopes.map((scope) => translate(messages, scope.displayText || scope.name)).join(", ")
                                    : "Keine"}
                            </dd>
                            <dt className={"text-muted-foreground"}>Zugestimmt am</dt>
                            <dd>{formatDateTime(application.consent.createdDate)}</dd>
                            {formatDateTime(application.consent.lastUpdatedDate) !==
                                formatDateTime(application.consent.createdDate) && (
                                <>
                                    <dt className={"text-muted-foreground"}>Zuletzt geändert</dt>
                                    <dd>{formatDateTime(application.consent.lastUpdatedDate)}</dd>
                                </>
                            )}
                        </>
                    )}
                    {tos && (
                        <>
                            <dt className={"text-muted-foreground"}>Nutzungsbedingungen</dt>
                            <dd>
                                <a href={tos} target="_blank" rel="noopener noreferrer" className={"break-all hover:underline"}>
                                    {tos}
                                </a>
                            </dd>
                        </>
                    )}
                    {policy && (
                        <>
                            <dt className={"text-muted-foreground"}>Datenschutz</dt>
                            <dd>
                                <a href={policy} target="_blank" rel="noopener noreferrer" className={"break-all hover:underline"}>
                                    {policy}
                                </a>
                            </dd>
                        </>
                    )}
                </dl>
            )}
        </li>
    );
}
