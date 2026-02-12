import { getSession } from "@/lib/auth";
import { syncUserSubscription } from "@/lib/rankSync";
import { CheckCircle2Icon } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function PlusBuyPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {

    const sessionId = (await searchParams).session_id
    const session = await getSession()

    await syncUserSubscription(session!.user.id)

    return (<>
        <div className="flex flex-col items-center justify-center gap-4 py-20">
            <CheckCircle2Icon className="text-green-500" size={48} />
            <h1 className="text-2xl font-bold">
                Vielen Dank für deinen Kauf!
            </h1>
            <p className="text-muted-foreground">
                Dein Plus Abonnement sollte in Kürze aktiv sein.
            </p>

            <Link href="/plus" className="text-blue-500 hover:underline">
                Zur Übersicht
            </Link>

        </div>

    </>)

}
