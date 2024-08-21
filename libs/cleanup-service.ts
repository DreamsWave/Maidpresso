import env from "@/env";
import {
  findUserByUsername,
  removeSubscriptionRoleFromUser,
} from "@/libs/discord";
import { getSpreadsheet } from "@/libs/sheets";
import { isExpired } from "@/utils";

let cleanupServiceId: Timer;

export default async function cleanupService() {
  const sheet = await getSpreadsheet();
  const rows = await sheet.getRows();
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
