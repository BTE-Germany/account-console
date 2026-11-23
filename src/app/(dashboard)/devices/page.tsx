import { MonitorIcon, SmartphoneIcon } from "lucide-react";
import { LoadError } from "@/components/dashboard/LoadError";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { SignOutAllButton, SignOutSessionButton } from "@/components/dashboard/devices/SessionButtons";
import { Badge } from "@/components/ui/badge";
import { formatEpochSeconds } from "@/lib/format";
import { getDevices, tryAccount } from "@/lib/keycloak/account-api";
import type { DeviceRepresentation, SessionRepresentation } from "@/lib/keycloak/types";

const deviceName = (device: DeviceRepresentation) => {
    const os = [device.os, device.osVersion].filter((part) => part && part !== "Other" && part !== "Unknown").join(" ");
    const model = device.device && device.device !== "Other" ? device.device : "";
    return [model, os].filter(Boolean).join(" · ") || "Unbekanntes Gerät";
};

/** Current device and session first, the rest by last activity. */
const sortDevices = (devices: DeviceRepresentation[]) =>
    [...devices]
        .sort((a, b) => Number(!!b.current) - Number(!!a.current) || b.lastAccess - a.lastAccess)
        .map((device) => ({
            ...device,
            sessions: [...device.sessions].sort(
                (a, b) => Number(!!b.current) - Number(!!a.current) || b.lastAccess - a.lastAccess,
            ),
        }));

export default async function DevicesPage() {
    const devices = await tryAccount(getDevices);

    const header = (
        <SectionHeader
            title={"Geräteaktivität"}
            description={"Hier siehst du, wo du gerade angemeldet bist. Melde Sitzungen ab, die du nicht kennst."}
            action={devices.ok && devices.data.length > 0 ? <SignOutAllButton /> : undefined}
        />
    );

    if (!devices.ok) {
        return (
            <div>
                {header}
                <LoadError status={devices.status} />
            </div>
        );
    }

    return (
        <div>
            {header}
            <div className={"flex flex-col gap-6"}>
                {sortDevices(devices.data).map((device) => {
                    const Icon = device.mobile ? SmartphoneIcon : MonitorIcon;
                    return (
                        <div key={`${device.os}-${device.osVersion}-${device.device}`} className={"rounded-md border border-border"}>
                            <div className={"flex items-center gap-3 border-b border-border p-4"}>
                                <Icon className={"size-5 text-muted-foreground"} aria-hidden />
                                <p className={"font-medium"}>{deviceName(device)}</p>
                                {device.current && <Badge>Dieses Gerät</Badge>}
                            </div>
                            <ul>
                                {device.sessions.map((session) => (
                                    <SessionRow key={session.id} session={session} deviceName={deviceName(device)} />
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function SessionRow({ session, deviceName }: { session: SessionRepresentation; deviceName: string }) {
    const clients = session.clients.map((client) => client.clientName || client.clientId).filter(Boolean);
    const browser = session.browser && session.browser !== "Other" ? session.browser : "Unbekannter Browser";

    return (
        <li className={"flex flex-wrap items-start justify-between gap-4 border-b border-border p-4 last:border-b-0"}>
            <div className={"min-w-0 space-y-2"}>
                <div className={"flex flex-wrap items-center gap-2"}>
                    <p className={"text-sm font-medium"}>{browser}</p>
                    {session.current && <Badge variant={"secondary"}>Aktuelle Sitzung</Badge>}
                </div>
                <dl className={"grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm"}>
                    <dt className={"text-muted-foreground"}>IP-Adresse</dt>
                    <dd>{session.ipAddress}</dd>
                    <dt className={"text-muted-foreground"}>Zuletzt aktiv</dt>
                    <dd>{formatEpochSeconds(session.lastAccess)}</dd>
                    <dt className={"text-muted-foreground"}>Angemeldet seit</dt>
                    <dd>{formatEpochSeconds(session.started)}</dd>
                    <dt className={"text-muted-foreground"}>Läuft ab</dt>
                    <dd>{formatEpochSeconds(session.expires)}</dd>
                    {clients.length > 0 && (
                        <>
                            <dt className={"text-muted-foreground"}>Anwendungen</dt>
                            <dd>{clients.join(", ")}</dd>
                        </>
                    )}
                </dl>
            </div>
            {!session.current && (
                <SignOutSessionButton
                    sessionId={session.id}
                    description={`Die Sitzung in ${browser} auf ${deviceName} (${session.ipAddress}) wird beendet.`}
                />
            )}
        </li>
    );
}
