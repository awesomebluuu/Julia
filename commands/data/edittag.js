const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('edittag')
		.setDescription('edit a tag on the test database')
        .addUserOption(option => option.setName('tagname').setDescription('value of tagname').setRequired(false))
        .addUserOption(option => option.setName('tagdescription').setDescription('value of tagdescription').setRequired(false)),
	async execute(interaction) {
        try {
			// equivalent to: UPDATE tags (description) values (?) WHERE name='?';
            const affectedRows = await Tags.update({ description: tagDescription }, { where: { name: tagName } });

            if (affectedRows > 0) {
                return interaction.reply(`Tag ${tagName} was edited.`);
            }

            return interaction.reply(`Could not find a tag with name ${tagName}.`);
		}
		catch (error) {
            
		}
	},
};