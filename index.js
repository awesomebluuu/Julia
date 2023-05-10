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
const { Op } = require('sequelize');
const { Users, CurrencyShop } = require('./dbObjects.js');

/* ------------------------------- filesystem ------------------------------- */
const fs = require('node:fs');

/* ---------------------- nessessary discord.js classes --------------------- */
const { Client, codeBlock, Collection, Events, GatewayIntentBits, Message, messageLink } = require('discord.js');

/* ------------------------------- bot's token ------------------------------ */
const { token } = require('./config.json');

const path = require('node:path');
const express = require("express");
const { timeStamp } = require('node:console');
const app = express()

/* ------------------------- creation of the client ------------------------- */
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

const currency = new Collection();

/* -------------------------------------------------------------------------- */
/*                           data manipulation part                           */
/* -------------------------------------------------------------------------- */

async function addBalance(id, amount) {
	const user = currency.get(id);

	if (user) {
		user.balance += Number(amount);
		return user.save();
	}

	const newUser = await Users.create({ user_id: id, balance: amount });
	currency.set(id, newUser);

	return newUser;
}

function getBalance(id) {
	const user = currency.get(id);
	return user ? user.balance : 0;
}


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


client.once(Events.ClientReady, async () => {
    try{
        const storedBalances = await Users.findAll();
	    storedBalances.forEach(b => currency.set(b.user_id, b));

        console.log('Ready!');
        console.log(`logged in as ${client.user.tag}`);
        console.log(`current client ID : ${client.user.id}`);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
}
});

client.on(Events.MessageCreate, async message => {
	if (message.author.bot) return;
    if (!message.guild) return;
	
    addBalance(message.author.id, 1);
    message.reply(`${message.author.tag} has ${getBalance(message.author.id)}💰`);


    let msg = message.content.toLowerCase();

    let date_timeStamp2 = getTimestamp();
    console.log(`${date_timeStamp2} : ${msg}`);
    if (msg === "ping") {
        console.log("pinged by" + message.author.user);
        Message.reply("pong");
    }
    /**
    if (msg === "!timeStamp") {
    *   let date_timeStamp2 = getTimestamp();
    *   console.log(date_timeStamp2);
    }
    */
    if (msg === 'balance') {
		message.reply(`${message.author.tag} has ${getBalance(message.author.id)}💰`);
    }
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

    if (commandName === 'inventory') {
		const target = interaction.options.getUser('user') || interaction.user;
		const user = await Users.findOne({ where: { user_id: target.id } });
		const items = await user.getItems();

		if (!items.length) return interaction.reply(`${target.tag} has nothing!`);

		return interaction.reply(`${target.tag} currently has ${items.map(t => `${t.amount} ${t.item.name}`).join(', ')}`);
	} else if (commandName === 'transfer') {
		const currentAmount = getBalance(interaction.user.id);
		const transferAmount = interaction.options.getInteger('amount');
		const transferTarget = interaction.options.getUser('user');

		if (transferAmount > currentAmount) return interaction.reply(`Sorry ${interaction.user} you don't have that much.`);
		if (transferAmount <= 0) return interaction.reply(`Please enter an amount greater than zero, ${interaction.user}`);

		addBalance(interaction.user.id, -transferAmount);
		addBalance(transferTarget.id, transferAmount);

		return interaction.reply(`Successfully transferred ${transferAmount}💰 to ${transferTarget.tag}. Your current balance is ${getBalance(interaction.user.id)}💰`);
	} else if (commandName === 'buy') {
		const itemName = interaction.options.getString('item');
		const item = await CurrencyShop.findOne({ where: { name: { [Op.like]: itemName } } });

		if (!item) return interaction.reply('That item doesn\'t exist.');
		if (item.cost > getBalance(interaction.user.id)) {
			return interaction.reply(`You don't have enough currency, ${interaction.user}`);
		}

		const user = await Users.findOne({ where: { user_id: interaction.user.id } });
		addBalance(interaction.user.id, -item.cost);
		await user.addItem(item);

		return interaction.reply(`You've bought a ${item.name}`);
	} else if (commandName === 'shop') {
		const items = await CurrencyShop.findAll();
		return interaction.reply(Formatters.codeBlock(items.map(i => `${i.name}: ${i.cost}💰`).join('\n')));
	} else if (commandName === 'leaderboard') {
		return interaction.reply(
			Formatters.codeBlock(
				currency.sort((a, b) => b.balance - a.balance)
					.filter(user => client.users.cache.has(user.user_id))
					.first(10)
					.map((user, position) => `(${position + 1}) ${(client.users.cache.get(user.user_id).tag)}: ${user.balance}💰`)
					.join('\n'),
			),
		);
	}
});

client.login(token);