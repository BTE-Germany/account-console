import {
    FingerprintIcon,
    InfoIcon,
    KeyRoundIcon,
    LifeBuoyIcon,
    type LucideIcon,
    PencilIcon,
    PlusIcon,
    ShieldCheckIcon,
    SmartphoneIcon,
    Trash2Icon,
    TriangleAlertIcon,
} from "lucide-react";
import { KeycloakActionButton } from "@/components/dashboard/KeycloakActionButton";
import { LoadError } from "@/components/dashboard/LoadError";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { formatDateTime } from "@/lib/format";
import { getCredentials, tryAccount } from "@/lib/keycloak/account-api";
import { getKeycloakMessages, type Messages, translate } from "@/lib/keycloak/messages";
import type { CredentialContainer, CredentialMetadataMessage, CredentialMetadataRepresentation } from "@/lib/keycloak/types";

type CredentialTexts = { title: string; help: string; create: string; update: string; icon: LucideIcon };

/** Own texts (du-Form) for the credential types Keycloak ships with. Unknown types fall back to Keycloak's texts. */
const CREDENTIAL_TEXTS: Record<string, CredentialTexts> = {
    password: {
        title: "Passwort",
        help: "Melde dich mit deinem Passwort an.",
        create: "Passwort festlegen",
        update: "Passwort ändern",
        icon: KeyRoundIcon,
    },
    otp: {
        title: "Authenticator-App",
        help: "Gib bei der Anmeldung einen Code aus deiner Authenticator-App ein, z. B. aus Google Authenticator, Microsoft Authenticator oder FreeOTP.",
        create: "Authenticator-App einrichten",
        update: "Ändern",
        icon: SmartphoneIcon,
    },
    webauthn: {
        title: "Passkey als zweiter Faktor",
        help: "Bestätige deine Anmeldung zusätzlich mit einem Passkey oder Sicherheitsschlüssel.",
        create: "Passkey hinzufügen",
        update: "Ändern",
        icon: FingerprintIcon,
    },
    "webauthn-passwordless": {
        title: "Passkey",
        help: "Melde dich ohne Passwort mit einem Passkey an, z. B. per Fingerabdruck, Gesichtserkennung oder Sicherheitsschlüssel.",
        create: "Passkey hinzufügen",
        update: "Ändern",
        icon: FingerprintIcon,
    },
    "recovery-authn-codes": {
        title: "Wiederherstellungscodes",
        help: "Mit diesen Codes kommst du wieder in dein Konto, falls dein zweiter Faktor nicht verfügbar ist.",
        create: "Codes erzeugen",
        update: "Neue Codes erzeugen",
        icon: LifeBuoyIcon,
    },
};

const CATEGORY_TITLES: Record<string, string> = {
    "basic-authentication": "Grundlegende Anmeldung",
    "two-factor": "Zwei-Faktor-Authentifizierung",
    passwordless: "Passwortlose Anmeldung",
};

/** du-Form for credential info texts that Keycloak only ships in the Sie-Form. */
const MESSAGE_OVERRIDES: Messages = {
    "recovery-codes-number-used": "{{0}} Wiederherstellungscodes benutzt",
    "recovery-codes-number-remaining": "{{0}} Wiederherstellungscodes übrig",
    "recovery-codes-generate-new-codes": "Erzeuge neue Codes, damit du weiterhin auf dein Konto zugreifen kannst.",
};

const textsFor = (container: CredentialContainer, messages: Messages): CredentialTexts => {
    const known = CREDENTIAL_TEXTS[container.type];
    if (known) return known;
    const title = translate(messages, container.displayName, [], container.type);
    return {
        title,
        help: translate(messages, container.helptext, [], ""),
        create: `${title} einrichten`,
        update: "Ändern",
        icon: ShieldCheckIcon,
    };
};

const message = (messages: Messages, entry?: CredentialMetadataMessage) =>
    entry ? translate(messages, entry.key, entry.parameters ?? []) : undefined;

