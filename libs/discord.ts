import env from "@/env";
import { Client, type Guild, type GuildMember, type Role } from "discord.js";

const client = new Client({ intents: "Guilds" });
let guild: Guild | undefined = undefined;
let role: Role | undefined = undefined;

export function initializeDiscordClient() {
  console.info("Initializing Discord client");
  return new Promise<void>((resolve, reject) => {
    client.on("ready", async () => {
      try {
        guild = findGuild();
        role = findRole();
      } catch (error) {
        console.error("Error initializing Discord client:", error);
        reject(error);
      }

      console.info("Discord client initialized successfully");
      resolve();
    });
    client.login(env.DISCORD_BOT_TOKEN);
  });
}

function findGuild() {
  const foundGuild = client.guilds.cache.find(
    (guild) => guild.id === env.DISCORD_GUILD_ID
  );
  if (!foundGuild) {
    throw new Error("Guild not found");
  }
  return foundGuild;
}

function findRole() {
  const foundRole = guild?.roles.cache.find((role) => {
    if (env.DISCORD_SUB_ROLE_NAME)
      return role.name === env.DISCORD_SUB_ROLE_NAME;
    return role.id === env.DISCORD_SUB_ROLE_ID;
  });
  if (!foundRole) {
    throw new Error("Role not found");
  }
  return foundRole;
}

export async function findUserByUsername(username: string) {
  const usernameToSearch = username.toLowerCase();
  const members = await guild?.members.search({ query: usernameToSearch });
  const member = members?.find(
    (member) => member.user.username.toLowerCase() === usernameToSearch
  );

  if (!member) {
    return null;
  }

  return member;
}

export function addSubscriptionRoleToUser(user: GuildMember) {
  if (!role) return null;
  return user.roles.add(role);
}

export function removeSubscriptionRoleFromUser(user: GuildMember) {
  if (!role) return null;
  return user.roles.remove(role);
}
