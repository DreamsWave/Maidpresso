import env from "@/env";
import {
  initializeCleanupService,
  stopCleanupService,
} from "@/libs/cleanup-service";
import {
  addSubscriptionRoleToUser,
  findUserByUsername,
  initializeDiscordClient,
} from "@/libs/discord";
import { subscribeToNewDonationEvent } from "@/libs/donation-alerts";
import {
  addSubscriberToDb,
  createSubscriberFromDonationAndDiscordUser,
  getSubscriberRowByUsername,
} from "@/libs/sheets";
import { containsWord } from "@/utils";

/**
 * Main function
 * This function is the entry point of the application
 * It initializes the services, subscribes to new donations,
 * validates the donations, adds subscription role to the user,
 * creates a subscriber object, and adds the subscriber to the database
 */
async function main() {
  // Initializing services
  await initializeDiscordClient();
  await initializeCleanupService();

  // Listening to new donations
  subscribeToNewDonationEvent(async (donation) => {
    const { username, amount, currency, message } = donation;

    // Fetching user data from discord and database
    const discordUser = await findUserByUsername(username);
    const subscriber = await getSubscriberRowByUsername(username);

    // Validating the donation
    // 1. User should exist in discord
    // 2. User should not be a subscriber already
    // 3. Currency should be the same as the one in the env
    // 4. Amount should be greater than or equal to the one in the env
    // 5. Message should contain the word from the env
    if (
      !discordUser ||
      subscriber ||
      currency !== env.SUB_CURRENCY ||
      amount < env.SUB_AMOUNT ||
      !containsWord(message, env.SUB_CODE)
    )
      return;
    // All validations passed

    // Adding subscription role to the user in discord
    await addSubscriptionRoleToUser(discordUser);

    // Creating subscriber object
    const newSubscriber = createSubscriberFromDonationAndDiscordUser(
      donation,
      discordUser
    );

    // Adding subscriber to the database
    await addSubscriberToDb(newSubscriber);

    console.info(`Added subscription for ${username}`);
  });
}

// Executing main function and handling unhandled errors
main().catch((error) => {
  console.error("Unhandled error:", error);
  stopCleanupService();
  process.exit(1);
});
