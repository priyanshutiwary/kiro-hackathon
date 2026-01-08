# Encryption Utility

Location: `lib/encryption.ts`

This utility provides secure encryption and decryption for sensitive data like OAuth tokens using AES-256-GCM encryption.

## Features

- **AES-256-GCM encryption**: Industry-standard authenticated encryption
- **Random IV and Salt**: Each encryption produces a unique ciphertext
- **PBKDF2 key derivation**: Derives encryption keys from master key
- **Authentication tag**: Ensures data integrity and authenticity

## Setup

1. Generate a secure encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

2. Add the key to your `.env` file:
```env
ENCRYPTION_KEY=your_generated_key_here
```

## Usage

```typescript
import { encrypt, decrypt } from './lib/encryption';

// Encrypt sensitive data
const accessToken = "user-access-token-12345";
const encryptedToken = encrypt(accessToken);
// Store encryptedToken in database

// Decrypt when needed
const decryptedToken = decrypt(encryptedToken);
// Use decryptedToken for API calls
```

## API

### `encrypt(text: string): string`

Encrypts a plain text string.

**Parameters:**
- `text`: The plain text to encrypt

**Returns:**
- Encrypted string in format: `salt:iv:tag:encryptedData` (all base64 encoded)

**Throws:**
- Error if `ENCRYPTION_KEY` is not set
- Error if encryption fails

### `decrypt(encryptedText: string): string`

Decrypts an encrypted string.

**Parameters:**
- `encryptedText`: The encrypted string (must be in the format produced by `encrypt()`)

**Returns:**
- Decrypted plain text string

**Throws:**
- Error if `ENCRYPTION_KEY` is not set
- Error if encrypted text format is invalid
- Error if decryption fails (corrupted data, wrong key, etc.)

### `generateEncryptionKey(): string`

Generates a secure random encryption key suitable for use as `ENCRYPTION_KEY`.

**Returns:**
- A 64-character hex string

## Security Considerations

1. **Keep the encryption key secret**: Never commit `ENCRYPTION_KEY` to version control
2. **Use environment variables**: Store the key in `.env` file (gitignored)
3. **Rotate keys periodically**: Consider implementing key rotation for production
4. **Backup encrypted data**: If you lose the encryption key, encrypted data cannot be recovered
5. **Use HTTPS**: Always transmit encrypted data over secure connections

## Technical Details

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key derivation**: PBKDF2 with SHA-512
- **Iterations**: 100,000
- **IV length**: 16 bytes (128 bits)
- **Salt length**: 64 bytes (512 bits)
- **Key length**: 32 bytes (256 bits)
- **Tag length**: 16 bytes (128 bits)

## Format

Encrypted strings are stored in the following format:

```
salt:iv:tag:encryptedData
```

Where:
- `salt`: Random salt for key derivation (base64)
- `iv`: Initialization vector (base64)
- `tag`: Authentication tag (base64)
- `encryptedData`: Encrypted ciphertext (base64)

Each component is separated by a colon (`:`) character.

## Used By

- Zoho Books Integration (OAuth token storage)
- Any future integrations requiring secure token storage
