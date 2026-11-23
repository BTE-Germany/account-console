"use client";

import { type ComponentProps, type ReactNode, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

type ConfirmButtonProps = {
    children: ReactNode;
    title: string;
    description: ReactNode;
    confirmLabel: string;
    onConfirm: () => Promise<void> | void;
    variant?: ComponentProps<typeof Button>["variant"];
    size?: ComponentProps<typeof Button>["size"];
};

/** Button that asks for confirmation in a dialog before running an action. */
export function ConfirmButton({
    children,
    title,
    description,
    confirmLabel,
    onConfirm,
    variant = "destructive",
    size = "sm",
}: ConfirmButtonProps) {
    const [open, setOpen] = useState(false);
    const [pending, startTransition] = useTransition();

    return (
        <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
            <DialogTrigger asChild>
                <Button variant={variant} size={size}>
                    {children}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" disabled={pending}>
                            Abbrechen
                        </Button>
                    </DialogClose>
                    <Button
                        variant={variant === "destructive" ? "destructive" : "default"}
                        disabled={pending}
                        onClick={() =>
                            startTransition(async () => {
                                await onConfirm();
                                setOpen(false);
                            })
                        }
                    >
                        {pending && <Spinner />}
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
