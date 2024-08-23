import {
  initializeCleanupService,
  stopCleanupService,
} from "@/libs/cleanup-service";
import {
  addSubscription,
  createSubscriptionFromDonationAndDiscordUser,
  getSubscriptionByUsername,
  initializeDB,
} from "@/libs/db";
import {
  addSubscriptionRoleToUser,
  findUserByUsername,
  initializeDiscordClient,
} from "@/libs/discord";
import {
  subscribeToNewDonationEvent,
  validateDonation,
} from "@/libs/donation-alerts";
import logger from "@/utils/logger";

/**
 * This main function is the entry point of the application
 * It initializes the services, subscribes to new donations,
 * validates the donations, adds subscription role to the user,
 * creates a subscriber object, and adds the subscriber to the database
 */
async function main() {
  logger.info("Starting Maidpresso...");
  // Initializing services
  await initializeDiscordClient();
  await initializeDB();
  await initializeCleanupService();

  // Listening to new donations
  subscribeToNewDonationEvent(async (donation) => {
    const { username } = donation;

    // Validating the donation
    // 1. Currency should be the same as the one in the env
    // 2. Amount should be greater than or equal to the one in the env
    // 3. Message should contain the word from the env
    // 4. User should exist in discord
    // 5. User should not be a subscriber already
    if (!validateDonation(donation)) return;
    // Fetching user data from discord and database
    const discordUser = await findUserByUsername(username);
    const subscriptionRow = await getSubscriptionByUsername(username);
    if (!discordUser || subscriptionRow) return;

    // Adding subscription role to the user in discord
    await addSubscriptionRoleToUser(discordUser);

    // Creating subscription object
    const newSubscription = createSubscriptionFromDonationAndDiscordUser(
      donation,
      discordUser
    );

    // Adding subscription to the database
    await addSubscription(newSubscription);
    logger.info(`Added subscription for ${username}`);
  });
  logger.info("Maidpresso is running");
}

// Executing main function and handling unhandled errors
main().catch((error) => {
  logger.fatal("Unhandled error:", error);
  stopCleanupService();
  process.exit(1);
});
