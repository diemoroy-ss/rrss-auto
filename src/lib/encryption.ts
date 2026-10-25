import * as crypto from 'crypto';

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

/**
 * Valida que un origin pertenezca estrictamente a dominios permitidos del proyecto
 * para evitar Open Redirects en flujos OAuth.
 */
export function getSafeOrigin(origin?: string | null): string {
    const defaultOrigin = process.env.NEXT_PUBLIC_APP_URL || "https://socialpilot.cl";
    if (!origin) return defaultOrigin;
    try {
        const url = new URL(origin);
        const host = url.hostname.toLowerCase();
        const isAllowed =
            host === "socialpilot.cl" ||
            host === "www.socialpilot.cl" ||
            host === "fideliza.socialpilot.cl" ||
            host === "automatizacion.santisoft.cl" ||
            host === "rrss.santisoft.cl" ||
            host === "localhost" ||
            host === "127.0.0.1";
        if (isAllowed) return `${url.protocol}//${url.host}`;
    } catch {}
    return defaultOrigin;
}

/**
 * Genera un parámetro 'state' autenticado criptográficamente con AES-GCM (Anti-CSRF).
 */
export function createSignedOAuthState(payload: Record<string, any>): string {
    const data = JSON.stringify({ ...payload, timestamp: Date.now() });
    const { encryptedData, iv, authTag } = encrypt(data);
    return `${encryptedData}.${iv}.${authTag}`;
}

/**
 * Desencripta y verifica la autenticidad del 'state' recibido de OAuth.
 * Si es un formato legado (uid|profileId|origin), lo parsea validando el origin.
 */
export function verifySignedOAuthState(stateString?: string | null): { uid: string; profileId: string; origin: string } | null {
    if (!stateString) return null;
    const raw = decodeURIComponent(stateString);

    // 1. Intentar desencriptar estado autenticado
    if (raw.includes('.')) {
        const parts = raw.split('.');
        if (parts.length === 3) {
            const [encryptedData, iv, authTag] = parts;
            const decrypted = decrypt(encryptedData, iv, authTag);
            if (decrypted) {
                try {
                    const parsed = JSON.parse(decrypted);
                    // Expira tras 1 hora
                    if (parsed.timestamp && Date.now() - parsed.timestamp < 3600 * 1000) {
                        return {
                            uid: parsed.uid,
                            profileId: parsed.profileId,
                            origin: getSafeOrigin(parsed.origin),
                        };
                    }
                } catch {}
            }
        }
    }

    // 2. Fallback de compatibilidad legado (uid|profileId|origin)
    if (raw.includes('|')) {
        const [uid, profileId, rawOrigin] = raw.split('|');
        if (uid && profileId) {
            return {
                uid,
                profileId,
                origin: getSafeOrigin(rawOrigin),
            };
        }
    }

    return null;
}
