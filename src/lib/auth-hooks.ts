import { db } from "@/db";
import { defaultNotification } from "@/db/app-schema";
import { createId } from "@/lib/id";

export const databaseHooks = {
  user: {
    create: {
      after: async (user: { id: string }) => {
        await db.insert(defaultNotification).values({
          id: createId(),
          userId: user.id,
          email: true,
          sms: false,
          slack: false,
          telegram: false,
        });
      },
    },
  },
};
