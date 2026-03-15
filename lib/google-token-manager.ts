/**
 * Google Token Manager
 * Manages secure storage and retrieval of Google OAuth tokens in the database.
 * Same pattern as zoho-token-manager.ts — provider = "google_sheets".
 */

import { db } from "@/db/drizzle";
import { agentIntegrations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { encrypt, decrypt } from "./encryption";
import type { GoogleTokens } from "./google-oauth";
import type { GoogleSheetsConfig } from "./providers/types";
import crypto from "crypto";

const PROVIDER = "google_sheets";

/**
 * Store Google OAuth tokens after successful OAuth callback.
 */
export async function storeGoogleTokens(
    userId: string,
    tokens: GoogleTokens
): Promise<string> {
    const encryptedAccessToken = encrypt(tokens.accessToken);
    const encryptedRefreshToken = encrypt(tokens.refreshToken);

    const existing = await getGoogleIntegration(userId);

    if (existing) {
        await db
            .update(agentIntegrations)
            .set({
                accessToken: encryptedAccessToken,
                refreshToken: encryptedRefreshToken,
                accessTokenExpiresAt: tokens.expiresAt,
                scope: tokens.scope,
                status: "active",
                enabled: true,
                errorMessage: null,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(agentIntegrations.userId, userId),
                    eq(agentIntegrations.provider, PROVIDER)
                )
            );

        return existing.id;
    }

    const id = `google_${userId}_${crypto.randomBytes(8).toString("hex")}`;

    await db.insert(agentIntegrations).values({
        id,
        userId,
        integrationType: "oauth",
        provider: PROVIDER,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        accessTokenExpiresAt: tokens.expiresAt,
        scope: tokens.scope,
        config: JSON.stringify({}), // spreadsheetId set later via set-sheet route
        status: "active",
        enabled: true,
        lastSyncAt: null,
        errorMessage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    return id;
}

/**
 * Get the full integration row (with decrypted tokens) for a user.
 */
export async function getGoogleIntegration(userId: string) {
    const rows = await db
        .select()
        .from(agentIntegrations)
        .where(
            and(
                eq(agentIntegrations.userId, userId),
                eq(agentIntegrations.provider, PROVIDER)
            )
        )
        .limit(1);

    if (!rows.length) return null;

    const row = rows[0];
    return {
        id: row.id,
        userId: row.userId,
        accessToken: row.accessToken ? decrypt(row.accessToken) : "",
        refreshToken: row.refreshToken ? decrypt(row.refreshToken) : "",
        accessTokenExpiresAt: row.accessTokenExpiresAt || new Date(0),
        config: row.config ? (JSON.parse(row.config) as GoogleSheetsConfig) : {} as GoogleSheetsConfig,
        status: row.status,
        enabled: row.enabled,
        lastSyncAt: row.lastSyncAt,
        errorMessage: row.errorMessage,
        scope: row.scope || "",
    };
}

/**
 * Save the spreadsheetId (and optional sheetName) selected by the user.
 */
export async function saveGoogleSheetConfig(
    userId: string,
    spreadsheetId: string,
    sheetName = "Sheet1"
): Promise<void> {
    const existing = await getGoogleIntegration(userId);
    if (!existing) throw new Error("Google Sheets integration not found");

    const config: GoogleSheetsConfig = {
        ...existing.config,
        spreadsheetId,
        sheetName,
    };

    await db
        .update(agentIntegrations)
        .set({
            config: JSON.stringify(config),
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(agentIntegrations.userId, userId),
                eq(agentIntegrations.provider, PROVIDER)
            )
        );
}

/**
 * Get integration status for display in the integrations UI.
 */
export async function getGoogleIntegrationStatus(userId: string) {
    const integration = await getGoogleIntegration(userId);

    if (!integration) {
        return { connected: false, status: "disconnected" };
    }

    return {
        connected: integration.enabled && integration.status === "active",
        status: integration.status,
        spreadsheetId: integration.config?.spreadsheetId,
        sheetName: integration.config?.sheetName,
        lastSync: integration.lastSyncAt || undefined,
        error: integration.errorMessage || undefined,
    };
}

/**
 * Delete the Google Sheets integration (disconnect).
 */
export async function deleteGoogleIntegration(userId: string): Promise<void> {
    await db
        .delete(agentIntegrations)
        .where(
            and(
                eq(agentIntegrations.userId, userId),
                eq(agentIntegrations.provider, PROVIDER)
            )
        );
}

/**
 * Mark integration as error state.
 */
export async function setGoogleIntegrationError(
    userId: string,
    errorMessage: string
): Promise<void> {
    await db
        .update(agentIntegrations)
        .set({ status: "error", errorMessage, updatedAt: new Date() })
        .where(
            and(
                eq(agentIntegrations.userId, userId),
                eq(agentIntegrations.provider, PROVIDER)
            )
        );
}

/**
 * Update last sync timestamp.
 */
export async function updateGoogleLastSync(userId: string): Promise<void> {
    await db
        .update(agentIntegrations)
        .set({ lastSyncAt: new Date(), updatedAt: new Date() })
        .where(
            and(
                eq(agentIntegrations.userId, userId),
                eq(agentIntegrations.provider, PROVIDER)
            )
        );
}
