"use server"

export const getKeycloakUrl = async () => {
    return process.env.KEYCLOAK_URL || "http://localhost:8080"
}
