import env from "@/env";
import type { Donation } from "@/schemas/donation";
import type { DonationAlertsUser } from "@/types";
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
  console.info("Connecting to DonationAlerts");
  try {
    const user = await getDonationAlertsUser(env.DONATION_ALERTS_ACCESS_TOKEN);
    centrifuge.setToken(user.socket_connection_token);
    centrifuge.connect();

    console.info("Listening to new donations");
    centrifuge.subscribe(`$alerts:donation_${user.id}`, (message) => {
      const donation = message.data as Donation;
      console.info(
        `Received new donation: ${donation.username} ${donation.amount} ${donation.currency}`
      );
      callback(donation);
    });
  } catch (error) {
    console.error("Error connecting to DonationAlerts:", error);
    // Consider retrying or exiting the process
  }
}
