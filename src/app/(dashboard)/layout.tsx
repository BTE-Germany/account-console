import Image from "next/image";
import KeyImage from "../../../public/key_image.png";
import { getSession } from "@/lib/auth";
import { DashboardNavigation } from "@/components/dashboard/DashboardNavigation";

export default async function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {

    const session = await getSession()

    return (
        <>
            <div className={"bg-gradient-to-t from-primary/20 to-transparent py-35"}>
                <div className={"container mx-auto px-4"}>
                    <Image src={KeyImage} alt={"Key"} className={"size-20 mb-6"} />
                    <p className={"uppercase text-sm font-medium text-muted-foreground mb-4"}>
                        BTE Germany Account Console
                    </p>
                    <h1 className={"text-5xl font-bold"}>
                        Schön, dass du da bist, {session?.user.username}.
                    </h1>
                </div>
            </div>
            <div className={"container mx-auto px-4 py-8"}>
                <div className={"grid grid-cols-4 gap-4"}>
                    <div className={"col-span-4 lg:col-span-1"}>
                        <DashboardNavigation />
                    </div>
                    <div className={"col-span-4 lg:col-span-3 bg-card p-6 rounded-lg border border-border"}>
                        {children}
                    </div>
                </div>

            </div>
        </>
    )
}
