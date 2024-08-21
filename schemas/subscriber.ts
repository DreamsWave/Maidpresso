import { z } from "zod";

const subscriberSchema = z.object({
  username: z.string(),
  amount: z.number(),
  currency: z.string(),
  donation_id: z.number(),
  donation_created_at: z.string(),
  expires_at: z.string(),
  discord_id: z.string(),
});

export type Subscriber = z.infer<typeof subscriberSchema>;
