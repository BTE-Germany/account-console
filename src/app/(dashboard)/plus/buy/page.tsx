"use client";

import { Checkbox } from "@/components/animate-ui/components/radix/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useState } from "react";
import { createCheckoutSession } from "./actions";

export const dynamic = 'force-dynamic';

export default function PlusBuyPage() {

    const [interval, setInterval] = useState<"month" | "year">("month")
    const [agreedToTerms, setAgreedToTerms] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubscribe = async () => {
        setLoading(true)
        const url = await createCheckoutSession(interval)
        if (url) {
            window.location.href = url;
        }
        setLoading(false);
    }

    return <>

        <div className="flex flex-col gap-4">
            <p className="font-medium text-muted-foreground">
                Abrechnungsart auswählen
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {["month", "year"].map((intv) => (
                    <div className={cn(
                        { "border-primary bg-primary/10": interval === intv, "border-border": interval !== intv },
                        "border  rounded-lg p-4 flex flex-row items-center gap-4 cursor-pointer relative"
                    )} key={intv} onClick={() => setInterval(intv as "month" | "year")}>

                        <AnimatePresence>
                            {interval === intv && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute -top-2 -right-2 bg-primary rounded-full p-1"
                                >
                                    <CheckIcon className="text-white" size={16} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div>
                            <div className="flex items-center gap-2">
                                <p className="font-bold text-lg">
                                    {intv === "month" ? "Monatlich" : "Jährlich"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {intv === "month" ? "2,00€ pro Monat" : "20,00€ pro Jahr"}
                                </p>
                                {
                                    intv === "year" && <Badge >
                                        2 Monate gratis
                                    </Badge>
                                }
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {intv === "month" ? "Flexibel monatlich kündbar." : "Spare 2 Monate im Vergleich zum monatlichen Abo."}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <p className="text-xs text-muted-foreground">
                Das Abonnement wird automatisch verlängert. Eine Kündigung ist jederzeit möglich. Alle Preise verstehen sich ohne Umsatzsteuer, gemäß §19 UStG.
            </p>
            <Label className="flex items-center gap-x-3 mt-5">
                <Checkbox
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked === true)}

                />
                <span>Ich bin mit den <a href="https://buildthe.earth/agb" className="text-blue-500">Allgemeinen Geschäftsbedingungen</a> und der <a href="https://bte-germany.de/privacy" className="text-blue-500">Datenschutzerklärung</a> einverstanden.</span>
            </Label>

            <Button className="self-end" disabled={!agreedToTerms || loading} onClick={() => handleSubscribe()}>
                {loading && <Spinner />}
                Weiter
            </Button>

        </div>

    </>
}
