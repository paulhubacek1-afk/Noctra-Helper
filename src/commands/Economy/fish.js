import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { setEconomyData } from '../../utils/economy.js';
import { withErrorHandling } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { randomInt, randomChoice } from '../../utils/random.js';
import { requireEconomyData, enforceCooldown, applyItemMultiplier } from '../../utils/economyHelpers.js';

const FISH_COOLDOWN = 45 * 60 * 1000; 
const BASE_MIN_REWARD = 300;
const BASE_MAX_REWARD = 900;
const FISHING_ROD_MULTIPLIER = 1.5;

const FISH_TYPES = [
    { name: 'Bass', emoji: '🐟', rarity: 'common' },
    { name: 'Salmon', emoji: '🐟', rarity: 'common' },
    { name: 'Trout', emoji: '🐟', rarity: 'common' },
    { name: 'Tuna', emoji: '🐟', rarity: 'uncommon' },
    { name: 'Swordfish', emoji: '🐟', rarity: 'uncommon' },
    { name: 'Octopus', emoji: '🐙', rarity: 'rare' },
    { name: 'Lobster', emoji: '🦞', rarity: 'rare' },
    { name: 'Shark', emoji: '🦈', rarity: 'epic' },
    { name: 'Whale', emoji: '🐋', rarity: 'legendary' },
];

const CATCH_MESSAGES = [
    "You cast your line into the crystal clear waters...",
    "You wait patiently as your bobber floats...",
    "After a few minutes of waiting, you feel a tug...",
    "The water ripples as something takes your bait...",
    "You reel in your catch with expert precision...",
];

export default {
    data: new SlashCommandBuilder()
        .setName('fish')
        .setDescription('Go fishing to catch fish and earn money'),

    execute: withErrorHandling(async (interaction, config, client) => {
        const deferred = await InteractionHelper.safeDefer(interaction);
        if (!deferred) return;
            
            const userId = interaction.user.id;
            const guildId = interaction.guildId;
            const now = Date.now();

            const userData = await requireEconomyData(client, guildId, userId);

            enforceCooldown(userData, 'lastFish', FISH_COOLDOWN, 'fishing');

            const rand = Math.random();
            let fishCaught;

            if (rand < 0.5) {
                fishCaught = randomChoice(FISH_TYPES.filter(f => f.rarity === 'common'));
            } else if (rand < 0.75) {
                fishCaught = randomChoice(FISH_TYPES.filter(f => f.rarity === 'uncommon'));
            } else if (rand < 0.9) {
                fishCaught = randomChoice(FISH_TYPES.filter(f => f.rarity === 'rare'));
            } else if (rand < 0.98) {
                fishCaught = FISH_TYPES.find(f => f.rarity === 'epic');
            } else {
                fishCaught = FISH_TYPES.find(f => f.rarity === 'legendary');
            }

            const baseEarned = randomInt(BASE_MIN_REWARD, BASE_MAX_REWARD);

            const { amount: finalEarned, bonusMessage: multiplierMessage } =
                applyItemMultiplier(baseEarned, userData.inventory, 'fishing_rod', FISHING_ROD_MULTIPLIER, '🎣 **Fishing Rod Bonus: +50%**');

            const catchMessage = randomChoice(CATCH_MESSAGES);

            userData.wallet += finalEarned;
            userData.lastFish = now;

            await setEconomyData(client, guildId, userId, userData);

            const rarityColors = {
                common: '#95A5A6',
                uncommon: '#2ECC71',
                rare: '#3498DB',
                epic: '#9B59B6',
                legendary: '#F1C40F'
            };

            const embed = createEmbed({
                title: '🎣 Fishing Success!',
                description: `${catchMessage}\n\nYou caught a **${fishCaught.emoji} ${fishCaught.name}**! You sold it for **$${finalEarned.toLocaleString()}**!${multiplierMessage}`,
                color: rarityColors[fishCaught.rarity]
            })
                .addFields(
                    {
                        name: "💵 New Cash Balance",
                        value: `$${userData.wallet.toLocaleString()}`,
                        inline: true,
                    },
                    {
                        name: "🐟 Rarity",
                        value: fishCaught.rarity.charAt(0).toUpperCase() + fishCaught.rarity.slice(1),
                        inline: true,
                    }
                )
                .setFooter({ text: `Next fishing trip available in 45 minutes.` });

            await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    }, { command: 'fish' })
};
