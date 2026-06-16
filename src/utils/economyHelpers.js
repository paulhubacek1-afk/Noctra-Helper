/**
 * Shared helpers for economy commands.
 *
 * Eliminates the duplicated economy-data-loading, cooldown-checking, and
 * item-multiplier blocks that were copy-pasted across every economy command.
 */

import { getEconomyData } from './economy.js';
import { createError, ErrorTypes } from './errorHandler.js';
import { formatDuration } from './helpers.js';

/**
 * Loads economy data for a user and throws a standardized DATABASE error when
 * the data cannot be retrieved.
 *
 * Replaces the repeated pattern:
 *   const userData = await getEconomyData(client, guildId, userId);
 *   if (!userData) { throw createError(…) }
 */
export async function requireEconomyData(client, guildId, userId) {
    const userData = await getEconomyData(client, guildId, userId);

    if (!userData) {
        throw createError(
            'Failed to load economy data',
            ErrorTypes.DATABASE,
            'Failed to load your economy data. Please try again later.',
            { userId, guildId },
        );
    }

    return userData;
}

/**
 * Checks whether a cooldown is still active and throws a RATE_LIMIT error with
 * a human-readable remaining-time string when it is.
 *
 * @param {object}  userData       – the user's economy record
 * @param {string}  cooldownField  – property name storing the last-use timestamp (e.g. "lastWork")
 * @param {number}  cooldownMs     – cooldown length in milliseconds
 * @param {string}  commandLabel   – human label for the error message (e.g. "working")
 * @returns {void}  – returns normally when the cooldown has expired
 */
export function enforceCooldown(userData, cooldownField, cooldownMs, commandLabel) {
    const lastUsed = userData[cooldownField] || 0;
    const now = Date.now();
    const remaining = (lastUsed + cooldownMs) - now;

    if (remaining > 0) {
        throw createError(
            `${commandLabel} cooldown active`,
            ErrorTypes.RATE_LIMIT,
            `You need to wait **${formatDuration(remaining)}** before ${commandLabel} again.`,
            { timeRemaining: remaining, cooldownType: commandLabel },
        );
    }
}

/**
 * Applies an inventory-item multiplier to a base earning amount.
 *
 * @param {number}  baseAmount   – earnings before multiplier
 * @param {object}  inventory    – the user's inventory object
 * @param {string}  itemKey      – inventory key to check (e.g. "fishing_rod")
 * @param {number}  multiplier   – multiplier to apply (e.g. 1.5 for +50%)
 * @param {string}  bonusLabel   – display label for the bonus message (e.g. "🎣 **Fishing Rod Bonus: +50%**")
 * @returns {{ amount: number, bonusMessage: string }}
 */
export function applyItemMultiplier(baseAmount, inventory, itemKey, multiplier, bonusLabel) {
    const hasItem = (inventory || {})[itemKey] || 0;

    if (hasItem > 0) {
        return {
            amount: Math.floor(baseAmount * multiplier),
            bonusMessage: `\n${bonusLabel}`,
        };
    }

    return { amount: baseAmount, bonusMessage: '' };
}
