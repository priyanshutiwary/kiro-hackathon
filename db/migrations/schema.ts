import { pgTable, foreignKey, text, timestamp, integer, boolean, unique, index, uniqueIndex } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const subscription = pgTable("subscription", {
	id: text().primaryKey().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
	modifiedAt: timestamp({ mode: 'string' }),
	amount: integer().notNull(),
	currency: text().notNull(),
	recurringInterval: text().notNull(),
	status: text().notNull(),
	currentPeriodStart: timestamp({ mode: 'string' }).notNull(),
	currentPeriodEnd: timestamp({ mode: 'string' }).notNull(),
	cancelAtPeriodEnd: boolean().default(false).notNull(),
	canceledAt: timestamp({ mode: 'string' }),
	startedAt: timestamp({ mode: 'string' }).notNull(),
	endsAt: timestamp({ mode: 'string' }),
	endedAt: timestamp({ mode: 'string' }),
	customerId: text().notNull(),
	productId: text().notNull(),
	discountId: text(),
	checkoutId: text().notNull(),
	customerCancellationReason: text(),
	customerCancellationComment: text(),
	metadata: text(),
	customFieldData: text(),
	userId: text(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "subscription_userId_user_id_fk"
		}),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	ipAddress: text(),
	userAgent: text(),
	userId: text().notNull(),
	lastAuthenticatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_userId_user_id_fk"
		}).onDelete("cascade"),
	unique("session_token_unique").on(table.token),
]);

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text().notNull(),
	providerId: text().notNull(),
	userId: text().notNull(),
	accessToken: text(),
	refreshToken: text(),
	idToken: text(),
	accessTokenExpiresAt: timestamp({ mode: 'string' }),
	refreshTokenExpiresAt: timestamp({ mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_userId_user_id_fk"
		}).onDelete("cascade"),
]);

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const agentIntegrations = pgTable("agentIntegrations", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	integrationType: text().notNull(),
	provider: text().notNull(),
	accessToken: text(),
	refreshToken: text(),
	accessTokenExpiresAt: timestamp({ mode: 'string' }),
	scope: text(),
	config: text(),
	status: text().default('active').notNull(),
	enabled: boolean().default(true).notNull(),
	lastSyncAt: timestamp({ mode: 'string' }),
	errorMessage: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "agentIntegrations_userId_user_id_fk"
		}).onDelete("cascade"),
]);

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean().default(false).notNull(),
	image: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	failedLoginAttempts: integer().default(0).notNull(),
	lockedUntil: timestamp({ mode: 'string' }),
	lastLoginAttempt: timestamp({ mode: 'string' }),
}, (table) => [
	unique("user_email_unique").on(table.email),
]);

export const syncMetadata = pgTable("sync_metadata", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	lastFullSyncAt: timestamp({ mode: 'string' }),
	lastIncrementalSyncAt: timestamp({ mode: 'string' }),
	syncWindowDays: integer(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	lastCustomerSyncAt: timestamp({ mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "sync_metadata_userId_user_id_fk"
		}).onDelete("cascade"),
	unique("sync_metadata_userId_unique").on(table.userId),
]);

export const customersCache = pgTable("customers_cache", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	zohoCustomerId: text().notNull(),
	customerName: text().notNull(),
	companyName: text(),
	primaryContactPersonId: text(),
	primaryPhone: text(),
	primaryEmail: text(),
	contactPersons: text().default('[]').notNull(),
	zohoLastModifiedAt: timestamp({ mode: 'string' }),
	localLastSyncedAt: timestamp({ mode: 'string' }),
	syncHash: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("customers_cache_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	uniqueIndex("customers_cache_user_zoho_customer_idx").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.zohoCustomerId.asc().nullsLast().op("text_ops")),
	index("customers_cache_zoho_customer_id_idx").using("btree", table.zohoCustomerId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "customers_cache_userId_user_id_fk"
		}).onDelete("cascade"),
]);

