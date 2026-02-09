'use client';

import { signIn, useSession } from 'next-auth/react';

import { useRouter } from 'next/navigation';
import { use, useEffect, useRef } from 'react';
import { Spinner } from "@/components/ui/spinner";

export default function SigninPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const callbackUrl = use(searchParams).callbackUrl as string
    const router = useRouter();
    const { status } = useSession();
    const hasTriggeredSignin = useRef(false);

    useEffect(() => {
        if (status === 'unauthenticated' && !hasTriggeredSignin.current) {
            console.log('No JWT');
            console.log(status);
            hasTriggeredSignin.current = true;
            void signIn('keycloak', { callbackUrl: callbackUrl || "/", redirect: true });
        } else if (status === 'authenticated') {
            void router.push('/');
        }
    }, [status, router, callbackUrl]);

    return <div className={"h-full flex-1 w-full flex flex-col gap-5 justify-center items-center"}>
        <Spinner className={"text-muted-foreground size-12"} />
        <p className={"text-muted-foreground"}>Du wirst zum Login weitergeleitet...</p>
    </div>;
}