import env from "@/env";
import { sheet } from "@/libs/db";
import {
  findUserByUsername,
  getSubscribers,
  removeSubscriptionRoleFromUser,
} from "@/libs/discord";
import { isExpired } from "@/utils";

let cleanupServiceId: Timer;

/* This function is responsible for cleaning up the subscription
   and removing the subscription role from the user if the subscription
   has expired or if the user is not subscribed anymore */
export default async function cleanupService() {
  if (!sheet) throw new Error("Spreadsheet not initialized");
  const rows = await sheet.getRows();
  const subscribers = getSubscribers();

  /* Checking if user is not subscribed and removing subscription role if not */
  console.info("Checking if user has subscribed");
  for (const subscriber of subscribers) {
    const isSubscribed = rows.some(
      (row) => row.get("username") === subscriber.user.username
    );
    if (!isSubscribed) {
      const discordUser = await findUserByUsername(subscriber.user.username);
      if (discordUser) await removeSubscriptionRoleFromUser(discordUser);
      console.info(`Removed subscription for ${subscriber.user.username}`);
    }
  }

  /* Checking if subscription has expired and deleting it
  from the database and removing subscription role from user */
  for (const row of rows) {
    if (isExpired(row.get("expires_at"))) {
      const discordUser = await findUserByUsername(row.get("username"));
      if (discordUser) await removeSubscriptionRoleFromUser(discordUser);
      await row.delete();
      console.info(`Removed subscription for ${row.get("username")}`);
    }
  }
}

export async function initializeCleanupService() {
  console.info("Initializing cleanup service");
  try {
    await cleanupService();
    cleanupServiceId = setInterval(
      cleanupService,
      Number(env.CLEAN_SUBS_TIME_IN_MINUTES) * 60 * 1000
    );
    console.info("Cleanup service initialized successfully");
  } catch (error) {
    console.error("Error starting cleanup service:", error);
  }
  return cleanupServiceId;
}

export async function stopCleanupService() {
  clearInterval(cleanupServiceId);
  console.info("Cleanup service stopped");
}
