import type { ReactNode } from "react";

export function SectionHeader({
    title,
    description,
    action,
}: {
    title: string;
    description?: ReactNode;
    action?: ReactNode;
}) {
    return (
        <div className={"mb-8 flex flex-wrap items-start justify-between gap-4"}>
            <div>
                <h2 className={"text-xl font-bold"}>{title}</h2>
                {description && <p className={"mt-1 text-sm text-muted-foreground"}>{description}</p>}
            </div>
            {action}
        </div>
    );
}
