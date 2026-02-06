const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../helpers/db');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stats')
		.setDescription('View egg statistics'),

	async execute(interaction) {
		await db.read();

		const user = db.data.users[interaction.user.id] || { eggs: 0, rotten: 0 };
		const total = db.data.totals.eggs;
		const rotten = db.data.totals.rotten;
		const dozens = Math.floor(total / 12);

        const topEggs = Object.entries(db.data.users)
			.sort((a, b) => b[1].eggs - a[1].eggs)
			.slice(0, 5);

        let leaderboard = '';
		for (let i = 0; i < topEggs.length; i++) {
			const [id, stats] = topEggs[i];
			const member = await interaction.guild.members.fetch(id).catch(() => null);

			const displayName = member?.displayName || 'Unknown Egg';
			const username = member?.user.username || '???';

			const medal = [
                '<:eggbond:1435895173593829417> #1',
                '<:eggsunglasses:1435894272540020797> #2',
                '<:egghead:1435894590623453237> #3',
                '<:eggstare:1216148741354946560> #4',
                '<:eggcrust:1362667849612787892> #5'
            ][i];

			leaderboard += `${medal} **${displayName}** (${username}) — **${stats.eggs} eggs**\n`;
		}

        const reportEmbed = new EmbedBuilder()
			.setTitle('<:egghead:1435894590623453237> Egg Report')
			.setColor(0xdf0001)
			.addFields(
				{
					name: '<:eggstare:1216148741354946560> You',
					value:
						`<:eggstare:1216148741354946560> Eggs: **${user.eggs}**\n` +
						`<a:eggGun:1469116796735852555> Rotten: **${user.rotten}**`,
					inline: true
				},
				{
					name: '<a:eggspin:1465219439871004829> Server',
					value:
						`<a:eggspin:1465219439871004829> Eggs: **${total}**\n` +
						`<:eggbond:1435895173593829417> Dozens: **${dozens}**\n` +
						`<:eggno:1464143612743913579> Rotten: **${rotten}**`,
					inline: true
				}
			)

        const leaderboardEmbed = new EmbedBuilder()
			.setTitle('<:egghead:1435894590623453237> Egg Leaderboard')
			.setDescription(leaderboard || 'No eggs yet… tragic.')
			.setColor(0x629bf5)
			.setFooter({ text: `Tracking since ${db.data.meta.seededAt ? new Date(db.data.meta.seededAt).toLocaleDateString() : 'unknown'}` });

		await interaction.reply({
			embeds: [reportEmbed, leaderboardEmbed]
		});
	}
};
