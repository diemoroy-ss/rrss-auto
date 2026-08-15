/**
 * Ejecuta una función asíncrona sobre una lista de elementos en lotes concurrentes de tamaño máximo `batchSize`.
 * Retorna los resultados manteniendo el orden original de los elementos.
 */
export async function runInBatches<T, R>(
    items: T[],
    batchSize: number,
    fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
    const results: R[] = new Array(items.length);
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(
            batch.map((item, batchIdx) => {
                const originalIndex = i + batchIdx;
                return fn(item, originalIndex);
            })
        );
        batchResults.forEach((res, batchIdx) => {
            results[i + batchIdx] = res;
        });
    }
    return results;
}
