"use client"

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { type FormEvent, useMemo, useState, useTransition } from "react";
import { ExternalLinkIcon, PlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { savePersonalInfo } from "@/app/(dashboard)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { startKeycloakAction } from "@/lib/keycloak/required-action";
import type { ProfileField, ProfileFieldGroup } from "@/lib/keycloak/user-profile";
import { cn } from "@/lib/utils";

type Values = Record<string, string[]>;

const controlClassName =
    "dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:border-destructive";

const HTML5_TYPES: Record<string, string> = {
    "html5-email": "email",
    "html5-tel": "tel",
    "html5-url": "url",
    "html5-number": "number",
    "html5-range": "range",
    "html5-datetime-local": "datetime-local",
    "html5-date": "date",
    "html5-month": "month",
    "html5-time": "time",
    "html5-week": "week",
};

/** BTE-specific username rules, carried over from the previous profile form. Keycloak validates on top. */
const validateUsername = (value: string) => {
    if (value.length < 3) return "Der Benutzername muss mindestens 3 Zeichen lang sein.";
    if (value.length > 20) return "Der Benutzername darf maximal 20 Zeichen lang sein.";
    if (!/^[a-z0-9_.]+$/.test(value))
        return "Der Benutzername darf nur Kleinbuchstaben, Zahlen, Punkte und Unterstriche enthalten.";
    return undefined;
};

function validate(fields: ProfileField[], values: Values, initialValues: Values) {
    const errors: Record<string, string> = {};
    for (const field of fields) {
        if (field.readOnly) continue;
        const filled = (values[field.name] ?? []).map((value) => value.trim()).filter(Boolean);
        if (field.required && filled.length === 0) {
            errors[field.name] = `Bitte gib einen Wert für „${field.label}“ an.`;
            continue;
        }
        for (const value of filled) {
            if (field.minLength !== undefined && value.length < field.minLength) {
                errors[field.name] = `„${field.label}“ muss mindestens ${field.minLength} Zeichen lang sein.`;
            } else if (field.maxLength !== undefined && value.length > field.maxLength) {
                errors[field.name] = `„${field.label}“ darf maximal ${field.maxLength} Zeichen lang sein.`;
            }
        }
        if (field.name === "username" && filled[0] && filled[0] !== initialValues.username?.[0]) {
            const message = validateUsername(filled[0]);
            if (message) errors[field.name] = message;
        }
    }
    return errors;
}

export function PersonalInfoForm({
    fields,
    groups,
    initialValues,
    emailVerified,
}: {
    fields: ProfileField[];
    groups: ProfileFieldGroup[];
    initialValues: Values;
    emailVerified: boolean;
}) {
    const router = useRouter();
    const [values, setValues] = useState<Values>(initialValues);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [pending, startTransition] = useTransition();

    const editable = fields.some((field) => !field.readOnly);
    const dirty = useMemo(() => JSON.stringify(values) !== JSON.stringify(initialValues), [values, initialValues]);

    const sections = useMemo(() => {
        const ungrouped = fields.filter((field) => !field.group || !groups.some((group) => group.name === field.group));
        return [
            { group: undefined, fields: ungrouped },
            ...groups.map((group) => ({ group, fields: fields.filter((field) => field.group === group.name) })),
        ].filter((section) => section.fields.length > 0);
    }, [fields, groups]);

    const setFieldValues = (name: string, next: string[]) => {
        setValues((previous) => ({ ...previous, [name]: next }));
        setErrors(({ [name]: _removed, ...rest }) => rest);
    };

    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        const clientErrors = validate(fields, values, initialValues);
        setErrors(clientErrors);
        if (Object.keys(clientErrors).length > 0) return;

        const changed = Object.fromEntries(
            fields
                .filter((field) => !field.readOnly && !field.updateViaAction)
                .map((field) => [field.name, values[field.name] ?? []]),
        );

        startTransition(async () => {
            const result = await savePersonalInfo(changed);
            if (result.status === "success") {
                toast.success(result.message);
                if (result.reauthenticate) {
                    // Get fresh tokens so that the new username / email appears everywhere.
                    await signIn("keycloak", { callbackUrl: "/" });
                } else {
                    router.refresh();
                }
                return;
            }
            setErrors(result.fieldErrors ?? {});
            toast.error(result.message);
        });
    };

    return (
        <form onSubmit={onSubmit} className={"space-y-10"} noValidate>
            {sections.map(({ group, fields: sectionFields }) => (
                <section key={group?.name ?? "_default"} className={"space-y-6"}>
                    {group && (group.header || group.description) && (
                        <div className={"border-b border-border pb-2"}>
                            {group.header && <h3 className={"font-semibold"}>{group.header}</h3>}
                            {group.description && <p className={"text-sm text-muted-foreground"}>{group.description}</p>}
                        </div>
                    )}
                    {sectionFields.map((field) => (
                        <ProfileFieldInput
                            key={field.name}
                            field={field}
                            values={values[field.name] ?? []}
                            error={errors[field.name]}
                            emailVerified={emailVerified}
                            disabled={pending}
                            onChange={(next) => setFieldValues(field.name, next)}
                        />
                    ))}
                </section>
            ))}

            {editable && (
                <div className={"flex items-center gap-2"}>
                    <Button type="submit" disabled={pending || !dirty}>
                        {pending && <Spinner />}
                        Speichern
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        disabled={pending || !dirty}
                        onClick={() => {
                            setValues(initialValues);
                            setErrors({});
                        }}
                    >
                        Zurücksetzen
                    </Button>
                </div>
            )}
        </form>
    );
}

