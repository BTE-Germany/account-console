import {
    getHasActivePlusSubscription,
    getPlusType,
    getStripeManageUrl,
    getSubscriptionInfo
} from "@/app/(dashboard)/plus/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import dayjs from "dayjs";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

export default async function PlusPage() {

    const hasPlusPlan = await getHasActivePlusSubscription()

    if (!hasPlusPlan) {
        return <>
            Aktuell hast du keinen Plus Rang.
        </>
    }

    const plusType = await getPlusType()

    if (plusType === "subcription") {

        const subscription = await getSubscriptionInfo()

        const manageURL = await getStripeManageUrl()

        if (!subscription) return <></>


        return (<>
            <div className={"w-full py-5 px-8 bg-card rounded-lg border border-border relative overflow-hidden"}>
                <div className={cn("h-full aspect-square  absolute top-0 left-0 opacity-30 rounded-full -translate-x-1/2 scale-150 blur-3xl", {
                    "bg-primary": subscription?.status === "active" && !subscription.cancel_at,
                    "bg-destructive": subscription?.status === "canceled" || subscription.cancel_at
                })}></div>
                <div className={"flex flex-row items-center justify-between"}>
                    <div className={"flex flex-col gap-2"}>
                        <p className={" font-bold text-foreground"}>
                            Dein Plus Abonnement
                        </p>
                        {
                            subscription?.status === "active" && !subscription.cancel_at && <Badge>
                                Aktiv
                            </Badge>
                        }

                        {
                            subscription?.status === "canceled" || subscription.cancel_at && <Badge variant={"destructive"}>
                                Gekündigt zum {dayjs.unix(subscription.cancel_at).format("DD.MM.YYYY")}
                            </Badge>
                        }
                    </div>
                    <Button asChild>
                        <a href={manageURL || "#"}>
                            Abonnement verwalten
                        </a>
                    </Button>
                </div>
            </div>
        </>)
    }

    if (plusType === "onetime") return (<>
        <Alert>
            <CheckCircle2Icon />
            <AlertTitle>
                Lifetime Plus Rang
            </AlertTitle>
            <AlertDescription>
                Du besitzt den BTE Germany Plus Rang durch einen einmaligen Kauf. Dieser Rang ist zeitlich unbegrenzt
                gültig. Vielen Dank für deine Unterstützung!
            </AlertDescription>
        </Alert>
    </>)

    return <></>
}
