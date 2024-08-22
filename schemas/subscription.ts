import { z } from "zod";

const subscriptionSchema = z.object({
  username: z.string(),
  amount: z.number(),
  currency: z.string(),
  donation_id: z.number(),
  donation_created_at: z.string(),
  expires_at: z.string(),
  discord_id: z.string(),
});

export type Subscription = z.infer<typeof subscriptionSchema>;
