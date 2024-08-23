import env from "@/env";
import type { Donation } from "@/schemas/donation";
import type { DonationAlertsUser } from "@/types";
import { containsWord } from "@/utils/common";
import logger from "@/utils/logger";
import Centrifuge from "centrifuge";
import WebSocket from "ws";

global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

export const centrifuge = new Centrifuge(
  "wss://centrifugo.donationalerts.com/connection/websocket",
  {
    websocket: WebSocket,
    subscribeEndpoint:
      "https://www.donationalerts.com/api/v1/centrifuge/subscribe",
    subscribeHeaders: {
      Authorization: `Bearer ${env.DONATION_ALERTS_ACCESS_TOKEN}`,
    },
  }
);

export async function getDonationAlertsUser(
  accessToken: string
): Promise<DonationAlertsUser> {
  const url = "https://www.donationalerts.com/api/v1/user/oauth";
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  return (await response.json()).data;
}

export async function subscribeToNewDonationEvent(
  callback: (donation: Donation) => void
) {
  logger.debug("DonationAlerts: Connecting...");
  try {
    const user = await getDonationAlertsUser(env.DONATION_ALERTS_ACCESS_TOKEN);
    centrifuge.setToken(user.socket_connection_token);
    centrifuge.connect();

    logger.debug("DonationAlerts: Listening for new donations");
    centrifuge.subscribe(`$alerts:donation_${user.id}`, (message) => {
      const donation = message.data as Donation;
      logger.debug(donation, "DonationAlerts: Received new donation");
      callback(donation);
    });
  } catch (error) {
    logger.error(error, "DonationAlerts: Error connecting");
    // Consider retrying or exiting the process
  }
}

export function validateDonation(donation: Donation) {
  const { SUB_CURRENCY, SUB_AMOUNT, SUB_CODE } = env;
  const { amount, currency, message } = donation;

  return (
    currency === SUB_CURRENCY &&
    amount >= SUB_AMOUNT &&
    containsWord(message, SUB_CODE)
  );
}
