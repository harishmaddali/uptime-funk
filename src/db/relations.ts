import { relations } from "drizzle-orm";
import { user, session, account } from "./auth-schema";
import {
  defaultNotification,
  integration,
  monitor,
  monitorCheck,
} from "./app-schema";

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  defaultNotification: one(defaultNotification),
  integrations: many(integration),
  monitors: many(monitor),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const defaultNotificationRelations = relations(
  defaultNotification,
  ({ one }) => ({
    user: one(user, {
      fields: [defaultNotification.userId],
      references: [user.id],
    }),
  })
);

export const integrationRelations = relations(integration, ({ one }) => ({
  user: one(user, {
    fields: [integration.userId],
    references: [user.id],
  }),
}));

export const monitorRelations = relations(monitor, ({ one, many }) => ({
  user: one(user, {
    fields: [monitor.userId],
    references: [user.id],
  }),
  checks: many(monitorCheck),
}));

export const monitorCheckRelations = relations(monitorCheck, ({ one }) => ({
  monitor: one(monitor, {
    fields: [monitorCheck.monitorId],
    references: [monitor.id],
  }),
}));
