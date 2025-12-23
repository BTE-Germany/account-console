"use client"

import {Button} from "@/components/ui/button";
import {unlinkAccount, unlinkMinecraftAccount} from "@/app/(dashboard)/links/actions";
import {useState} from "react";
import {Spinner} from "@/components/ui/spinner";
import getPkce from 'oauth-pkce';
import {LinkIcon, UnlinkIcon} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {Kbd} from "@/components/ui/kbd";


export const MinecraftLinkUnlinkButton = ({isLinked}: {isLinked: boolean}) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [open, setOpen] = useState<boolean>(false);

    return (
        <div>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Verbinde deinen Minecraft Account</DialogTitle>
                        <DialogDescription>
                            Um deinen Minecraft Account zu verbinden, gebe bitte auf dem Minecraft Server den <Kbd>/accountlink</Kbd> Befehl ein. Klicke dann auf den Link, der in deinem Minecraft Chat erscheint.
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
            {
                isLinked ? <Button variant={"destructive"} size={"sm"} disabled={loading}
                                   onClick={async () => {
                                       setLoading(true)
                                       await unlinkMinecraftAccount()
                                       window.location.reload()
                                   }}
                >
                    {loading ? <Spinner /> : <UnlinkIcon />}
                    Verbindung entfernen</Button> : <Button size={"sm"} onClick={() => {
                        setOpen(true)
                }}>
                    <LinkIcon />
                    Verbinden</Button>
            }
        </div>
    )

}

export const LinkUnlinkButton = ({idpAlias, isLinked}: {idpAlias: string, isLinked: boolean}) => {

    const [loading, setLoading] = useState<boolean>(false);

    const redirectToLinkUrl = async () => {
        getPkce(50, (error, {challenge}) => {
            window.location.href = `${process.env.NEXT_PUBLIC_KEYCLOAK_URL}/protocol/openid-connect/auth?client_id=bte-account-console&redirect_uri=${encodeURIComponent(window.location.href)}&response_type=code&scope=openid&kc_action=idp_link:${idpAlias}&code_challenge=${challenge}&code_challenge_method=S256`;
        });
    }

    return (
        <div>
            {
                isLinked ? <Button variant={"destructive"} size={"sm"} disabled={loading}
                                   onClick={async () => {
                                       setLoading(true)
                                       await unlinkAccount(idpAlias)
                                       window.location.reload()
                                   }}
                >
                    {loading ? <Spinner /> : <UnlinkIcon />}
                    Verbindung entfernen</Button> : <Button size={"sm"} onClick={() => {
                        setLoading(true)
                    redirectToLinkUrl()
                }}>
                    <LinkIcon />
                    Verbinden</Button>
            }
        </div>
    )
}
