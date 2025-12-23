"use client"

import { motion } from "motion/react"
import {Link, Sparkles, User} from "lucide-react";
import NextLink from "next/link";
import {usePathname} from "next/navigation";
import {cn} from "@/lib/utils";

export const DashboardNavigation = () => {

    const links = [
        {
            link: "/",
            icon: User,
            label: "Profildaten"
        },
        {
            link: "/links",
            icon: Link,
            label: "Verbundene Konten"
        },
        {
            link: "/plus",
            icon: Sparkles,
            label: "Plus Rang"
        }
    ]

    const path = usePathname()

    return (
        <>
            {
                links.map((link, index) => {
                    const Icon = link.icon;
                    return (
                        <NextLink href={link.link} key={index} className={"w-full"}>
                            <div className={"relative"}>
                                {
                                    path === link.link &&  <motion.div className={"absolute h-full w-1 bg-primary rounded-full -left-2"} layoutId="line"
                                                                       id="line"></motion.div>
                                }
                                <div className={cn("flex items-center gap-2 px-4 py-2 rounded-md hover:bg-muted cursor-pointer", {
                                    "text-muted-foreground": path !== link.link,
                                })}>
                                    <Icon className={"size-4"} />
                                    { link.label}
                                </div>
                            </div>
                        </NextLink>

                    )
                })
            }
        </>
    )
}