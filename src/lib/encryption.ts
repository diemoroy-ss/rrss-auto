import crypto from 'crypto';

// The key should be exactly 32 bytes (256 bits) for AES-256
// In a real environment, this must come from an environment variable:
// process.env.ENCRYPTION_KEY
const getSecretKey = () => {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        if (process.env.NODE_ENV === 'production') {
            console.warn("WARNING: ENCRYPTION_KEY is required in production environment variables");
        }
        // Fallback for local development if not set, 32 characters
        return 'Santisoft-Dev-Fallback-Key-32-bt';
    }
    
    // Ensure the key is exactly 32 bytes long
    if (key.length < 32) {
        return key.padEnd(32, '0').slice(0, 32);
    } else if (key.length > 32) {
        return key.slice(0, 32);
    }
    return key;
};

const SECRET_KEY = getSecretKey();
const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypts a plain text string into a hex string with an initialization vector (IV) and auth tag.
 * Returns an object with the encrypted hex string, the IV, and the AuthTag.
 */
export function encrypt(text: string): { encryptedData: string, iv: string, authTag: string } {
    if (!text) return { encryptedData: '', iv: '', authTag: '' };

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag
    };
}

/**
 * Decrypts a previously encrypted text using its IV and AuthTag.
 */
export function decrypt(encryptedData: string, iv: string, authTag: string): string {
    if (!encryptedData || !iv || !authTag) return '';

    try {
        const decipher = crypto.createDecipheriv(
            ALGORITHM, 
            Buffer.from(SECRET_KEY), 
            Buffer.from(iv, 'hex')
        );
        
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));

        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error("Decryption failed:", error);
        return '';
    }
}