export const paymentReminders = pgTable("payment_reminders", {
	id: text().primaryKey().notNull(),
	invoiceId: text().notNull(),
	userId: text().notNull(),
	reminderType: text().notNull(),
	scheduledDate: timestamp({ mode: 'string' }).notNull(),
	status: text().default('pending').notNull(),
	attemptCount: integer().default(0).notNull(),
	lastAttemptAt: timestamp({ mode: 'string' }),
	callOutcome: text(),
	skipReason: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("payment_reminders_invoice_id_idx").using("btree", table.invoiceId.asc().nullsLast().op("text_ops")),
	index("payment_reminders_scheduled_date_idx").using("btree", table.scheduledDate.asc().nullsLast().op("timestamp_ops")),
	index("payment_reminders_user_scheduled_status_idx").using("btree", table.userId.asc().nullsLast().op("timestamp_ops"), table.scheduledDate.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.invoiceId],
			foreignColumns: [invoicesCache.id],
			name: "payment_reminders_invoiceId_invoices_cache_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "payment_reminders_userId_user_id_fk"
		}).onDelete("cascade"),
]);

export const reminderSettings = pgTable("reminder_settings", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	organizationId: text(),
	reminder30DaysBefore: boolean().default(false).notNull(),
	reminder15DaysBefore: boolean().default(false).notNull(),
	reminder7DaysBefore: boolean().default(true).notNull(),
	reminder5DaysBefore: boolean().default(false).notNull(),
	reminder3DaysBefore: boolean().default(true).notNull(),
	reminder1DayBefore: boolean().default(true).notNull(),
	reminderOnDueDate: boolean().default(true).notNull(),
	reminder1DayOverdue: boolean().default(true).notNull(),
	reminder3DaysOverdue: boolean().default(true).notNull(),
	reminder7DaysOverdue: boolean().default(false).notNull(),
	customReminderDays: text().default('[]').notNull(),
	callTimezone: text().default('UTC').notNull(),
	callStartTime: text().default('09:00:00').notNull(),
	callEndTime: text().default('18:00:00').notNull(),
	callDaysOfWeek: text().default('[1,2,3,4,5]').notNull(),
	maxRetryAttempts: integer().default(3).notNull(),
	retryDelayHours: integer().default(2).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	language: text().default('en').notNull(),
	voiceGender: text().default('female').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "reminder_settings_userId_user_id_fk"
		}).onDelete("cascade"),
	unique("reminder_settings_userId_unique").on(table.userId),
]);

export const businessProfiles = pgTable("business_profiles", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	companyName: text().notNull(),
	businessDescription: text().notNull(),
	industry: text(),
	supportPhone: text().notNull(),
	supportEmail: text(),
	businessHours: text(),
	preferredPaymentMethods: text().default('[]').notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "business_profiles_userId_user_id_fk"
		}).onDelete("cascade"),
	unique("business_profiles_userId_unique").on(table.userId),
]);

export const invoicesCache = pgTable("invoices_cache", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	zohoInvoiceId: text().notNull(),
	customerId: text(),
	invoiceNumber: text(),
	amountTotal: text(),
	amountDue: text(),
	dueDate: timestamp({ mode: 'string' }).notNull(),
	status: text(),
	zohoLastModifiedAt: timestamp({ mode: 'string' }),
	localLastSyncedAt: timestamp({ mode: 'string' }),
	syncHash: text(),
	remindersCreated: boolean().default(false).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	currencyCode: text().default('USD').notNull(),
}, (table) => [
	index("invoices_cache_user_due_date_idx").using("btree", table.userId.asc().nullsLast().op("timestamp_ops"), table.dueDate.asc().nullsLast().op("text_ops")),
	index("invoices_cache_user_status_idx").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	uniqueIndex("invoices_cache_user_zoho_invoice_idx").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.zohoInvoiceId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "invoices_cache_userId_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customersCache.id],
			name: "invoices_cache_customerId_customers_cache_id_fk"
		}).onDelete("set null"),
]);
