const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('showtags')
		.setDescription('list every tags on the test database'),
	async execute(interaction) {
        try {
			// equivalent to: SELECT name FROM tags;
            const tagList = await Tags.findAll({ attributes: ['name'] });
            const tagString = tagList.map(t => t.name).join(', ') || 'No tags set.';

            return interaction.reply(`List of tags: ${tagString}`);
        }

		catch (error) {
            
		}
	},
};