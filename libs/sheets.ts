import env from "@/env";
import type { Donation } from "@/schemas/donation";
import type { Subscriber } from "@/schemas/subscriber";
import { getExpirationDate } from "@/utils";
import type { GuildMember } from "discord.js";
import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";
import moment from "moment";

export async function getSpreadsheet() {
  const serviceAccountAuth = new JWT({
    email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: env.GOOGLE_PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const doc = new GoogleSpreadsheet(env.GOOGLE_SHEET_ID, serviceAccountAuth);
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];
  return sheet;
}

export async function getSubscriberRowByUsername(username: string) {
  const sheet = await getSpreadsheet();
  const rows = await sheet.getRows();
  return rows.find(
    (row) => row.get("username") === String(username).toLowerCase()
  );
}

export async function createSubscriberRow(subscriber: Subscriber) {
  const sheet = await getSpreadsheet();
  const createdRow = await sheet.addRow(subscriber);
  return createdRow;
}

export async function deleteSubscriberRow(username: string) {
  const row = await getSubscriberRowByUsername(username);
  if (row) {
    await row.delete();
    return true;
  }
  return false;
}

export function createSubscriberFromDonationAndDiscordUser(
  donation: Donation,
  user: GuildMember
): Subscriber {
  const { username, amount, currency, id } = donation;
  return {
    username: String(username).toLowerCase(),
    amount,
    currency,
    donation_id: id,
    donation_created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
    expires_at: getExpirationDate(),
    discord_id: user.id,
  };
}

export async function addSubscriberToDb(subscriber: Subscriber) {
  const createdSubscriber = await createSubscriberRow(subscriber);
  return createdSubscriber.toObject();
}
