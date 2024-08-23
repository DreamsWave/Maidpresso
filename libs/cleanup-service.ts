import env from "@/env";
import { sheet } from "@/libs/db";
import {
  findUserByUsername,
  getSubscribers,
  removeSubscriptionRoleFromUser,
} from "@/libs/discord";
import { isExpired } from "@/utils/expiration";
import logger from "@/utils/logger";
import type { GuildMember } from "discord.js";
import type { GoogleSpreadsheetRow } from "google-spreadsheet";

let cleanupServiceId: Timer;
const cleanTime =
  Bun.env.NODE_ENV === "development"
    ? 20000
    : Number(env.CLEAN_SUBS_TIME_IN_MINUTES) * 60 * 1000;

export async function initializeCleanupService() {
  logger.debug("CleanupService: Initializing...");
  try {
    await cleanupService();
    cleanupServiceId = setInterval(cleanupService, cleanTime);
    logger.debug("CleanupService: Initialized successfully");
  } catch (error) {
    logger.error(error, "CleanupService: Error initializing");
    throw error;
  }
  return cleanupServiceId;
}

export async function stopCleanupService() {
  clearInterval(cleanupServiceId);
  logger.debug("CleanupService: Stopped");
}

/* This function is responsible for cleaning up the subscription
   and removing the subscription role from the user if the subscription
   has expired or if the user is not subscribed anymore */
export default async function cleanupService() {
  logger.debug("CleanupService: Running...");
  if (!sheet) throw new Error("CleanupService: Spreadsheet not initialized");

  const rows = await sheet.getRows();
  const subscribers = getSubscribers();

  // Remove stale subscriptions from the sheet
  await removeStaleSubscriptions(rows, subscribers);

  // Remove subscription roles from users without a corresponding subscription
  await removeOrphanedSubscriptionRoles(rows, subscribers);

  // Check for expired subscriptions and remove them
  await removeExpiredSubscriptions(rows);

  logger.debug("CleanupService: Completed");
}

async function removeStaleSubscriptions(
  rows: GoogleSpreadsheetRow[],
  subscribers: GuildMember[]
) {
  for (const row of rows) {
    const username = row.get("username");
    const subscriber = subscribers.find(
      (sub) => sub.user.username === username
    );

    if (!subscriber) {
      // User not found in subscribers, remove the stale row
      await row.delete();
      logger.info(`Removed stale subscription for ${username} from the sheet`);
    }
  }
}

async function removeOrphanedSubscriptionRoles(
  rows: GoogleSpreadsheetRow[],
  subscribers: GuildMember[]
) {
  for (const subscriber of subscribers) {
    const username = subscriber.user.username;
    const subscribedRow = rows.find((row) => row.get("username") === username);

    if (!subscribedRow) {
      // No row found for the subscriber, remove the subscription role
      await removeSubscriptionRoleFromUser(subscriber);
      logger.info(`Removed discord role subscription for ${username}`);
    }
  }
}

async function removeExpiredSubscriptions(rows: GoogleSpreadsheetRow[]) {
  for (const row of rows) {
    if (isExpired(row.get("expires_at"))) {
      const username = row.get("username");
      const discordUser = await findUserByUsername(username);
      if (discordUser) await removeSubscriptionRoleFromUser(discordUser);
      await row.delete();
      logger.info(`Removed expired subscription for ${username}`);
    }
  }
}
