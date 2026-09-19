const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const { initDB } = require('../helpers/db');

const SIX_HOURS = 6 * 60 * 60 * 1000;

const DAY = 24 * 60 * 60 * 1000;

const WEEK = 7 * DAY;

const MONTH = 30 * DAY;

function getEfficiency(timestamps, period) {
    const now = Date.now();
    const cutoff = now - period;

    const eggs = timestamps.filter(timestamp => timestamp >= cutoff).length;

    const maxEggs = Math.floor(period / SIX_HOURS);

    const efficiency = maxEggs > 0
        ? (eggs / maxEggs) * 100
        : 0;

    return {
        eggs,
        maxEggs,
        efficiency
    };
}

function getAllTimeEfficiency(user) {
    const eggs = user.eggs || 0;

    const timestamps = user.eggTimestamps || [];

    if (timestamps.length === 0) {
        return {
            eggs,
            maxEggs: 0,
            efficiency: 0
        };
    }

    const firstEgg = Math.min(...timestamps);
    const elapsed = Date.now() - firstEgg;

    const maxEggs = Math.floor(elapsed / SIX_HOURS) + 1;

    const efficiency = maxEggs > 0
        ? (eggs / maxEggs) * 100
        : 0;

    return {
        eggs,
        maxEggs,
        efficiency
    };
}

function formatEfficiency(value) {
    return `${value.toFixed(1)}%`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('eggficiency')
        .setDescription('See how eggficient you collect eggs'),

    async execute(interaction) {
        const db = await initDB();

        const user = db.data.users[interaction.user.id] || {
            eggs: 0,
            rotten: 0,
            eggTimestamps: []
        };

        const timestamps = user.eggTimestamps || [];

        const daily = getEfficiency(timestamps, DAY);
        const weekly = getEfficiency(timestamps, WEEK);
        const monthly = getEfficiency(timestamps, MONTH);
        const allTime = getAllTimeEfficiency(user);

        const embed = new EmbedBuilder()
            .setTitle('<:egghead:1435894590623453237> Eggficiency')
            .setDescription(
                `How eggficient is **${interaction.member?.displayName || interaction.user.username}**?`
            )
            .setColor(0xdf0001)
            .addFields(
                {
                    name: '<:eggstare:1216148741354946560> Daily',
                    value:
                        `**${daily.eggs} / ${daily.maxEggs} eggs**\n` +
                        `Eggficiency: **${formatEfficiency(daily.efficiency)}**`,
                    inline: true
                },
                {
                    name: '<a:eggspin:1465219439871004829> Weekly',
                    value:
                        `**${weekly.eggs} / ${weekly.maxEggs} eggs**\n` +
                        `Eggficiency: **${formatEfficiency(weekly.efficiency)}**`,
                    inline: true
                },
                {
                    name: '<:eggbond:1435895173593829417> Monthly',
                    value:
                        `**${monthly.eggs} / ${monthly.maxEggs} eggs**\n` +
                        `Eggficiency: **${formatEfficiency(monthly.efficiency)}**`,
                    inline: true
                },
                {
                    name: '<:egghead:1435894590623453237> All Time',
                    value:
                        `**${allTime.eggs} / ${allTime.maxEggs} eggs**\n` +
                        `Eggficiency: **${formatEfficiency(allTime.efficiency)}**`,
                    inline: false
                }
            );

        await interaction.reply({
            embeds: [embed]
        });
    }
};