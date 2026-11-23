"use client"

import { motion } from "motion/react"
import { AppWindow, Building2, Link, MonitorSmartphone, ShieldCheck, Sparkles, User } from "lucide-react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavigationFeatures = {
    organizations: boolean;
};

export const DashboardNavigation = ({ features }: { features: NavigationFeatures }) => {

    const links = [
        { link: "/", icon: User, label: "Profildaten" },
        { link: "/security", icon: ShieldCheck, label: "Anmeldung & Sicherheit" },
        { link: "/devices", icon: MonitorSmartphone, label: "Geräteaktivität" },
        { link: "/links", icon: Link, label: "Verbundene Konten" },
        { link: "/applications", icon: AppWindow, label: "Anwendungen" },
        ...(features.organizations ? [{ link: "/organizations", icon: Building2, label: "Organisationen" }] : []),
        { link: "/plus", icon: Sparkles, label: "Plus Rang" },
    ]

    const path = usePathname()
    const isActive = (link: string) => link === "/" ? path === "/" : path === link || path.startsWith(`${link}/`)

    return (
        <nav aria-label="Account Console">
            {
                links.map((link) => {
                    const Icon = link.icon;
                    const active = isActive(link.link);
                    return (
                        <NextLink href={link.link} key={link.link} className={"block w-full"} aria-current={active ? "page" : undefined}>
                            <div className={"relative"}>
                                {
                                    active && <motion.div className={"absolute h-full w-1 bg-primary rounded-full -left-2"} layoutId="line"
                                                          id="line"></motion.div>
                                }
                                <div className={cn("flex items-center gap-2 px-4 py-2 rounded-md hover:bg-muted cursor-pointer", {
                                    "text-muted-foreground": !active,
                                })}>
                                    <Icon className={"size-4"} />
                                    {link.label}
                                </div>
                            </div>
                        </NextLink>

                    )
                })
            }
        </nav>
    )
}
