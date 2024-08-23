import env from "@/env";
import type { Donation } from "@/schemas/donation";
import type { Subscription } from "@/schemas/subscription";
import { getExpirationDate } from "@/utils/expiration";
import logger from "@/utils/logger";
import type { GuildMember } from "discord.js";
import { JWT } from "google-auth-library";
import {
  GoogleSpreadsheet,
  type GoogleSpreadsheetWorksheet,
} from "google-spreadsheet";
import moment from "moment";

export let sheet: GoogleSpreadsheetWorksheet | null = null;

export async function initializeDB() {
  logger.debug("Database: Initializing...");

  const serviceAccountAuth = new JWT({
    email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: env.GOOGLE_PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  try {
    const doc = new GoogleSpreadsheet(env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    const loadedSheet = doc.sheetsById[0];
    if (!loadedSheet) {
      throw new Error("Sheet not found");
    }
    sheet = loadedSheet;
    logger.debug("Database: Initialized successfully");
  } catch (error) {
    logger.error(error, "Database: Initialization error");
    throw error;
  }
}

export async function getSubscriptionByUsername(
  username: string,
  { isRow = false }: { isRow?: boolean } = {}
) {
  if (!sheet) throw new Error("Sheet not initialized");
  const rows = await sheet.getRows();
  const row = rows.find(
    (row) => row.get("username") === String(username).toLowerCase()
  );
  if (!row) return null;

  if (isRow) {
    return row;
  }

  return row.toObject();
}

export async function deleteSubscriberByUsername(username: string) {
  const row = await getSubscriptionByUsername(username, { isRow: true });
  if (row) {
    await row.delete();
    return true;
  }
  return false;
}

export function createSubscriptionFromDonationAndDiscordUser(
  donation: Donation,
  discordUser: GuildMember
): Subscription {
  const { username, amount, currency, id } = donation;
  return {
    username: String(username).toLowerCase(),
    amount,
    currency,
    donation_id: id,
    donation_created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
    expires_at: getExpirationDate(),
    discord_id: discordUser.id,
  };
}

export async function addSubscription(subscription: Subscription) {
  if (!sheet) throw new Error("Sheet not initialized");
  const addedSubscription = await sheet?.addRow(subscription);
  if (!addedSubscription) throw new Error("Failed to add subscription");
  return addedSubscription.toObject();
}
