import {getSession} from "@/lib/auth";
import {getMinecraftLink, getPossibleLinks, getUserLinks, unlinkAccount} from "@/app/(dashboard)/links/actions";
import {
    Icon,
    IconBrandApple,
    IconBrandDiscord,
    IconBrandMinecraft, IconBrandWindows,
    IconPlanet,
    IconProps,
    IconWorld
} from "@tabler/icons-react";
import {ForwardRefExoticComponent, RefAttributes} from "react";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {LinkUnlinkButton, MinecraftLinkUnlinkButton} from "@/components/dashboard/links/LinkUnlinkButton";

export default async function Links() {

    const session = await getSession()

    const keycloakLinks = await getUserLinks()
    const minecraftLink = await getMinecraftLink()
    const possibleLinks = (await getPossibleLinks()).sort((a, b) => parseInt(a?.config!["guiOrder"] || 999) - parseInt(b?.config!["guiOrder"] || 999))


    const iconsForLinks: Record<string, ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>> = {
        "apple": IconBrandApple,
        "buildtheearth": IconWorld,
        "microsoft": IconBrandWindows,
        "discord": IconBrandDiscord
    }

    return (
        <div className={"flex flex-col gap-4"}>
            <div className={"border border-border rounded-md p-4"}>
                <div className={"flex items-center justify-between"}>
                    <div className={"flex items-center gap-4"}>
                        <div className={"flex items-center gap-2"}>
                            <IconBrandMinecraft className={"size-8"} />
                        </div>
                        <div className={"flex gap-4 items-center"}>
                            <p>Minecraft</p>
                            {
                                minecraftLink.status && <Badge variant={"default"} >Verbunden als {minecraftLink.username}</Badge>
                            }
                        </div>
                    </div>
                    <MinecraftLinkUnlinkButton isLinked={minecraftLink.status}/>

                </div>
            </div>
            {
                possibleLinks.map((link) => {
                    const Icon = iconsForLinks[link.alias as string]
                    const isLinked = keycloakLinks?.some(kcLink => kcLink.identityProvider === link.alias)
                    return (
                        <div className={"border border-border rounded-md p-4"} key={link.alias}>
                            <div className={"flex items-center justify-between"}>
                                <div className={"flex items-center gap-4"}>
                                    <div className={"flex items-center gap-2"}>
                                        {
                                            Icon && <Icon className={"size-8"} />
                                        }
                                    </div>
                                    <div className={"flex gap-4 items-center"}>
                                        <p>{link.displayName || link.alias}</p>
                                        {
                                            isLinked && <Badge variant={"default"} >Verbunden</Badge>
                                        }
                                    </div>
                                </div>
                                <LinkUnlinkButton idpAlias={link.alias!} isLinked={isLinked!} />
                            </div>
                        </div>
                    )
                })
            }
        </div>
    );
}
