import { SlashCommandBuilder } from 'discord.js';
import { successEmbed } from '../../utils/embeds.js';
import { setEconomyData } from '../../utils/economy.js';
import { withErrorHandling } from '../../utils/errorHandler.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { randomInt, randomChoice } from '../../utils/random.js';
import { requireEconomyData, enforceCooldown, applyItemMultiplier } from '../../utils/economyHelpers.js';

const WORK_COOLDOWN = 30 * 60 * 1000;
const MIN_WORK_AMOUNT = 50;
const MAX_WORK_AMOUNT = 300;
const LAPTOP_MULTIPLIER = 1.5;
const WORK_JOBS = [
    "Software Developer",
    "Barista",
    "Janitor",
    "YouTuber",
    "Discord Bot Developer",
    "Cashier",
    "Pizza Delivery Driver",
    "Librarian",
    "Gardener",
    "Data Analyst",
];

export default {
    data: new SlashCommandBuilder()
        .setName('work')
        .setDescription('Work to earn some money'),

    execute: withErrorHandling(async (interaction, config, client) => {
        const deferred = await InteractionHelper.safeDefer(interaction);
        if (!deferred) return;
            
            const userId = interaction.user.id;
            const guildId = interaction.guildId;
            const now = Date.now();

            const userData = await requireEconomyData(client, guildId, userId);

            logger.debug(`[ECONOMY] Work command started for ${userId}`, { userId, guildId });

            const inventory = userData.inventory || {};
            const extraWorkShifts = inventory["extra_work"] || 0;
            let usedConsumable = false;

            const cooldownActive = now < (userData.lastWork || 0) + WORK_COOLDOWN;
            if (cooldownActive) {
                if (extraWorkShifts > 0) {
                    inventory["extra_work"] = (inventory["extra_work"] || 0) - 1;
                    usedConsumable = true;
                } else {
                    enforceCooldown(userData, 'lastWork', WORK_COOLDOWN, 'working');
                }
            }

            let earned = randomInt(MIN_WORK_AMOUNT, MAX_WORK_AMOUNT);
            const job = randomChoice(WORK_JOBS);

            const { amount: finalEarned, bonusMessage: multiplierMessage } =
                applyItemMultiplier(earned, inventory, 'laptop', LAPTOP_MULTIPLIER, '💻 **Laptop Bonus:** +50% earnings!');
            earned = finalEarned;

            userData.wallet = (userData.wallet || 0) + earned;
            userData.lastWork = now;

            await setEconomyData(client, guildId, userId, userData);

            logger.info(`[ECONOMY_TRANSACTION] Work completed`, {
                userId,
                guildId,
                amount: earned,
                job,
                usedConsumable,
                hasLaptop: hasLaptop > 0,
                newWallet: userData.wallet,
                timestamp: new Date().toISOString()
            });

            const embed = successEmbed(
                "💼 Work Complete!",
                `You worked as a **${job}** and earned **$${earned.toLocaleString()}**!${multiplierMessage}`
            )
                .addFields(
                    {
                        name: "💰 New Balance",
                        value: `$${userData.wallet.toLocaleString()}`,
                        inline: true,
                    },
                    {
                        name: "⏰ Next Work",
                        value: `<t:${Math.floor((now + WORK_COOLDOWN) / 1000)}:R>`,
                        inline: true,
                    }
                )
                .setFooter({
                    text: `Requested by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL(),
                });

            await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    }, { command: 'work' })
};




