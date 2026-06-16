import { SlashCommandBuilder } from 'discord.js';
import { setEconomyData } from '../../utils/economy.js';
import { withErrorHandling } from '../../utils/errorHandler.js';
import { MessageTemplates } from '../../utils/messageTemplates.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { randomInt, randomChoice } from '../../utils/random.js';
import { requireEconomyData, enforceCooldown } from '../../utils/economyHelpers.js';

const COOLDOWN = 30 * 60 * 1000;
const MIN_WIN = 50;
const MAX_WIN = 200;
const SUCCESS_CHANCE = 0.7;

export default {
    data: new SlashCommandBuilder()
        .setName('beg')
        .setDescription('Beg for a small amount of money'),

    execute: withErrorHandling(async (interaction, config, client) => {
        const deferred = await InteractionHelper.safeDefer(interaction);
        if (!deferred) return;
            
            const userId = interaction.user.id;
            const guildId = interaction.guildId;

            let userData = await requireEconomyData(client, guildId, userId);

            enforceCooldown(userData, 'lastBeg', COOLDOWN, 'begging');

            const success = Math.random() < SUCCESS_CHANCE;

            let replyEmbed;
            let newCash = userData.wallet;

            if (success) {
                const amountWon = randomInt(MIN_WIN, MAX_WIN);

                newCash += amountWon;

                const successMessages = [
                    `A kind stranger drops **$${amountWon.toLocaleString()}** into your cup.`,
                    `You spotted an unattended wallet! You grab **$${amountWon.toLocaleString()}** and run.`,
                    `Someone took pity on you and gave you **$${amountWon.toLocaleString()}**!`,
                    `You found **$${amountWon.toLocaleString()}** under a park bench.`,
                ];

                replyEmbed = MessageTemplates.SUCCESS.DATA_UPDATED(
                    "begging",
                    randomChoice(successMessages)
                );
            } else {
                const failMessages = [
                    "The police chased you off. You got nothing.",
                    "Someone yelled, 'Get a job!' and walked past.",
                    "A squirrel stole the single coin you had.",
                    "You tried to beg, but you were too embarrassed and gave up.",
                ];

                replyEmbed = MessageTemplates.ERRORS.INSUFFICIENT_FUNDS(
                    "nothing",
                    "You failed to get any money from begging."
                );
                replyEmbed.data.description = randomChoice(failMessages);
            }

            userData.wallet = newCash;
userData.lastBeg = Date.now();

            await setEconomyData(client, guildId, userId, userData);

            await InteractionHelper.safeEditReply(interaction, { embeds: [replyEmbed] });
    }, { command: 'beg' })
};


