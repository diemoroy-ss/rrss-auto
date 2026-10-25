/**
 * Recursively sanitizes an object before saving to Firestore.
 * Converts `undefined` values to `null` and ensures nested arrays and objects
 * are valid for Firestore's `addDoc` / `setDoc` / `updateDoc`.
 *
 * Prevents:
 * "FirebaseError: Function addDoc() called with invalid data. Unsupported field value: undefined"
 */
export function sanitizeFirestorePayload<T>(value: T): T {
  if (value === undefined) {
    return null as any;
  }
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (value instanceof Date) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeFirestorePayload(item)) as any;
  }
  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(value)) {
    if (val !== undefined) {
      clean[key] = sanitizeFirestorePayload(val);
    } else {
      clean[key] = null;
    }
  }
  return clean as any;
}
