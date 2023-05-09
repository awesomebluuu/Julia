const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('addtag')
		.setDescription('add a tag on the test database')
		.addUserOption(option => option.setName('tagname').setDescription('value of tagname').setRequired(true))
        .addUserOption(option => option.setName('tagdescription').setDescription('value of tagdescription').setRequired(true)),
	async execute(interaction) {
        try {
			// equivalent to: INSERT INTO tags (name, description, username) values (?, ?, ?);
			const tag = await Tags.create({
				name: tagName,
				description: tagDescription,
				username: interaction.user.username,
			});

			return interaction.reply(`Tag ${tag.name} added.`);
		}
		catch (error) {
			if (error.name === 'SequelizeUniqueConstraintError') {
				return interaction.reply('That tag already exists.');
			}

			return interaction.reply('Something went wrong with adding a tag.');
		}
	},
};