import { z } from "zod";

const donationSchema = z.object({
  id: z.number(),
  name: z.string(),
  username: z.string(),
  message_type: z.string(),
  message: z.string(),
  amount: z.number(),
  currency: z.string(),
  is_shown: z.number(),
  created_at: z.string(),
  shown_at: z.string().nullable(),
});

export type Donation = z.infer<typeof donationSchema>;
