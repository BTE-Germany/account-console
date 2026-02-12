import { getPossibleLinks } from "@/app/(dashboard)/links/actions";
import getDiscordClient from "./discord";
import getKcAdminClient from "./kcAdmin";
import { log } from "console";

export async function syncUserSubscription(userId: string) {
    const kcAdmin = await getKcAdminClient()
    const user = await kcAdmin.users.findOne({ id: userId })
    if (!user) return;

    const isPlus = await kcAdmin.users.listRealmRoleMappings({ id: userId }).then(roles => roles.some(r => r.name === "plus"));

    if (user.attributes && user.attributes.minecraft_uuid) {
        await syncMinecraftSubscription(user.attributes!.minecraft_uuid[0], isPlus)
    }

    const federatedIdentities = await kcAdmin.users.listFederatedIdentities({ id: userId })
    const discordIdentity = federatedIdentities.find(identity => identity.identityProvider === "discord")
    if (discordIdentity && discordIdentity.userId) {
        await syncDiscordSubscription(discordIdentity.userId, isPlus)
    }
}

export async function syncDiscordSubscription(discordId: string, hasPlus: boolean) {
    const client = await getDiscordClient();
    const member = (await client.get(`/guilds/${process.env.DISCORD_GUILD_ID}/members/${discordId}`).catch((e) => console.error("Error fetching Discord member:", e))) as { roles: string[] } | null;
    if (!member) return;

    if (hasPlus) {
        if (member.roles.includes(process.env.DISCORD_PLUS_ROLE_ID!)) return;
        const res = await await client.patch(`/guilds/${process.env.DISCORD_GUILD_ID}/members/${discordId}`, {
            body: {
                roles: [...member.roles, process.env.DISCORD_PLUS_ROLE_ID!]
            }
        })
    } else {
        const res = await client.patch(`/guilds/${process.env.DISCORD_GUILD_ID}/members/${discordId}`, {
            body: {
                roles: member.roles.filter((role: string) => role !== process.env.DISCORD_PLUS_ROLE_ID!)
            }
        })
    }
}

export async function syncMinecraftSubscription(minecraftUuid: string, hasPlus: boolean) {
    if (hasPlus) {
        await fetch(`${process.env.LP_API_URL}/user/${minecraftUuid}/nodes`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.LP_API_KEY}`
            },
            body: JSON.stringify({
                key: `group.plus`,
                value: true,
                context: []
            })
        });
    } else {
        await fetch(`${process.env.LP_API_URL}/user/${minecraftUuid}/nodes`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.LP_API_KEY}`
            },
            body: JSON.stringify({
                key: `group.plus`,
                value: false,
                context: []
            })
        });
    }
}