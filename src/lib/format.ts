const dateTimeFormat = new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
});

const dateFormat = new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeZone: "Europe/Berlin",
});

/** Formats a timestamp in milliseconds. */
export const formatDateTime = (milliseconds: number) => dateTimeFormat.format(new Date(milliseconds));

/** Formats a timestamp in milliseconds as a date only. */
export const formatDate = (milliseconds: number) => dateFormat.format(new Date(milliseconds));

/** Formats a timestamp in seconds (as used by Keycloak sessions). */
export const formatEpochSeconds = (seconds: number) => formatDateTime(seconds * 1000);
