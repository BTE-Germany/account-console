"use server"

import getKcAdminClient from "@/lib/kcAdmin";
import {getSession} from "@/lib/auth";
import axios from "axios";
import jwt from "jsonwebtoken";

export async function getUserLinks() {
    const kcAdminClient = await getKcAdminClient()
    const session = await getSession()
    if (!kcAdminClient || !session) {
        return null
    }
    const user = await kcAdminClient.users.findOne({id: session.user.id})
    return user?.federatedIdentities || []
}

export async function getPossibleLinks() {
    const kcAdminClient = await getKcAdminClient()
    return kcAdminClient.identityProviders.find()
}

export async function unlinkAccount(identityProvider: string) {
    const kcAdminClient = await getKcAdminClient()
    const session = await getSession()
    if (!kcAdminClient || !session) return null;

    const user = await kcAdminClient.users.findOne({id: session.user.id})

    if (!user) return null;
    if (!user.federatedIdentities) return null;
    if (!user.federatedIdentities.some(identity => identity.identityProvider === identityProvider)) return null;

    const federatedIdentity = await kcAdminClient.identityProviders.findOne({alias: identityProvider})

    if (!federatedIdentity || !federatedIdentity.alias) return null;


    await kcAdminClient.users.delFromFederatedIdentity({
        id: session.user.id,
        federatedIdentityId: federatedIdentity?.alias
    })
    return true
}

export async function getMinecraftUsernameFromUUID(uuid: string) {
    const {data} = await axios.get(`https://playerdb.co/api/player/minecraft/${uuid}`)
    if (data.code !== "player.found") return null;
    return data.data.player.username
}

export async function linkMinecraftAccount(token: string) {
    const kcAdminClient = await getKcAdminClient()
    const session = await getSession()
    if (!kcAdminClient || !session) return null;

    try {
        const decoded = jwt.verify(token, process.env.MC_LINK_SECRET || "")
        const {sub} = decoded as { sub: string }

        const user = await kcAdminClient.users.findOne({id: session.user.id})
        if (!user) throw new Error("User not found");
        if (user.attributes?.minecraft_uuid) throw new Error("User already has a Minecraft UUID");

        await kcAdminClient.users.update({id: session.user.id}, {
            username: user.username,
            attributes: {
                ...user.attributes,
                minecraft_uuid: sub
            }
        })
        return true
    } catch (e) {
        console.log(e)
        return null
    }
}

export async function unlinkMinecraftAccount() {
    const kcAdminClient = await getKcAdminClient()
    const session = await getSession()
    if (!kcAdminClient || !session) return null;
    const user = await kcAdminClient.users.findOne({id: session.user.id})
    if (!user) return null;
    if (!user.attributes) return null;
    if (!user.attributes.minecraft_uuid) return null;
    await kcAdminClient.users.update({id: session.user.id}, {
        username: user.username,
        attributes: {
            ...user.attributes,
            minecraft_uuid: undefined
        }
    })
    return true
}

export async function getMinecraftLink(): Promise<{status: boolean, username: string}> {
    const session = await getSession()
    const kcAdminClient = await getKcAdminClient()
    if (!kcAdminClient || !session) return {status: false, username: ""}

    const user = await kcAdminClient.users.findOne({id: session.user.id})

    if (!user) return {status: false, username: ""};

    if (!user.attributes) return {status: false, username: ""};
    if (!user.attributes.minecraft_uuid) return {status: false, username: ""};

    const username = await getMinecraftUsernameFromUUID(user.attributes.minecraft_uuid)
    if (!username) return {status: true, username: ""};
    return {status: true, username}

}
