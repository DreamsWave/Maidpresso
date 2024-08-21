import { z } from "zod";

const envSchema = z.object({
  DONATION_ALERTS_ACCESS_TOKEN: z.string(),
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().email(),
  GOOGLE_PRIVATE_KEY: z.string(),
  GOOGLE_SHEET_ID: z.string(),
  DISCORD_BOT_TOKEN: z.string(),
  DISCORD_GUILD_ID: z.coerce.string(),
  DISCORD_SUB_ROLE_ID: z.coerce.string(),
  DISCORD_SUB_ROLE_NAME: z.coerce.string().optional(),
  SUB_CURRENCY: z.string(),
  SUB_AMOUNT: z.coerce.number(),
  SUB_CODE: z.string(),
  SUB_DAYS: z.coerce.number(),
  CLEAN_SUBS_TIME_IN_MINUTES: z.coerce.number(),
});

const env = envSchema.parse({
  ...Bun.env,
  GOOGLE_PRIVATE_KEY: Bun.env.GOOGLE_PRIVATE_KEY
    ? Bun.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined,
});

export default env;
