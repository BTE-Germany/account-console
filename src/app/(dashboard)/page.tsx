import { AlertCircleIcon } from "lucide-react";
import { LoadError } from "@/components/dashboard/LoadError";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { DeleteAccountSection } from "@/components/dashboard/profile/DeleteAccountSection";
import { PersonalInfoForm } from "@/components/dashboard/profile/PersonalInfoForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getPersonalInfo, getSupportedLocales, tryAccount } from "@/lib/keycloak/account-api";
import { getKeycloakMessages } from "@/lib/keycloak/messages";
import { getAccountClientRoles } from "@/lib/keycloak/token";
import { buildProfileForm, getAttributeValues } from "@/lib/keycloak/user-profile";

export default async function Home() {
    const [personalInfo, supportedLocales, messages, accountRoles] = await Promise.all([
        tryAccount(getPersonalInfo),
        tryAccount(getSupportedLocales),
        getKeycloakMessages(),
        getAccountClientRoles(),
    ]);

    const header = <SectionHeader title={"Deine Profildaten"} description={"Verwalte deine persönlichen Angaben."} />;

    if (!personalInfo.ok) {
        return (
            <div>
                {header}
                <LoadError status={personalInfo.status} />
            </div>
        );
    }

    const info = personalInfo.data;
    const { fields, groups } = buildProfileForm(
        info.userProfileMetadata,
        messages,
        supportedLocales.ok ? supportedLocales.data : [],
    );
    const initialValues = Object.fromEntries(fields.map((field) => [field.name, getAttributeValues(info, field.name)]));

    return (
        <div>
            {header}

            {info.email && !info.emailVerified && (
                <Alert variant="destructive" className={"mb-8"}>
                    <AlertCircleIcon />
                    <AlertTitle>E-Mail-Adresse bestätigen</AlertTitle>
                    <AlertDescription>
                        Bitte bestätige deine E-Mail-Adresse, indem du auf den Link in der Bestätigungs-E-Mail klickst, die
                        wir dir geschickt haben. Wenn du die E-Mail nicht erhalten hast, schau bitte auch in deinem
                        Spam-Ordner nach.
                    </AlertDescription>
                </Alert>
            )}

            <PersonalInfoForm
                fields={fields}
                groups={groups}
                initialValues={initialValues}
                emailVerified={!!info.emailVerified}
            />

            {accountRoles.includes("delete-account") && <DeleteAccountSection />}
        </div>
    );
}
