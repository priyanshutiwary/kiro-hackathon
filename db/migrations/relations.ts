import { relations } from "drizzle-orm/relations";
import { user, subscription, session, account, agentIntegrations, syncMetadata, customersCache, invoicesCache, paymentReminders, reminderSettings, businessProfiles } from "./schema";

export const subscriptionRelations = relations(subscription, ({one}) => ({
	user: one(user, {
		fields: [subscription.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	subscriptions: many(subscription),
	sessions: many(session),
	accounts: many(account),
	agentIntegrations: many(agentIntegrations),
	syncMetadata: many(syncMetadata),
	customersCaches: many(customersCache),
	paymentReminders: many(paymentReminders),
	reminderSettings: many(reminderSettings),
	businessProfiles: many(businessProfiles),
	invoicesCaches: many(invoicesCache),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const agentIntegrationsRelations = relations(agentIntegrations, ({one}) => ({
	user: one(user, {
		fields: [agentIntegrations.userId],
		references: [user.id]
	}),
}));

export const syncMetadataRelations = relations(syncMetadata, ({one}) => ({
	user: one(user, {
		fields: [syncMetadata.userId],
		references: [user.id]
	}),
}));

export const customersCacheRelations = relations(customersCache, ({one, many}) => ({
	user: one(user, {
		fields: [customersCache.userId],
		references: [user.id]
	}),
	invoicesCaches: many(invoicesCache),
}));

export const paymentRemindersRelations = relations(paymentReminders, ({one}) => ({
	invoicesCache: one(invoicesCache, {
		fields: [paymentReminders.invoiceId],
		references: [invoicesCache.id]
	}),
	user: one(user, {
		fields: [paymentReminders.userId],
		references: [user.id]
	}),
}));

export const invoicesCacheRelations = relations(invoicesCache, ({one, many}) => ({
	paymentReminders: many(paymentReminders),
	user: one(user, {
		fields: [invoicesCache.userId],
		references: [user.id]
	}),
	customersCache: one(customersCache, {
		fields: [invoicesCache.customerId],
		references: [customersCache.id]
	}),
}));

export const reminderSettingsRelations = relations(reminderSettings, ({one}) => ({
	user: one(user, {
		fields: [reminderSettings.userId],
		references: [user.id]
	}),
}));

export const businessProfilesRelations = relations(businessProfiles, ({one}) => ({
	user: one(user, {
		fields: [businessProfiles.userId],
		references: [user.id]
	}),
}));