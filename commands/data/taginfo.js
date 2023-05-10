const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('taginfo')
		.setDescription('outputs information on selected tag on the test database')
		.addUserOption(option => option.setName('tagname').setDescription('tagname to fetch').setRequired(true)),
	async execute(interaction) {
        try {
			const tag = await Tags.findOne({ where: { name: tagName } });

            if (tag) {
                return interaction.reply(`${tagName} was created by ${tag.username} at ${tag.createdAt} and has been used ${tag.usage_count} times.`);
            }

            return interaction.reply(`Could not find tag: ${tagName}`);
                }
		catch (error) {
            
		}
	},
};