export default async function SecurityPage() {
    const [credentials, keycloakMessages] = await Promise.all([tryAccount(getCredentials), getKeycloakMessages()]);
    const messages = { ...keycloakMessages, ...MESSAGE_OVERRIDES };

    const header = (
        <SectionHeader
            title={"Anmeldung & Sicherheit"}
            description={"Lege fest, wie du dich anmeldest, und schütze dein Konto mit einem zweiten Faktor."}
        />
    );

    if (!credentials.ok) {
        return (
            <div>
                {header}
                <LoadError status={credentials.status} />
            </div>
        );
    }

    const categories = [...new Set(credentials.data.map((container) => container.category))];

    return (
        <div>
            {header}
            <div className={"flex flex-col gap-10"}>
                {categories.map((category) => (
                    <section key={category} aria-labelledby={`category-${category}`}>
                        <h3 id={`category-${category}`} className={"mb-4 text-lg font-semibold"}>
                            {CATEGORY_TITLES[category] ?? translate(messages, category)}
                        </h3>
                        <div className={"flex flex-col gap-6"}>
                            {credentials.data
                                .filter((container) => container.category === category)
                                .map((container) => (
                                    <CredentialTypeCard key={container.type} container={container} messages={messages} />
                                ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}

function CredentialTypeCard({ container, messages }: { container: CredentialContainer; messages: Messages }) {
    const texts = textsFor(container, messages);
    const Icon = texts.icon;

    return (
        <div className={"rounded-md border border-border"}>
            <div className={"flex flex-wrap items-start justify-between gap-4 p-4"}>
                <div className={"flex gap-3"}>
                    <Icon className={"mt-0.5 size-5 shrink-0 text-muted-foreground"} aria-hidden />
                    <div>
                        <p className={"font-medium"}>{texts.title}</p>
                        {texts.help && <p className={"text-sm text-muted-foreground"}>{texts.help}</p>}
                    </div>
                </div>
                {container.createAction && (
                    <KeycloakActionButton action={container.createAction}>
                        <PlusIcon />
                        {texts.create}
                    </KeycloakActionButton>
                )}
            </div>
            <ul className={"border-t border-border"}>
                {container.userCredentialMetadatas.length === 0 && (
                    <li className={"px-4 py-3 text-sm text-muted-foreground"}>Noch nicht eingerichtet.</li>
                )}
                {container.userCredentialMetadatas.map((metadata) => (
                    <CredentialRow
                        key={metadata.credential.id}
                        metadata={metadata}
                        container={container}
                        texts={texts}
                        messages={messages}
                    />
                ))}
            </ul>
        </div>
    );
}

function CredentialRow({
    metadata,
    container,
    texts,
    messages,
}: {
    metadata: CredentialMetadataRepresentation;
    container: CredentialContainer;
    texts: CredentialTexts;
    messages: Messages;
}) {
    const { credential } = metadata;
    const provider = metadata.infoProperties?.find((property) => property.key === "webauthn-authenticator-provider")
        ?.parameters?.[0];
    const properties = (metadata.infoProperties ?? []).filter(
        (property) => property.key !== "webauthn-authenticator-provider",
    );
    const info = message(messages, metadata.infoMessage);
    const warningTitle = message(messages, metadata.warningMessageTitle);
    const warningDescription = message(messages, metadata.warningMessageDescription);

    return (
        <li className={"flex flex-wrap items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-b-0"}>
            <div className={"min-w-0 space-y-1"}>
                <p className={"truncate text-sm font-medium"}>{credential.userLabel || texts.title}</p>
                {provider && <p className={"text-sm text-muted-foreground"}>{provider}</p>}
                {credential.createdDate && (
                    <p className={"text-sm text-muted-foreground"}>Erstellt am {formatDateTime(credential.createdDate)}</p>
                )}
                {properties.length > 0 && (
                    <dl className={"grid grid-cols-[auto_1fr] gap-x-3 text-sm text-muted-foreground"}>
                        {properties.map((property) => (
                            <div key={property.key} className={"contents"}>
                                <dt>{translate(messages, property.key)}</dt>
                                <dd>{property.parameters?.join(", ")}</dd>
                            </div>
                        ))}
                    </dl>
                )}
                {info && (
                    <p className={"flex items-center gap-1.5 text-sm text-muted-foreground"}>
                        <InfoIcon className={"size-4"} aria-hidden />
                        {info}
                    </p>
                )}
                {warningTitle && (
                    <div className={"text-sm text-destructive"}>
                        <p className={"flex items-center gap-1.5 font-medium"}>
                            <TriangleAlertIcon className={"size-4"} aria-hidden />
                            {warningTitle}
                        </p>
                        {warningDescription && <p>{warningDescription}</p>}
                    </div>
                )}
            </div>
            <div className={"flex gap-2"}>
                {container.updateAction && (
                    <KeycloakActionButton action={container.updateAction}>
                        <PencilIcon />
                        {texts.update}
                    </KeycloakActionButton>
                )}
                {container.removeable && (
                    <KeycloakActionButton action={`delete_credential:${credential.id}`} variant={"destructive"}>
                        <Trash2Icon />
                        Löschen
                    </KeycloakActionButton>
                )}
            </div>
        </li>
    );
}
