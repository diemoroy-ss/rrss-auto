/**
 * Módulo de Seguridad y Sanitización para AI y APIs
 * Proporciona métodos para prevenir Prompt Injections y asegurar respuestas limpias.
 */

// Lista de patrones comunes utilizados en ataques de Prompt Injection (Caso Insensitivo)
const PROMPT_INJECTION_PATTERNS = [
    /ignore\s+(any\s+)?previous\s+instructions/i,
    /ignora\s+(todas\s+)?las\s+instrucciones\s+anteriores/i,
    /system\s+instruction/i,
    /instrucción\s+del\s+sistema/i,
    /you\s+are\s+now\s+a/i,
    /ahora\s+eres\s+un/i,
    /delete\s+all\s+data/i,
    /borra\s+todos\s+los\s+datos/i,
    /bypass\s+rules/i,
    /evade\s+las\s+reglas/i,
    /new\s+role/i,
    /nuevo\s+rol/i,
    /ignore\s+above/i,
    /ignora\s+lo\s+anterior/i
];

/**
 * Sanitiza las entradas del usuario destinadas a prompts de Inteligencia Artificial (LLM).
 * Elimina intentos de prompt injection, remueve etiquetas XML/HTML que intenten romper delimitadores
 * y trunca el texto a una longitud máxima segura para mitigar ataques de desbordamiento de contexto.
 * 
 * @param input Texto a sanitizar
 * @param maxLength Longitud máxima permitida (por defecto 2000 caracteres)
 */
export function sanitizeInput(input: string, maxLength: number = 2000): string {
    if (!input) return "";

    // 1. Limpieza básica de espacios y truncado inicial de longitud
    let sanitized = input.trim();
    if (sanitized.length > maxLength) {
        sanitized = sanitized.slice(0, maxLength) + " [Truncado por seguridad]";
    }

    // 2. Mitigar Prompt Injection: Reemplazar frases conocidas por advertencias
    for (const pattern of PROMPT_INJECTION_PATTERNS) {
        if (pattern.test(sanitized)) {
            console.warn(`[SECURITY] Prompt Injection pattern detected and removed: ${pattern.source}`);
            sanitized = sanitized.replace(pattern, "[Contenido bloqueado por directivas de seguridad]");
        }
    }

    // 3. Sanitizar caracteres de control o rotura de contexto
    // Escapar etiquetas que puedan intentar interferir con el formateo XML o comillas triples del sistema
    sanitized = sanitized
        .replace(/<\/?[^>]+(>|$)/g, "") // Remueve etiquetas HTML/XML
        .replace(/"""/g, '"')           // Evita roturas en delimitadores de comillas triples
        .replace(/```/g, '`');           // Evita bloques de código inyectados que alteren el flujo del parser

    return sanitized;
}

/**
 * Filtra los errores para evitar fugas de información sensible (Information Disclosure) al cliente.
 * Loguea el error real completo y su stack trace en los logs seguros del servidor,
 * pero devuelve un mensaje estéril y estandarizado al frontend.
 * 
 * @param error Excepción capturada en el bloque catch
 * @param defaultMessage Mensaje genérico legible por el usuario
 */
export function maskError(error: unknown, defaultMessage: string = "Ha ocurrido un error interno en el servidor."): {
    success: false;
    error: string;
    code: number;
} {
    const err = error as Error & { code?: number; status?: number };
    
    // Logueo seguro y detallado en la consola interna del servidor
    console.error("[SERVER ERROR DETAILS]:", {
        message: err.message,
        stack: err.stack,
        code: err.code || err.status,
        timestamp: new Date().toISOString()
    });

    // Respuesta limpia y segura sin stack traces
    return {
        success: false,
        error: err.status === 400 || err.status === 401 || err.status === 403 
            ? err.message 
            : defaultMessage,
        code: err.status || err.code || 500
    };
}