function ProfileFieldInput({
    field,
    values,
    error,
    emailVerified,
    disabled,
    onChange,
}: {
    field: ProfileField;
    values: string[];
    error?: string;
    emailVerified: boolean;
    disabled: boolean;
    onChange: (values: string[]) => void;
}) {
    const id = `profile-${field.name}`;
    const readOnly = field.readOnly || field.updateViaAction;
    const describedBy = [field.helperTextBefore && `${id}-before`, field.helperTextAfter && `${id}-after`, error && `${id}-error`]
        .filter(Boolean)
        .join(" ") || undefined;
    const common = {
        id,
        disabled: disabled || readOnly,
        "aria-invalid": !!error,
        "aria-describedby": describedBy,
        "aria-required": field.required,
    };

    const single = values[0] ?? "";
    let control: React.ReactNode;

    if (field.options && (field.inputType === "select-radiobuttons" || field.inputType === "multiselect-checkboxes")) {
        const multiple = field.inputType === "multiselect-checkboxes";
        control = (
            <div className={"flex flex-col gap-2"} role={multiple ? "group" : "radiogroup"} aria-labelledby={`${id}-label`}>
                {field.options.map((option) => (
                    <label key={option.value} className={"flex items-center gap-2 text-sm"}>
                        <input
                            type={multiple ? "checkbox" : "radio"}
                            name={field.name}
                            value={option.value}
                            checked={values.includes(option.value)}
                            disabled={common.disabled}
                            className={"accent-primary size-4"}
                            onChange={(event) =>
                                onChange(
                                    multiple
                                        ? event.target.checked
                                            ? [...values, option.value]
                                            : values.filter((value) => value !== option.value)
                                        : [option.value],
                                )
                            }
                        />
                        {option.label}
                    </label>
                ))}
            </div>
        );
    } else if (field.options) {
        const multiple = field.inputType === "multiselect" || field.multivalued;
        control = (
            <select
                {...common}
                multiple={multiple}
                className={cn(controlClassName, multiple ? "min-h-24 py-2" : "h-9")}
                value={multiple ? values : single}
                onChange={(event) =>
                    onChange(
                        multiple
                            ? Array.from(event.target.selectedOptions).map((option) => option.value)
                            : [event.target.value],
                    )
                }
            >
                {!multiple && <option value="">{field.required ? "Bitte auswählen" : "Keine Angabe"}</option>}
                {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        );
    } else if (field.inputType === "textarea") {
        control = (
            <textarea
                {...common}
                className={cn(controlClassName, "min-h-24 py-2")}
                placeholder={field.placeholder}
                value={single}
                onChange={(event) => onChange([event.target.value])}
            />
        );
    } else if (field.multivalued && !readOnly) {
        const rows = values.length > 0 ? values : [""];
        control = (
            <div className={"flex flex-col gap-2"}>
                {rows.map((value, index) => (
                    <div key={index} className={"flex gap-2"}>
                        <Input
                            {...common}
                            id={index === 0 ? id : `${id}-${index}`}
                            type={HTML5_TYPES[field.inputType] ?? "text"}
                            placeholder={field.placeholder}
                            value={value}
                            onChange={(event) => onChange(rows.map((entry, i) => (i === index ? event.target.value : entry)))}
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Wert ${index + 1} entfernen`}
                            disabled={disabled || rows.length === 1}
                            onClick={() => onChange(rows.filter((_, i) => i !== index))}
                        >
                            <XIcon />
                        </Button>
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm" className={"self-start"} disabled={disabled} onClick={() => onChange([...rows, ""])}>
                    <PlusIcon />
                    Wert hinzufügen
                </Button>
            </div>
        );
    } else {
        control = (
            <Input
                {...common}
                type={HTML5_TYPES[field.inputType] ?? "text"}
                placeholder={field.placeholder}
                autoComplete={field.name === "email" ? "email" : field.name === "username" ? "username" : undefined}
                value={field.multivalued ? values.join(", ") : single}
                onChange={(event) => onChange([event.target.value])}
            />
        );
    }

    return (
        <div className={"space-y-2"}>
            <div className={"flex flex-wrap items-center gap-2"}>
                <Label htmlFor={id} id={`${id}-label`}>
                    {field.label}
                    {field.required && !readOnly && <span className={"text-destructive"} aria-hidden>*</span>}
                </Label>
                {field.name === "email" && single && (
                    <Badge variant={emailVerified ? "secondary" : "destructive"}>
                        {emailVerified ? "Bestätigt" : "Nicht bestätigt"}
                    </Badge>
                )}
                {field.readOnly && <Badge variant={"outline"}>Nicht änderbar</Badge>}
            </div>
            {field.helperTextBefore && (
                <p id={`${id}-before`} className={"text-sm text-muted-foreground"}>
                    {field.helperTextBefore}
                </p>
            )}
            {control}
            {field.updateViaAction && (
                <Button type="button" variant="link" className={"h-auto p-0"} onClick={() => startKeycloakAction("UPDATE_EMAIL")}>
                    E-Mail-Adresse ändern
                    <ExternalLinkIcon />
                </Button>
            )}
            {field.helperTextAfter && (
                <p id={`${id}-after`} className={"text-sm text-muted-foreground"}>
                    {field.helperTextAfter}
                </p>
            )}
            {field.name === "email" && !field.readOnly && !field.updateViaAction && (
                <p className={"text-sm text-muted-foreground"}>
                    Nachdem du deine E-Mail-Adresse geändert hast, musst du sie erneut bestätigen.
                </p>
            )}
            {error && (
                <p id={`${id}-error`} className={"text-sm text-destructive"}>
                    {error}
                </p>
            )}
        </div>
    );
}
