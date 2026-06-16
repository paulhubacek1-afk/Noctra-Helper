import { SlashCommandBuilder } from 'discord.js';
import { successEmbed } from '../../utils/embeds.js';
import { setEconomyData } from '../../utils/economy.js';
import { withErrorHandling } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { randomInt, randomChoice } from '../../utils/random.js';
import { requireEconomyData, enforceCooldown, applyItemMultiplier } from '../../utils/economyHelpers.js';

const MINE_COOLDOWN = 60 * 60 * 1000;
const BASE_MIN_REWARD = 400;
const BASE_MAX_REWARD = 1200;
const PICKAXE_MULTIPLIER = 1.2;
const DIAMOND_PICKAXE_MULTIPLIER = 2.0;

const MINE_LOCATIONS = [
    "abandoned gold mine",
    "dark, damp cave",
    "backyard rock quarry",
    "volcanic obsidian vent",
    "deep-sea mineral trench",
];

export default {
    data: new SlashCommandBuilder()
        .setName('mine')
        .setDescription('Go mining to earn money'),

    execute: withErrorHandling(async (interaction, config, client) => {
        const deferred = await InteractionHelper.safeDefer(interaction);
        if (!deferred) return;
            
            const userId = interaction.user.id;
            const guildId = interaction.guildId;
            const now = Date.now();

            const userData = await requireEconomyData(client, guildId, userId);

            enforceCooldown(userData, 'lastMine', MINE_COOLDOWN, 'mining');

            const baseEarned = randomInt(BASE_MIN_REWARD, BASE_MAX_REWARD);
            const inventory = userData.inventory || {};

            let { amount: finalEarned, bonusMessage: multiplierMessage } =
                applyItemMultiplier(baseEarned, inventory, 'diamond_pickaxe', DIAMOND_PICKAXE_MULTIPLIER, '💎 **Diamond Pickaxe Bonus: +100%**');

            if (!multiplierMessage) {
                ({ amount: finalEarned, bonusMessage: multiplierMessage } =
                    applyItemMultiplier(baseEarned, inventory, 'pickaxe', PICKAXE_MULTIPLIER, '⛏️ **Pickaxe Bonus: +20%**'));
            }

            const location = randomChoice(MINE_LOCATIONS);

            userData.wallet += finalEarned;
userData.lastMine = now;

            await setEconomyData(client, guildId, userId, userData);

            const embed = successEmbed(
                "💰 Mining Expedition Successful!",
                `You explored a **${location}** and managed to find minerals worth **$${finalEarned.toLocaleString()}**!${multiplierMessage}`,
            )
                .addFields({
                    name: "💵 New Cash Balance",
                    value: `$${userData.wallet.toLocaleString()}`,
                    inline: true,
                })
                .setFooter({ text: `Next mine available in 1 hour.` });

            await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    }, { command: 'mine' })
};




