/** 
 * @author awesomebluu
 * 
 * @brief spaceship's moderator.
 * 
 */


/* -------------------------------------------------------------------------- */
/*                            initial packages init                           */
/* -------------------------------------------------------------------------- */

/* ------------------------------ database ORM ------------------------------ */
const Sequelize = require('sequelize');

/* ------------------------------- filesystem ------------------------------- */
const fs = require('node:fs');

/* ---------------------- nessessary discord.js classes --------------------- */
const { Client, Collection, Events, GatewayIntentBits, Message, messageLink } = require('discord.js');
/* ------------------------------- bot's token ------------------------------ */
const { token } = require('./config.json');

const path = require('node:path');
const express = require("express");
const { timeStamp } = require('node:console');
const app = express()

/* ------------------------- creation of the client ------------------------- */
const client = new Client({ intents: [GatewayIntentBits.Guilds] });



/* -------------------------------------------------------------------------- */
/*                           data manipulation part                           */
/* -------------------------------------------------------------------------- */

/**
 * @brief connection information definition
 * 
 * @param {String} host - tells Sequelize where to look for the database. For most systems, the host will be localhost, as the database usually resides with the application. If you have a remote database, however, then you can set it to that connection address. Otherwise, don't touch this unless you know what you're doing.
 * @param {String} dialect - database engine used.
 * @param {Boolean} logging - enables verbose output from Sequelize–useful for when you are trying to debug. You can disable it by setting it to false.
 * @param {String} storage - sqlite-only setting
 */
const sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    // SQLite only
    storage: 'database.sqlite',
});


/**
 * @param {var} type - refers to what kind of data this attribute should hold. The most common types are number, string, and date, but other data types are available depending on the database.
 * @param {Boolean} unique - ensure that this field will never have duplicated entries.
 * @param {var} defaultValue - allows you to set a fallback value if there's no initial value during the insert.
 * @param {boolean} allowNull - will guarantee in the database that the attribute is never unset. You could potentially set it to be a blank or empty string, but it has to be something.
 * 
 */
const Tags = sequelize.define('tags', { //CREATE TABLE tag
	name: {                             //name VARCHAR(255) UNIQUE,
		type: Sequelize.STRING,
		unique: true,
	},
	description: Sequelize.TEXT,        //description TEXT,
	username: Sequelize.STRING,         //username VARCHAR(255),
	usage_count: {                      //usage_count  INT NOT NULL DEFAULT 0
		type: Sequelize.INTEGER,
		defaultValue: 0,
		allowNull: false,
	},
});





function getTimestamp() {
    let date_time = new Date();

    // get current date
    // adjust 0 before single digit date
    let date = ("0" + date_time.getDate()).slice(-2);

    // get current month
    let month = ("0" + (date_time.getMonth() + 1)).slice(-2);

    // get current year
    let year = date_time.getFullYear();

    // get current hours
    let hours = date_time.getHours();

    // get current minutes
    let minutes = date_time.getMinutes();

    // get current seconds
    let seconds = date_time.getSeconds();

    // make timestamp
    let date_timeStamp = (year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds);
    return date_timeStamp;
}


client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
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
}


client.once(Events.ClientReady, () => {
    Tags.sync();
    console.log('Ready!');
    console.log(`logged in as ${client.user.tag}`);
    console.log(`current client ID : ${client.user.id}`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

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

client.on('message', async (message, user) => {
    if (message.author.bot) return;
    if (!message.guild) return;
    let msg = message.content.toLowerCase();

    console.log("message");
    if (Message.content == "ping") {
        console.log("pinged by" + Message.author);
        Message.reply("pong");
    }
    if (Message.content == "!timeStamp") {
        let date_timeStamp2 = getTimestamp();
        console.log(date_timeStamp2);
    }
})

client.login(token);