import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
    const keyString = process.env.ENCRYPTION_KEY;
    if (!keyString) {
        throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    const key = Buffer.from(keyString, 'hex');
    if (key.length !== 32) {
        throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
    }
    return key;
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * @returns "iv:authTag:ciphertext" as hex
 */
export function encrypt(plaintext: string): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(12); // Recommended 96-bit IV for GCM
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${authTag}:${ciphertext}`;
}

/**
 * Decrypts an encrypted string "iv:authTag:ciphertext" back to plaintext.
 */
export function decrypt(encrypted: string): string {
    const key = getEncryptionKey();
    
    const parts = encrypted.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted string format. Expected iv:authTag:ciphertext');
    }
    
    const [ivHex, authTagHex, ciphertextHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let plaintext = decipher.update(ciphertextHex, 'hex', 'utf8');
    plaintext += decipher.final('utf8');
    
    return plaintext;
}
