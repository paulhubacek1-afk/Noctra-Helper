/**
 * Shared validation helpers for moderation commands.
 *
 * Consolidates the self-target, bot-target, member-existence, and
 * role-hierarchy checks that were duplicated across ban, kick, timeout, and
 * warn commands.
 */

import { TitanBotError, ErrorTypes } from './errorHandler.js';

/**
 * Validates a moderation target and throws descriptive errors for common
 * invalid-target scenarios.
 *
 * @param {object}  options
 * @param {object}  options.interaction  – the slash-command interaction
 * @param {object}  options.targetUser   – the Discord User to act on
 * @param {object|null} options.member   – the GuildMember (null when the user left)
 * @param {object}  options.client       – the Discord client
 * @param {string}  options.action       – human-readable action verb (e.g. "ban", "kick")
 * @param {object}  [options.checks]     – which checks to run (all default to true)
 * @param {boolean} [options.checks.self]       – reject self-targeting
 * @param {boolean} [options.checks.bot]        – reject targeting the bot
 * @param {boolean} [options.checks.inGuild]    – require the target to be in the guild
 * @param {boolean} [options.checks.hierarchy]  – enforce role hierarchy
 * @param {boolean} [options.checks.actionable] – check member.kickable / moderatable
 */
export function validateModerationTarget({
    interaction,
    targetUser,
    member,
    client,
    action,
    checks = {},
}) {
    const {
        self = true,
        bot = true,
        inGuild = true,
        hierarchy = false,
        actionable = false,
    } = checks;

    if (self && targetUser.id === interaction.user.id) {
        throw new TitanBotError(
            `Cannot ${action} self`,
            ErrorTypes.VALIDATION,
            `You cannot ${action} yourself.`,
        );
    }

    if (bot && targetUser.id === client.user.id) {
        throw new TitanBotError(
            `Cannot ${action} bot`,
            ErrorTypes.VALIDATION,
            `You cannot ${action} the bot.`,
        );
    }

    if (inGuild && !member) {
        throw new TitanBotError(
            'Target not found',
            ErrorTypes.USER_INPUT,
            'The target user is not currently in this server.',
            { subtype: 'user_not_found' },
        );
    }

    if (hierarchy && member) {
        if (interaction.member.roles.highest.position <= member.roles.highest.position) {
            throw new TitanBotError(
                `Cannot ${action} user`,
                ErrorTypes.PERMISSION,
                `You cannot ${action} a user with an equal or higher role than you.`,
            );
        }
    }

    if (actionable && member) {
        const canAct = action === 'kick' ? member.kickable : member.moderatable;
        if (!canAct) {
            throw new TitanBotError(
                `Bot cannot ${action}`,
                ErrorTypes.PERMISSION,
                `I cannot ${action} this user. Please check my role position relative to the target user.`,
            );
        }
    }
}
