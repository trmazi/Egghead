const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('egg')
        .setDescription('Test the bot!'),

    async execute(interaction) {
        interaction.reply('ermmmm what the <:egghead:1435894590623453237>')
    },
};