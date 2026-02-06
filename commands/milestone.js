const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { initDB } = require('../helpers/db');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('milestone')
		.setDescription('View the current egg milestone'),

	async execute(interaction) {
		const db = await initDB();

		const total = db.data.totals.eggs;
		const next = db.data.milestones.next;
		const remaining = Math.max(next - total, 0);
		const percent = Math.min(((total / next) * 100).toFixed(1), 100);

		const embed = new EmbedBuilder()
			.setTitle('<:egghead:1435894590623453237> Egg Milestone')
			.setColor(0xfff2a8)
			.addFields(
				{
					name: '<a:eggspin:1465219439871004829> Progress',
					value:
						`<:eggstare:1216148741354946560> Current eggs: **${total}**\n` +
						`<:eggbond:1435895173593829417> Target: **${next}**\n` +
						`<:eggsunglasses:1435894272540020797> Remaining: **${remaining}**`,
					inline: false
				},
				{
					name: '<a:eggGun:1469116796735852555> Completion',
					value: `**${percent}%**`,
					inline: true
				}
			);

		await interaction.reply({ embeds: [embed] });
	}
};