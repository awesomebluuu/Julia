const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('tag')
		.setDescription('fetch a tag on the test database')
		.addUserOption(option => option.setName('tagname').setDescription('tagname to fetch').setRequired(true)),
	async execute(interaction) {
        try {
			const tag = await Tags.findOne({ where: { name: tagName } });
			
            if (tag) {
                // equivalent to: UPDATE tags SET usage_count = usage_count + 1 WHERE name = 'tagName';
                tag.increment('usage_count');
        
                return interaction.reply(tag.get('description'));
            }
            return interaction.reply(`Could not find tag: ${tagName}`);
		}
		catch (error) {
            
		}
	},
};