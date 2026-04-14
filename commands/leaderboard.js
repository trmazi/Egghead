const {
	SlashCommandBuilder,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ComponentType
} = require('discord.js');

const { initDB } = require('../helpers/db');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('View the egg leaderboard')
		.addIntegerOption(option =>
			option.setName('page')
				.setDescription('Page number to view')
				.setMinValue(1)
		),

	async execute(interaction) {
		const db = await initDB();

		let page = (interaction.options.getInteger('page') || 1) - 1;

		const users = Object.entries(db.data.users)
			.sort((a, b) => b[1].eggs - a[1].eggs);

		if (users.length === 0) {
			return interaction.reply({ content: 'No eggs yet... tragic.', ephemeral: true });
		}

		const pageSize = 10;
		const totalPages = Math.ceil(users.length / pageSize);

		page = Math.max(0, Math.min(page, totalPages - 1));

		await interaction.guild.members.fetch();

		const generateEmbed = (page) => {
			const start = page * pageSize;
			const slice = users.slice(start, start + pageSize);

			let description = '';

			for (let i = 0; i < slice.length; i++) {
				const [id, stats] = slice[i];
				const rank = start + i + 1;

				const member = interaction.guild.members.cache.get(id);

				const displayName = member?.displayName || 'Unknown Egg';
				const username = member?.user.username || '?';

				let prefix;
				if (rank === 1) prefix = '<:eggbond:1435895173593829417> #1';
				else if (rank === 2) prefix = '<:eggsunglasses:1435894272540020797> #2';
				else if (rank === 3) prefix = '<:egghead:1435894590623453237> #3';
				else prefix = `#${rank}`;

				description += `${prefix} **${displayName}** (${username}) — **${stats.eggs} eggs**\n`;
			}

			return new EmbedBuilder()
				.setTitle('<:egghead:1435894590623453237> Egg Leaderboard')
				.setDescription(description)
				.setColor(0x629bf5)
				.setFooter({
					text: `Page ${page + 1} / ${totalPages} | Tracking since ${
						db.data.meta.seededAt
							? new Date(db.data.meta.seededAt).toLocaleDateString()
							: 'unknown'
					}`
				});
		};

		const getRow = (page) =>
			new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId('prev')
					.setLabel('Prev')
					.setStyle(ButtonStyle.Primary)
					.setDisabled(page === 0),

				new ButtonBuilder()
					.setCustomId('next')
					.setLabel('Next')
					.setStyle(ButtonStyle.Primary)
					.setDisabled(page === totalPages - 1)
			);

		const msg = await interaction.reply({
			embeds: [generateEmbed(page)],
			components: [getRow(page)],
			fetchReply: true
		});

		const collector = msg.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: 60_000
		});

		collector.on('collect', async (i) => {
			if (i.user.id !== interaction.user.id) {
				return i.reply({
					content: 'not your egg leaderboard <:eggstare:1216148741354946560>',
					ephemeral: true
				});
			}

			if (i.customId === 'prev') page--;
			if (i.customId === 'next') page++;

			page = Math.max(0, Math.min(page, totalPages - 1));

			await i.update({
				embeds: [generateEmbed(page)],
				components: [getRow(page)]
			});
		});

		collector.on('end', async () => {
			await msg.edit({ components: [] }).catch(() => {});
		});
	}
};