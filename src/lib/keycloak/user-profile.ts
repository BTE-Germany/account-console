import { type Messages, translate, unwrapBundleKey } from "@/lib/keycloak/messages";
import type {
    PersonalInfo,
    UserProfileAttributeMetadata,
    UserProfileMetadata,
} from "@/lib/keycloak/types";

/** Attributes that Keycloak keeps on the user itself instead of in `attributes`. */
export const ROOT_ATTRIBUTES = ["username", "email", "firstName", "lastName"] as const;
type RootAttribute = (typeof ROOT_ATTRIBUTES)[number];

export const isRootAttribute = (name: string): name is RootAttribute =>
    (ROOT_ATTRIBUTES as readonly string[]).includes(name);

/**
 * Attributes that are managed elsewhere in this console and must not be edited in the profile
 * form (the Minecraft link lives on /links). They are still sent back unchanged when saving.
 */
const MANAGED_ELSEWHERE = new Set(["minecraft_uuid"]);

export const isHiddenAttribute = (attribute: UserProfileAttributeMetadata) =>
    MANAGED_ELSEWHERE.has(attribute.name) || attribute.annotations?.inputType === "hidden";

export type ProfileFieldOption = { value: string; label: string };

export type ProfileField = {
    name: string;
    label: string;
    required: boolean;
    readOnly: boolean;
    multivalued: boolean;
    inputType: string;
    group?: string;
    options?: ProfileFieldOption[];
    placeholder?: string;
    helperTextBefore?: string;
    helperTextAfter?: string;
    minLength?: number;
    maxLength?: number;
    /** Email can only be changed through Keycloak's UPDATE_EMAIL action. */
    updateViaAction?: boolean;
};

export type ProfileFieldGroup = {
    name: string;
    header?: string;
    description?: string;
};

const asString = (value: unknown) => (typeof value === "string" && value.length > 0 ? value : undefined);
const asNumber = (value: unknown) => {
    const number = typeof value === "number" ? value : Number(value);
    return Number.isFinite(number) ? number : undefined;
};

/** Labels for built-in attributes that Keycloak's message bundle does not translate. */
const FALLBACK_LABELS: Record<string, string> = {
    locale: "Sprache",
};

/** Label of a user profile attribute, resolved the same way as in Keycloak's ui-shared `label()`. */
export const attributeLabel = (messages: Messages, attribute: Pick<UserProfileAttributeMetadata, "name" | "displayName">) => {
    const fallback = FALLBACK_LABELS[attribute.name] ?? attribute.name;
    const displayName = attribute.displayName;
    // Keycloak sends e.g. `locale` with the attribute name itself as display name.
    if (displayName && displayName !== attribute.name) {
        const key = unwrapBundleKey(displayName);
        return key ? translate(messages, key, [], fallback) : displayName;
    }
    return translate(messages, attribute.name, [], fallback);
};

const localeLabel = (locale: string) => {
    try {
        const name = new Intl.DisplayNames(["de"], { type: "language" }).of(locale);
        return name ? name.charAt(0).toUpperCase() + name.slice(1) : locale;
    } catch {
        return locale;
    }
};

function buildOptions(
    attribute: UserProfileAttributeMetadata,
    messages: Messages,
    supportedLocales: string[],
): ProfileFieldOption[] | undefined {
    if (attribute.name === "locale") {
        return supportedLocales.map((locale) => ({ value: locale, label: localeLabel(locale) }));
    }

    const values = attribute.validators?.options?.options;
    if (!Array.isArray(values)) return undefined;

    const labels = (attribute.annotations?.inputOptionLabels ?? {}) as Record<string, string>;
    const i18nPrefix = asString(attribute.annotations?.inputOptionLabelsI18nPrefix);

    return values.map((value) => {
        const option = String(value);
        const label = labels[option]
            ? translate(messages, labels[option], [], option)
            : i18nPrefix
              ? translate(messages, `${i18nPrefix}.${option}`, [], option)
              : option;
        return { value: option, label };
    });
}

function defaultInputType(attribute: UserProfileAttributeMetadata, options?: ProfileFieldOption[]) {
    const annotated = asString(attribute.annotations?.inputType);
    if (annotated) return annotated;
    if (options) return attribute.multivalued ? "multiselect" : "select";
    if (attribute.name === "email") return "html5-email";
    return "text";
}

export function buildProfileForm(
    metadata: UserProfileMetadata | undefined,
    messages: Messages,
    supportedLocales: string[],
): { fields: ProfileField[]; groups: ProfileFieldGroup[] } {
    const fields = (metadata?.attributes ?? [])
        .filter((attribute) => !isHiddenAttribute(attribute))
        .map((attribute): ProfileField => {
            const options = buildOptions(attribute, messages, supportedLocales);
            const annotations = attribute.annotations ?? {};
            const length = attribute.validators?.length ?? {};
            const helper = (key: string) => {
                const text = asString(annotations[key]);
                return text ? translate(messages, text) : undefined;
            };

            return {
                name: attribute.name,
                label: attributeLabel(messages, attribute),
                required: attribute.required,
                readOnly: attribute.readOnly,
                multivalued: !!attribute.multivalued,
                inputType: defaultInputType(attribute, options),
                group: attribute.group,
                options,
                placeholder: helper("inputTypePlaceholder"),
                helperTextBefore: helper("inputHelperTextBefore"),
                helperTextAfter: helper("inputHelperTextAfter"),
                minLength: asNumber(length.min),
                maxLength: asNumber(length.max),
                updateViaAction: attribute.name === "email" && !!annotations["kc.required.action.supported"],
            };
        });

    const groups = (metadata?.groups ?? []).map((group) => ({
        name: group.name,
        header: group.displayHeader ? translate(messages, group.displayHeader) : undefined,
        description: group.displayDescription ? translate(messages, group.displayDescription) : undefined,
    }));

    return { fields, groups };
}

/** Current values of all attributes, root attributes included. */
export function getAttributeValues(info: PersonalInfo, name: string): string[] {
    if (isRootAttribute(name)) {
        const value = info[name];
        return value ? [value] : [];
    }
    return info.attributes?.[name] ?? [];
}
