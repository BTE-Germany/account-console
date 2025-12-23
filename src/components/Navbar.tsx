"use client"

import {signOut, useSession} from "next-auth/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {LogOut} from "lucide-react";

export default function Navbar() {

    const session = useSession();


    return (
        <div className={"border-b border-border py-5"}>
            <div className={"container mx-auto flex items-center justify-between gap-4 px-4"}>
                <div className={"flex items-center gap-4"}>
                    <img src="https://cdn.bte-germany.de/general/logos/Logo.png" alt="BTE Germany Logo" className={"size-8"}/>
                    <p className={"font-medium"}>Account Console</p>
                </div>
                <div className={"flex items-center gap-4"}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Avatar className="h-8 w-8 rounded-lg cursor-pointer">
                                <AvatarImage alt={session.data?.user.username} />
                                <AvatarFallback className="rounded-lg">
                                    {session.data?.user.username
                                        .toUpperCase()
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')}
                                </AvatarFallback>
                            </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                            side={'bottom' }
                            align="end"
                            sideOffset={4}
                        >
                            <DropdownMenuLabel>Hey, {session.data?.user.username}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => signOut()} variant={'destructive'}>
                                <LogOut />
                                Abmelden
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    )
}