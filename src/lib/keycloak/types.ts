/**
 * Representations of the Keycloak Account REST API.
 * Based on `js/apps/account-ui/src/api/representations.ts` from Keycloak 26.8.
 */

export interface UserProfileAttributeMetadata {
    name: string;
    displayName?: string;
    required: boolean;
    readOnly: boolean;
    annotations?: Record<string, unknown>;
    validators?: Record<string, Record<string, unknown>>;
    group?: string;
    multivalued?: boolean;
    defaultValue?: string;
}

export interface UserProfileAttributeGroupMetadata {
    name: string;
    displayHeader?: string;
    displayDescription?: string;
    annotations?: Record<string, unknown>;
}

export interface UserProfileMetadata {
    attributes: UserProfileAttributeMetadata[];
    groups?: UserProfileAttributeGroupMetadata[];
}

export interface PersonalInfo {
    id?: string;
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    emailVerified?: boolean;
    attributes?: Record<string, string[]>;
    userProfileMetadata?: UserProfileMetadata;
}

export interface CredentialMetadataMessage {
    key: string;
    parameters?: string[];
}

export interface CredentialRepresentation {
    id: string;
    type: string;
    userLabel?: string;
    createdDate?: number;
}

export interface CredentialMetadataRepresentation {
    infoMessage?: CredentialMetadataMessage;
    infoProperties?: CredentialMetadataMessage[];
    warningMessageTitle?: CredentialMetadataMessage;
    warningMessageDescription?: CredentialMetadataMessage;
    credential: CredentialRepresentation;
    iconLight?: string;
    iconDark?: string;
}

export type CredentialCategory = "basic-authentication" | "two-factor" | "passwordless" | string;

export interface CredentialContainer {
    type: string;
    category: CredentialCategory;
    displayName: string;
    helptext: string;
    iconCssClass?: string;
    createAction?: string;
    updateAction?: string;
    removeable: boolean;
    userCredentialMetadatas: CredentialMetadataRepresentation[];
}

export interface SessionClientRepresentation {
    clientId: string;
    clientName?: string;
    userConsentRequired?: boolean;
    inUse?: boolean;
    offlineAccess?: boolean;
}

export interface SessionRepresentation {
    id: string;
    ipAddress: string;
    /** Seconds since epoch */
    started: number;
    /** Seconds since epoch */
    lastAccess: number;
    /** Seconds since epoch */
    expires: number;
    clients: SessionClientRepresentation[];
    browser: string;
    current?: boolean;
}

export interface DeviceRepresentation {
    id?: string;
    ipAddress?: string;
    os: string;
    osVersion: string;
    browser?: string;
    device: string;
    /** Seconds since epoch */
    lastAccess: number;
    current?: boolean;
    mobile: boolean;
    sessions: SessionRepresentation[];
}

export interface ConsentScopeRepresentation {
    id: string;
    name: string;
    displayText?: string;
}

export interface ConsentRepresentation {
    grantedScopes: ConsentScopeRepresentation[];
    /** Milliseconds since epoch */
    createdDate: number;
    /** Milliseconds since epoch */
    lastUpdatedDate: number;
}

export interface ApplicationRepresentation {
    clientId: string;
    clientName?: string;
    description?: string;
    userConsentRequired: boolean;
    inUse: boolean;
    offlineAccess: boolean;
    rootUrl?: string;
    baseUrl?: string;
    effectiveUrl?: string;
    consent?: ConsentRepresentation;
    logoUri?: string;
    policyUri?: string;
    tosUri?: string;
}

export interface OrganizationDomainRepresentation {
    name: string;
    verified?: boolean;
}

export interface OrganizationRepresentation {
    id?: string;
    name?: string;
    alias?: string;
    description?: string;
    enabled?: boolean;
    redirectUrl?: string;
    /** The Account API (26.8) sends plain domain names, the Admin API sends objects. */
    domains?: (string | OrganizationDomainRepresentation)[];
}
