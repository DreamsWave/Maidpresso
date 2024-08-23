import env from "@/env";
import logger from "@/utils/logger";
import {
  Client,
  type Collection,
  GatewayIntentBits,
  type Guild,
  type GuildMember,
  type Role,
  type Snowflake,
} from "discord.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});
let guild: Guild | undefined = undefined;
let members: Collection<Snowflake, GuildMember> | undefined = undefined;
let role: Role | undefined = undefined;

export async function initializeDiscordClient() {
  logger.debug("Discord: Initializing...");
  return new Promise<void>((resolve, reject) => {
    client.on("ready", async () => {
      try {
        guild = await client.guilds.fetch(env.DISCORD_GUILD_ID);
        members = await guild.members.fetch();
        role = findSubscriptionRole();
      } catch (error) {
        logger.error("Discord: Error initializing", error);
        reject(error);
      }

      logger.debug("Discord: Initialized successfully");
      resolve();
    });
    client.login(env.DISCORD_BOT_TOKEN);
  });
}

function findSubscriptionRole() {
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

async function fetchMembers() {
  try {
    const members = await guild?.members.fetch();
    return members;
  } catch (error) {
    logger.error("Discord: Error fetching members", error);
  }
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

export function isUserSubscribed(user: GuildMember) {
  if (!role) return false;
  return user.roles.cache.some((r) => r === role);
}

export function getSubscribers() {
  if (!role) return [];
  return [...role.members.values()];
}
