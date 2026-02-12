import { REST } from '@discordjs/rest';

let discordClient: REST | null = null;

export default async function getDiscordClient(): Promise<REST> {
    if (!discordClient) {
        discordClient = await loginDiscord();
    }

    return discordClient
}


async function loginDiscord(): Promise<REST> {
    return new Promise((resolve, reject) => {
        const client = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN!);

        client.get('/users/@me')
            .then(() => {
                console.log('Successfully logged in to Discord');
                resolve(client);
            })
            .catch(() => {
                reject();
            });
    });
}