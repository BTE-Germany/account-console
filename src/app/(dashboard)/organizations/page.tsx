import { Building2Icon } from "lucide-react";
import { LoadError } from "@/components/dashboard/LoadError";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { getOrganizations, tryAccount } from "@/lib/keycloak/account-api";

export default async function OrganizationsPage() {
    const organizations = await tryAccount(getOrganizations);

    const header = <SectionHeader title={"Organisationen"} description={"Organisationen, denen du angehörst."} />;

    if (!organizations.ok) {
        return (
            <div>
                {header}
                <LoadError status={organizations.status} />
            </div>
        );
    }

    return (
        <div>
            {header}
            {organizations.data.length === 0 ? (
                <p className={"text-sm text-muted-foreground"}>Du bist in keiner Organisation.</p>
            ) : (
                <ul className={"flex flex-col gap-4"}>
                    {organizations.data.map((organization) => (
                        <li key={organization.id ?? organization.alias} className={"flex gap-3 rounded-md border border-border p-4"}>
                            <Building2Icon className={"mt-0.5 size-5 shrink-0 text-muted-foreground"} aria-hidden />
                            <div className={"min-w-0 space-y-1"}>
                                <p className={"font-medium"}>{organization.name ?? organization.alias}</p>
                                {organization.description && (
                                    <p className={"text-sm text-muted-foreground"}>{organization.description}</p>
                                )}
                                {organization.domains && organization.domains.length > 0 && (
                                    <div className={"flex flex-wrap gap-2 pt-1"}>
                                        {organization.domains
                                            .map((domain) => (typeof domain === "string" ? { name: domain } : domain))
                                            .map((domain) => (
                                                <Badge key={domain.name} variant={"outline"}>
                                                    {domain.name}
                                                    {domain.verified && " · verifiziert"}
                                                </Badge>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
