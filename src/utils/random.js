/**
 * Shared random-number helpers.
 *
 * These replace the inline `Math.floor(Math.random() * …)` patterns that were
 * duplicated across economy commands, fun commands, and elsewhere.
 */

/**
 * Returns a random integer in the inclusive range [min, max].
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Returns a random element from `items`.
 * Returns undefined when the array is empty.
 */
export function randomChoice(items) {
    if (!items || items.length === 0) return undefined;
    return items[Math.floor(Math.random() * items.length)];
}
