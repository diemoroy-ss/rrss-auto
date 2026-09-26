/**
 * Módulo de Seguridad y Sanitización para AI y APIs
 * Proporciona métodos para prevenir Prompt Injections y asegurar respuestas limpias.
 */

// Lista de patrones comunes utilizados en ataques de Prompt Injection y Fuga de Instrucciones
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
    /ignora\s+lo\s+anterior/i,
    // Intentos de extracción de código fuente, prompts o credenciales
    /(ind[ií]came|dame|muestra|mu[eé]strame|ense[ñn]a|cu[aá]l\s+es|revela|descarga|imprime)\s+(el|tu|los|tu\s+propio)?\s*(c[oó]digo\s+fuente|source\s+code|c[oó]digo|backend|frontend|archivos|repositorio|prompt|system\s+prompt|instrucciones(\s+del\s+sistema)?|credenciales|api\s*keys?|tokens?)/i,
    /(show|give|tell|print|reveal|expose|dump)\s+(me\s+)?(your\s+)?(source\s+code|codebase|system\s+prompt|system\s+instructions|secret|api\s*key|database|credentials)/i,
    /(qu[eé]\s+instrucciones\s+te\s+dieron|cu[aá]l\s+es\s+tu\s+prompt|revela\s+tus\s+instrucciones)/i,
    /DAN\s+mode/i,
    /jailbreak/i
];

// Patrones de inyección SQL clásicos y ciegos (SQLi)
const SQL_INJECTION_PATTERNS = [
    /('|"|;|`)\s*(OR|AND)\s+('|"|\d|\w)+\s*=\s*('|"|\d|\w)+/i,
    /('|"|;)?\s*UNION\s+(ALL\s+)?SELECT/i,
    /('|"|;)?\s*DROP\s+(TABLE|DATABASE|VIEW)/i,
    /('|"|;)?\s*INSERT\s+INTO\s+/i,
    /('|"|;)?\s*UPDATE\s+[\w_]+\s+SET\s+/i,
    /('|"|;)?\s*DELETE\s+FROM\s+/i,
    /--[^\r\n]*/,
    /\/\*[\s\S]*?\*\//,
    /;\s*(SHUTDOWN|EXEC|EXECUTE)\b/i,
    /\b(SLEEP|BENCHMARK|WAITFOR\s+DELAY)\s*\(/i
];

/**
 * Detecta si una cadena contiene intentos de ataque de inyección SQL o Prompt Injection.
 */
export function detectSecurityThreat(input: string): { isThreat: boolean; threatType?: 'sqli' | 'prompt_injection'; matchedPattern?: string } {
    if (!input) return { isThreat: false };

    for (const pattern of SQL_INJECTION_PATTERNS) {
        if (pattern.test(input)) {
            return { isThreat: true, threatType: 'sqli', matchedPattern: pattern.source };
        }
    }

    for (const pattern of PROMPT_INJECTION_PATTERNS) {
        if (pattern.test(input)) {
            return { isThreat: true, threatType: 'prompt_injection', matchedPattern: pattern.source };
        }
    }

    return { isThreat: false };
}

/**
 * Sanitiza las entradas del usuario destinadas a prompts de agentes o consultas.
 * Neutraliza inyecciones SQL, bloquea extracciones de código y previene Prompt Injections.
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

    // 2. Mitigar Inyección SQL
    for (const pattern of SQL_INJECTION_PATTERNS) {
        if (pattern.test(sanitized)) {
            console.warn(`[SECURITY] SQL Injection pattern detected and neutralized: ${pattern.source}`);
            sanitized = sanitized.replace(pattern, "[Consulta SQL bloqueada]");
        }
    }

    // 3. Mitigar Prompt Injection y fuga de código fuente
    for (const pattern of PROMPT_INJECTION_PATTERNS) {
        if (pattern.test(sanitized)) {
            console.warn(`[SECURITY] Prompt/Source code extraction pattern detected and neutralized: ${pattern.source}`);
            sanitized = sanitized.replace(pattern, "[Petición bloqueada: creación exclusiva de contenido para redes sociales]");
        }
    }

    // 4. Sanitizar caracteres de control o rotura de contexto
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
