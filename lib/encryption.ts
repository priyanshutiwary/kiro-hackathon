import crypto from "crypto";

/**
 * Encryption utility for securely storing sensitive data like OAuth tokens.
 * Uses AES-256-GCM encryption algorithm.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // For AES, this is always 16
const SALT_LENGTH = 64;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Get the encryption key from environment variables
 */
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      "ENCRYPTION_KEY environment variable is not set. Please add it to your .env file."
    );
  }
  return key;
}

/**
 * Derive a key from the master key using PBKDF2
 */
function deriveKey(masterKey: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(
    masterKey,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    "sha512"
  );
}

/**
 * Encrypt a string value
 * @param text - The plain text to encrypt
 * @returns Encrypted string in format: salt:iv:tag:encryptedData (all base64 encoded)
 */
export function encrypt(text: string): string {
  try {
    const masterKey = getEncryptionKey();
    
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Derive key from master key
    const key = deriveKey(masterKey, salt);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt the text
    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");
    
    // Get the auth tag
    const tag = cipher.getAuthTag();
    
    // Combine salt, iv, tag, and encrypted data
    return `${salt.toString("base64")}:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted}`;
  } catch (error) {
    throw new Error(
      `Encryption failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Decrypt an encrypted string
 * @param encryptedText - The encrypted string in format: salt:iv:tag:encryptedData
 * @returns Decrypted plain text
 */
export function decrypt(encryptedText: string): string {
  try {
    const masterKey = getEncryptionKey();
    
    // Split the encrypted text into components
    const parts = encryptedText.split(":");
    if (parts.length !== 4) {
      throw new Error("Invalid encrypted text format");
    }
    
    const [saltBase64, ivBase64, tagBase64, encrypted] = parts;
    
    // Convert from base64
    const salt = Buffer.from(saltBase64, "base64");
    const iv = Buffer.from(ivBase64, "base64");
    const tag = Buffer.from(tagBase64, "base64");
    
    // Derive key from master key
    const key = deriveKey(masterKey, salt);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    // Decrypt the text
    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    throw new Error(
      `Decryption failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Generate a secure random encryption key
 * This is a utility function to help generate a strong encryption key
 * @returns A random 64-character hex string suitable for use as ENCRYPTION_KEY
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex");
}
