
export default async function Layout({
                                         children,
                                     }: Readonly<{
    children: React.ReactNode;
}>) {


    return (
        <>
            <div className={""}>
                <h2 className={"text-xl font-bold mb-8"}>
                    BTE Germany Plus Rang
                </h2>

                { children}
            </div>
        </>
    )
}
