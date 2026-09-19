const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { initDB } = require('../helpers/db');

const SIX_HOURS = 6 * 60 * 60 * 1000;

const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;

function getEfficiency(users, period) {
	const now = Date.now();
	const cutoff = now - period;
	let eggs = 0;

	for (const user of Object.values(users)) {
		const timestamps = user.eggTimestamps || [];

		eggs += timestamps.filter(timestamp => timestamp >= cutoff).length;
	}

	const userCount = Object.keys(users).length;
	const maxEggsPerUser = Math.floor(period / SIX_HOURS);
	const maxEggs = userCount * maxEggsPerUser;
	const efficiency = maxEggs > 0
		? (eggs / maxEggs) * 100
		: 0;

	return {
		eggs,
		maxEggs,
		efficiency,
		userCount
	};
}

function getAllTimeEfficiency(users) {
    let eggs = 0;
    let firstEgg = null;
    for (const user of Object.values(users)) {
        eggs += user.eggs || 0;
        const timestamps = user.eggTimestamps || [];
        if (timestamps.length > 0) {
            const userFirstEgg = Math.min(...timestamps);
            if (firstEgg === null || userFirstEgg < firstEgg) {
                firstEgg = userFirstEgg;
            }
        }
    }

    if (firstEgg === null) {
        return {
            eggs,
            maxEggs: 0,
            efficiency: 0,
            userCount: Object.keys(users).length
        };
    }

    const elapsed = Date.now() - firstEgg;
    const maxEggs = Math.floor(elapsed / SIX_HOURS) + 1;
    const efficiency = maxEggs > 0
        ? (eggs / maxEggs) * 100
        : 0;

    return {
        eggs,
        maxEggs,
        efficiency,
        userCount: Object.keys(users).length
    };
}

function formatEfficiency(value) {
	return `${value.toFixed(1)}%`;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('server-eggficiency')
		.setDescription('See how eggficient the server collects eggs'),

	async execute(interaction) {
		const db = await initDB();

		const daily = getEfficiency(db.data.users, DAY);
		const weekly = getEfficiency(db.data.users, WEEK);
		const monthly = getEfficiency(db.data.users, MONTH);
        const allTime = getAllTimeEfficiency(db.data.users);

		const embed = new EmbedBuilder()
			.setTitle('<:egghead:1435894590623453237> Server Eggficiency')
			.setDescription(
				`How eggficient is the server?\n\n` +
				`**${daily.userCount} egg collectors** are currently tracked.\n` +
				`Each egg can collect **4 eggs per day**.`
			)
			.setColor(0x629bf5)
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