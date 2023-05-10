const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('deletetag')
		.setDescription('delete a tag on the test database')
		.addUserOption(option => option.setName('tagname').setDescription('tagname to fetch').setRequired(true)),
	async execute(interaction) {
        try {
			const tagName = interaction.options.getString('name');
            // equivalent to: DELETE from tags WHERE name = ?;
            const rowCount = await Tags.destroy({ where: { name: tagName } });

            if (!rowCount) return interaction.reply('That tag doesn\'t exist.');

            return interaction.reply('Tag deleted.');
		}
		catch (error) {
            
		}
	},
};