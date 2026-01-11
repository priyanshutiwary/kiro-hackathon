import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Better Auth Tables
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Subscription table for Polar webhook data
export const subscription = pgTable("subscription", {
  id: text("id").primaryKey(),
  createdAt: timestamp("createdAt").notNull(),
  modifiedAt: timestamp("modifiedAt"),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  recurringInterval: text("recurringInterval").notNull(),
  status: text("status").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart").notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd").notNull(),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").notNull().default(false),
  canceledAt: timestamp("canceledAt"),
  startedAt: timestamp("startedAt").notNull(),
  endsAt: timestamp("endsAt"),
  endedAt: timestamp("endedAt"),
  customerId: text("customerId").notNull(),
  productId: text("productId").notNull(),
  discountId: text("discountId"),
  checkoutId: text("checkoutId").notNull(),
  customerCancellationReason: text("customerCancellationReason"),
  customerCancellationComment: text("customerCancellationComment"),
  metadata: text("metadata"), // JSON string
  customFieldData: text("customFieldData"), // JSON string
  userId: text("userId").references(() => user.id),
});

// Agent Integrations table for OAuth integrations (Zoho, etc.)

export const agentIntegrations = pgTable("agentIntegrations", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  integrationType: text("integrationType").notNull(), // "oauth"
  provider: text("provider").notNull(), // "zoho_books", etc.
  accessToken: text("accessToken"), // Encrypted
  refreshToken: text("refreshToken"), // Encrypted
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  scope: text("scope"),
  config: text("config"), // JSON string for provider-specific config
  status: text("status").notNull().default("active"), // "active", "error", "disconnected"
  enabled: boolean("enabled").notNull().default(true),
  lastSyncAt: timestamp("lastSyncAt"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Voice-related tables


// Payment Reminder System Tables

// User reminder settings
export const reminderSettings = pgTable("reminder_settings", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  organizationId: text("organizationId"),

  // Reminder schedule
  reminder30DaysBefore: boolean("reminder30DaysBefore").notNull().default(false),
  reminder15DaysBefore: boolean("reminder15DaysBefore").notNull().default(false),
  reminder7DaysBefore: boolean("reminder7DaysBefore").notNull().default(true),
  reminder5DaysBefore: boolean("reminder5DaysBefore").notNull().default(false),
  reminder3DaysBefore: boolean("reminder3DaysBefore").notNull().default(true),
  reminder1DayBefore: boolean("reminder1DayBefore").notNull().default(true),
  reminderOnDueDate: boolean("reminderOnDueDate").notNull().default(true),
  reminder1DayOverdue: boolean("reminder1DayOverdue").notNull().default(true),
  reminder3DaysOverdue: boolean("reminder3DaysOverdue").notNull().default(true),
  reminder7DaysOverdue: boolean("reminder7DaysOverdue").notNull().default(false),
  customReminderDays: text("customReminderDays").notNull().default("[]"), // JSON array

  // Call timing
  callTimezone: text("callTimezone").notNull().default("UTC"),
  callStartTime: text("callStartTime").notNull().default("09:00:00"),
  callEndTime: text("callEndTime").notNull().default("18:00:00"),
  callDaysOfWeek: text("callDaysOfWeek").notNull().default("[1,2,3,4,5]"), // JSON array

  // Retry settings
  maxRetryAttempts: integer("maxRetryAttempts").notNull().default(3),
  retryDelayHours: integer("retryDelayHours").notNull().default(2),

  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Customers cache
export const customersCache = pgTable("customers_cache", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  zohoCustomerId: text("zohoCustomerId").notNull(),

  // Customer details
  customerName: text("customerName").notNull(),
  companyName: text("companyName"),
  primaryContactPersonId: text("primaryContactPersonId"),
  primaryPhone: text("primaryPhone"),
  primaryEmail: text("primaryEmail"),
  contactPersons: text("contactPersons").notNull().default("[]"), // JSON array of contact person objects

  // Change tracking
  zohoLastModifiedAt: timestamp("zohoLastModifiedAt"),
  localLastSyncedAt: timestamp("localLastSyncedAt"),
  syncHash: text("syncHash"),

  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("customers_cache_user_id_idx").on(table.userId),
  zohoCustomerIdIdx: index("customers_cache_zoho_customer_id_idx").on(table.zohoCustomerId),
  userZohoCustomerIdx: uniqueIndex("customers_cache_user_zoho_customer_idx").on(table.userId, table.zohoCustomerId),
}));

// Invoices cache
export const invoicesCache = pgTable("invoices_cache", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  zohoInvoiceId: text("zohoInvoiceId").notNull(),

  // Invoice details
  customerId: text("customerId")
    .references(() => customersCache.id, { onDelete: "set null" }),
  
  invoiceNumber: text("invoiceNumber"),
  amountTotal: text("amountTotal"), // Store as string to avoid precision issues
  amountDue: text("amountDue"), // Store as string to avoid precision issues
  dueDate: timestamp("dueDate").notNull(),
  status: text("status"),

  // Change tracking
  zohoLastModifiedAt: timestamp("zohoLastModifiedAt"),
  localLastSyncedAt: timestamp("localLastSyncedAt"),
  syncHash: text("syncHash"),

  // Reminder tracking
  remindersCreated: boolean("remindersCreated").notNull().default(false),

  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => ({
  userZohoInvoiceIdx: uniqueIndex("invoices_cache_user_zoho_invoice_idx").on(table.userId, table.zohoInvoiceId),
  userDueDateIdx: index("invoices_cache_user_due_date_idx").on(table.userId, table.dueDate),
  userStatusIdx: index("invoices_cache_user_status_idx").on(table.userId, table.status),
}));

// Payment reminders
export const paymentReminders = pgTable("payment_reminders", {
  id: text("id").primaryKey(),
  invoiceId: text("invoiceId")
    .notNull()
    .references(() => invoicesCache.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  // Reminder details
  reminderType: text("reminderType").notNull(),
  scheduledDate: timestamp("scheduledDate").notNull(),
  status: text("status").notNull().default("pending"),

  // Attempt tracking
  attemptCount: integer("attemptCount").notNull().default(0),
  lastAttemptAt: timestamp("lastAttemptAt"),

  // Call outcome
  callOutcome: text("callOutcome"), // JSON string
  skipReason: text("skipReason"),

  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => ({
  userScheduledStatusIdx: index("payment_reminders_user_scheduled_status_idx").on(table.userId, table.scheduledDate, table.status),
  invoiceIdIdx: index("payment_reminders_invoice_id_idx").on(table.invoiceId),
  scheduledDateIdx: index("payment_reminders_scheduled_date_idx").on(table.scheduledDate),
}));

// Sync metadata
export const syncMetadata = pgTable("sync_metadata", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  lastFullSyncAt: timestamp("lastFullSyncAt"),
  lastIncrementalSyncAt: timestamp("lastIncrementalSyncAt"),
  lastCustomerSyncAt: timestamp("lastCustomerSyncAt"),
  syncWindowDays: integer("syncWindowDays"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
