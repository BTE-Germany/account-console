import {use} from "react";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {AlertCircleIcon, ArrowRight, CheckCircle2Icon} from "lucide-react";
import jwt from "jsonwebtoken";
import {getMinecraftLink, getMinecraftUsernameFromUUID, linkMinecraftAccount} from "@/app/(dashboard)/links/actions";
import {Button} from "@/components/ui/button";
import Link from "next/link";

export default async function Minecraft({
                                      searchParams,
                                  }: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const minecraftLink = await getMinecraftLink()
    const token = (await searchParams).token

    if(minecraftLink.status) {
        return <div>
            <h2 className={"text-xl font-bold mb-8"}>
                Mit Minecraft verbinden
            </h2>
            <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>Bereits verbunden</AlertTitle>
                <AlertDescription>
                    <p>
                        Dein Konto ist bereits mit dem Minecraft-Konto "{minecraftLink.username}" verknüpft. Eine erneute Verknüpfung ist nicht erforderlich.
                    </p>
                </AlertDescription>
            </Alert>
        </div>
    }



    if (!token || typeof token !== "string") {
        return <div>
            <h2 className={"text-xl font-bold mb-8"}>
                Mit Minecraft verbinden
            </h2>
            <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>Kein Token</AlertTitle>
                <AlertDescription>
                    <p>
                        In deiner Anfrage fehlt der erforderliche Token, um dein Minecraft-Konto zu verknüpfen. Bitte stelle sicher, dass du den richtigen Link verwendest.
                    </p>
                </AlertDescription>
            </Alert>
        </div>
    }

    try {
        const decoded = jwt.verify(token, process.env.MC_LINK_SECRET || "")
        const {sub} = decoded as { sub: string }
        const username = await getMinecraftUsernameFromUUID(sub);
        if (!username) {
            return <></>;
        }

        await linkMinecraftAccount(token);



        return <>
            <h2 className={"text-xl font-bold mb-8"}>
                Mit Minecraft verbinden
            </h2>
            <Alert>
                <CheckCircle2Icon />
                <AlertTitle>Erfolgreich verbunden!</AlertTitle>
                <AlertDescription>
                    <p>Dein Minecraft-Konto <span className={"font-bold"}>{username}</span> wurde erfolgreich mit deinem BTE Germany Account verknüpft.</p>
                </AlertDescription>
            </Alert>

            <Link href={"/links"}>
                <Button variant={"ghost"} className={"mt-4"}>
                    Zu deinen verbundenen Konten
                    <ArrowRight />
                </Button>
            </Link>
        </>
    } catch (e) {
        return <div>
            <h2 className={"text-xl font-bold mb-8"}>
                Mit Minecraft verbinden
            </h2>
            <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>Fehlerhafter Token</AlertTitle>
                <AlertDescription>
                    <p>
                        Der bereitgestellte Token ist ungültig oder abgelaufen. Bitte fordere einen neuen Verknüpfungslink an und versuche es erneut.
                    </p>
                </AlertDescription>
            </Alert>
        </div>
    }

}