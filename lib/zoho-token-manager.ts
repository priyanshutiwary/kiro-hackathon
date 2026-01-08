/**
 * Zoho Token Manager
 * Manages secure storage and retrieval of OAuth tokens in the database
 * Uses encryption for sensitive token data
 */

import { db } from "@/db/drizzle";
import { agentIntegrations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { encrypt, decrypt } from "./encryption";
import { ZohoTokens } from "./zoho-oauth";
import crypto from "crypto";

export interface StoredIntegration {
  id: string;
  userId: string;
  accessToken: string; // Decrypted
  refreshToken: string; // Decrypted
  accessTokenExpiresAt: Date;
  config: {
    organizationId: string;
    accountsServer: string;
    apiDomain: string;
  };
  status: string;
  enabled: boolean;
  lastSyncAt: Date | null;
  errorMessage: string | null;
  scope: string;
}

export interface ZohoIntegrationConfig {
  organizationId: string;
  accountsServer: string;
  apiDomain: string;
}

/**
 * Token Manager for Zoho Books integration
 * Handles secure storage, retrieval, and management of OAuth tokens
 */
export class ZohoTokenManager {
  private readonly PROVIDER = "zoho_books";
  private readonly INTEGRATION_TYPE = "oauth";

  /**
   * Store tokens securely in the database
   * @param userId - User ID
   * @param tokens - OAuth tokens from Zoho
   * @param organizationId - Zoho organization ID
   * @param accountsServer - Zoho accounts server URL (Multi-DC)
   * @returns The created integration ID
   */
  async storeTokens(
    userId: string,
    tokens: ZohoTokens,
    organizationId: string,
    accountsServer: string
  ): Promise<string> {
    try {
      // Encrypt tokens before storage
      const encryptedAccessToken = encrypt(tokens.accessToken);
      const encryptedRefreshToken = encrypt(tokens.refreshToken);

      // Prepare config as JSON
      const config: ZohoIntegrationConfig = {
        organizationId,
        accountsServer,
        apiDomain: tokens.apiDomain,
      };

      // Generate unique ID
      const integrationId = `zoho_${userId}_${crypto.randomBytes(8).toString("hex")}`;

      // Check if integration already exists for this user
      const existing = await this.getIntegration(userId);
      
      if (existing) {
        // Update existing integration
        await db
          .update(agentIntegrations)
          .set({
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            accessTokenExpiresAt: tokens.expiresAt,
            scope: tokens.scope,
            config: JSON.stringify(config),
            status: "active",
            enabled: true,
            errorMessage: null,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(agentIntegrations.userId, userId),
              eq(agentIntegrations.provider, this.PROVIDER)
            )
          );

        return existing.id;
      } else {
        // Create new integration
        await db.insert(agentIntegrations).values({
          id: integrationId,
          userId,
          integrationType: this.INTEGRATION_TYPE,
          provider: this.PROVIDER,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          accessTokenExpiresAt: tokens.expiresAt,
          scope: tokens.scope,
          config: JSON.stringify(config),
          status: "active",
          enabled: true,
          lastSyncAt: null,
          errorMessage: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        return integrationId;
      }
    } catch (error) {
      throw new Error(
        `Failed to store tokens: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Retrieve integration and decrypt tokens
   * @param userId - User ID
   * @returns Integration data with decrypted tokens, or null if not found
   */
  async getIntegration(userId: string): Promise<StoredIntegration | null> {
    try {
      const results = await db
        .select()
        .from(agentIntegrations)
        .where(
          and(
            eq(agentIntegrations.userId, userId),
            eq(agentIntegrations.provider, this.PROVIDER)
          )
        )
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      const integration = results[0];

      // Decrypt tokens
      const accessToken = integration.accessToken
        ? decrypt(integration.accessToken)
        : "";
      const refreshToken = integration.refreshToken
        ? decrypt(integration.refreshToken)
        : "";

      // Parse config
      const config: ZohoIntegrationConfig = integration.config
        ? JSON.parse(integration.config)
        : { organizationId: "", accountsServer: "", apiDomain: "" };

      return {
        id: integration.id,
        userId: integration.userId,
        accessToken,
        refreshToken,
        accessTokenExpiresAt: integration.accessTokenExpiresAt || new Date(),
        config,
        status: integration.status,
        enabled: integration.enabled,
        lastSyncAt: integration.lastSyncAt,
        errorMessage: integration.errorMessage,
        scope: integration.scope || "",
      };
    } catch (error) {
      throw new Error(
        `Failed to retrieve integration: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Update tokens after refresh
   * @param userId - User ID
   * @param tokens - New OAuth tokens
   */
  async updateTokens(userId: string, tokens: ZohoTokens): Promise<void> {
    try {
      // Encrypt new tokens
      const encryptedAccessToken = encrypt(tokens.accessToken);
      const encryptedRefreshToken = encrypt(tokens.refreshToken);

      // Get existing integration to preserve config
      const existing = await this.getIntegration(userId);
      if (!existing) {
        throw new Error("Integration not found for user");
      }

      // Update config with new API domain if provided
      const config: ZohoIntegrationConfig = {
        ...existing.config,
        apiDomain: tokens.apiDomain,
      };

      await db
        .update(agentIntegrations)
        .set({
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          accessTokenExpiresAt: tokens.expiresAt,
          scope: tokens.scope,
          config: JSON.stringify(config),
          status: "active",
          errorMessage: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(agentIntegrations.userId, userId),
            eq(agentIntegrations.provider, this.PROVIDER)
          )
        );
    } catch (error) {
      throw new Error(
        `Failed to update tokens: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Delete integration (disconnect)
   * @param userId - User ID
   */
  async deleteIntegration(userId: string): Promise<void> {
    try {
      await db
        .delete(agentIntegrations)
        .where(
          and(
            eq(agentIntegrations.userId, userId),
            eq(agentIntegrations.provider, this.PROVIDER)
          )
        );
    } catch (error) {
      throw new Error(
        `Failed to delete integration: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Check if integration exists and is valid
   * @param userId - User ID
   * @returns True if valid integration exists
   */
  async hasValidIntegration(userId: string): Promise<boolean> {
    try {
      const integration = await this.getIntegration(userId);
      
      if (!integration) {
        return false;
      }

      // Check if integration is enabled and active
      if (!integration.enabled || integration.status !== "active") {
        return false;
      }

      // Check if tokens exist
      if (!integration.accessToken || !integration.refreshToken) {
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error checking integration validity:", error);
      return false;
    }
  }

  /**
   * Update integration status
   * @param userId - User ID
   * @param status - New status ("active", "error", "disconnected")
   * @param errorMessage - Optional error message
   */
  async updateStatus(
    userId: string,
    status: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      await db
        .update(agentIntegrations)
        .set({
          status,
          errorMessage: errorMessage || null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(agentIntegrations.userId, userId),
            eq(agentIntegrations.provider, this.PROVIDER)
          )
        );
    } catch (error) {
      throw new Error(
        `Failed to update status: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Update last sync timestamp
   * @param userId - User ID
   */
  async updateLastSync(userId: string): Promise<void> {
    try {
      await db
        .update(agentIntegrations)
        .set({
          lastSyncAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(agentIntegrations.userId, userId),
            eq(agentIntegrations.provider, this.PROVIDER)
          )
        );
    } catch (error) {
      throw new Error(
        `Failed to update last sync: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get integration status for display
   * @param userId - User ID
   * @returns Status information
   */
  async getIntegrationStatus(userId: string): Promise<{
    connected: boolean;
    status: string;
    organizationId?: string;
    lastSync?: Date;
    error?: string;
  }> {
    try {
      const integration = await this.getIntegration(userId);

      if (!integration) {
        return {
          connected: false,
          status: "disconnected",
        };
      }

      return {
        connected: integration.enabled && integration.status === "active",
        status: integration.status,
        organizationId: integration.config.organizationId,
        lastSync: integration.lastSyncAt || undefined,
        error: integration.errorMessage || undefined,
      };
    } catch (error) {
      console.error("Error getting integration status:", error);
      return {
        connected: false,
        status: "error",
        error: "Failed to retrieve integration status",
      };
    }
  }
}

/**
 * Create a default instance of ZohoTokenManager
 */
export function createZohoTokenManager(): ZohoTokenManager {
  return new ZohoTokenManager();
}
