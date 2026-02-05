const { Client, Events, GatewayIntentBits, Collection } = require('discord.js');
const { token, generalChannel, eggChannel } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');

const client = new Client(
	{ 
		intents: [
			GatewayIntentBits.GuildMessages,
			GatewayIntentBits.MessageContent,
			GatewayIntentBits.GuildMembers,
			GatewayIntentBits.Guilds,
		],
	});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
	client.user.setPresence({
		activities: [{ 
			name: "Egg Venture",
			type: 0
		}],
		status: "online"
	});
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

client.on(Events.GuildMemberAdd, async member => {
	try {
		if (!member.nickname) {
			await member.setNickname('Egg', 'Default nickname on join');
		}
	} catch (error) {
		console.log(`Failed to set nickname for ${member.user.tag}:`, error);
	}

	try {
		const general = await member.guild.channels.fetch(generalChannel);
		if (!general) return;

		const count = member.guild.memberCount;
		const dozens = Math.floor(count / 12);
		const remainder = count % 12;

		let eggCountMessage;
		if (dozens === 0) {
			eggCountMessage = `We currently have **${remainder} egg${remainder !== 1 ? 's' : ''}** <a:eggspin:1465219439871004829>`;
		} else if (remainder === 0) {
			eggCountMessage = `We now have **${dozens} dozen eggs** <a:eggspin:1465219439871004829>`;
		} else {
			eggCountMessage = `We now have **${dozens} dozen eggs and ${remainder} extra egg${remainder !== 1 ? 's' : ''}** <a:eggspin:1465219439871004829>`;
		}

		await general.send({
			content: `<:egghead:1435894590623453237> Welcome, fellow egg ${member}!\n${eggCountMessage}`
		});
	} catch (error) {
		console.log('Failed to send egg greeting:', error);
	}
});

client.on(Events.MessageCreate, async message => {
	if (message.author.bot) return;
	if (message.channel.id !== eggChannel) return;

	const content = message.content.trim().toLowerCase();
	if (content === 'egg') {
		try {
			await message.react('<:eggstare:1216148741354946560>');
		} catch (err) {
			console.log('Failed to react with eggstare:', err);
		}
		return;
	} else {
		try {
			await message.delete();

			const general = await message.guild.channels.fetch(generalChannel);
			if (!general) return;

			await general.send({
				content: `<:egghead:1435894590623453237> ${message.author} is a **rotten egg**.`,
				embeds: [{ image: { url: 'https://i.imgur.com/GdHbol7.gif' } }]
			});
		} catch (err) {
			console.log('Failed to punish rotten egg:', err);
		}
	}
});

client.login(token).then((token) => {
});