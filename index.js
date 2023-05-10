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
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

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
    let msg = message.content.toLowerCase();
    let date_timeStamp2 = getTimestamp();

    switch (message.channel.id) {
        case "776388929452245012":
            admission(message, user);
            break;

        default:
    }

    switch (msg) {
        case `${prefix}ping`:
            react(message);
            break;

        case `${prefix}react`:
            react(message);
            break;

		case `${prefix}guildID`:
			console.log(guild.id);
			break;

        case `${prefix}commandes`:
            showCommands(message);
            break;

        case `${prefix}DMtest`:
            dmTest(message);

        default:
            break;
    }

    
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




/* -------------------------------------------------------------------------- */
/*                                  functions                                 */
/* -------------------------------------------------------------------------- */

async function ping(message) {
    console.log(`${date_timeStamp2} : pinged by ${message.author.tag}`);
    message.reply("pong");
}

async function sleep(ms) {
    try {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
    catch{

    }
}

async function revive() {
    try {
        let pass = 1;
        let result = '';
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let charactersLength = 5;
        for (let i = 0; i < 5; i++) {
            result += characters.charAt(Math.floor(Math.random() * 5));
        }
        pass = result;
        console.log(`password is : ${pass}`);
        sleep(24000);
        return new Promise((resolve) => {
            setTimeout(resolve, 24000);
        });
    }
    catch{

    }
}

async function react(message) {
    try {
        await message.react('🇦');
        await message.react('🇧');
        await message.react('🇨');
    } catch (error) {
        // handle failure of any Promise rejection inside here
    }
}

async function fetchMessages(message) {
    try {
        const fetchUser = message.mentions.members.first();
        if (fetchUser) {
            console.log("user fetched");
            const fetchMember = message.guild.members.resolve(fetchUser);
            if (fetchMember) {
                console.log("member fetched");
                console.log(fetchMember);
                console.log(fetchMember.id);
                channel.messages.fetch(limit = 800)
                    .then(messages => console.log(`${messages.filter(message => message.author.id === fetchMember.id).size} messages`))
                    .catch(console.error);
            }
        }
    }
    catch (error) {
        // handle failure of any Promise rejection inside here
    }
}

async function admission(message, user) {
    let msg = message.content.toLowerCase();
    console.log(message);
    try {
        if (msg === "lu et approuvé") {
            try {
                const member = message.author.fetch(user);
                console.log(member);
                //const role = message.guild.roles.cache.find(role => role.name === 'bottest');
                let role = message.guild.roles.cache.find(r => r.id === '879110508932894780');
                console.log(role);
                console.log(role.id);
                console.log(`Hi, ${user}.`);
                const guildMember = message.mentions.members.first();
                message.member.roles.add(role);
                message.channel.lastMessage.delete();
            } catch{
                //error handling
            }
        }
        else {
            message.channel.lastMessage.delete();
        }
    } catch{
        //error handling
    }
}

async function say(message) {
    if (message.author.id === "373205084072574977") {
        let sentence = message.content.split(" ");
        sentence.shift();
        sentence = sentence.join(" ");
        message.channel.lastMessage.delete();
        message.channel.send(sentence);
    } else {
        message.channel.lastMessage.delete();
    }
}


async function kick(message) {
    /* This takes the sentence sent, and makes it an array. In this case, a list of words. It 'splits' the list up wherever it sees space.*/
    let sentence = message.content.split(" ");

    /* .shift(), alters the list. It removes the first thing in the list. This would be the "!say" word. If we assigned shift() to a variable. Like "let x = message.shift()" ... "x" would be the word that was removed. This is handy for grabbing command words. If you used shift() again, it would remove the second, then the third, each time that you type it.*/
    sentence.shift();
    sentence.shift();

    // Now join the list back together into a sentence with "join()" and set that as the new sentence.
    sentence = sentence.join(" ");

    // Assuming we mention someone in the message, this will return the user
    const user = message.mentions.users.first();

    //if an user is mentionned
    if (user) {

        //get member from user
        const member = message.guild.members.resolve(user);

        //if the memberr is in the guild
        if (member) {
            member
                .kick(`${sentence}`)
                .then(() => {
                    // We let the message author know we were able to kick the person
                    message.channel.send(`j'ai bien renvoyé ${user.tag} pour ${sentence}`);
                    message.channel.send("https://media1.tenor.com/images/1e46ced92e2521749ca6f72602765c1a/tenor.gif?itemid=18219363");
                })
                .catch(err => {
                    // An error happened
                    // This is generally due to the bot not being able to kick the member,
                    // either due to missing permissions or role hierarchy
                    message.reply('je ne peut pas le renvoyer');
                    // Log the error
                    console.error(err);
                });
        } else {
            // The mentioned user isn't in this guild
            message.reply("il n'es pas sur ce serveur");
        }
        // Otherwise, if no user was mentioned
    } else {
        message.reply("qui ?");
    }
}

async function ban(message) {
    /* This takes the sentence sent, and makes it an array. In this case, a list of words. It 'splits' the list up wherever it sees space.*/
    let sentence = message.content.split(" ");

    /* .shift(), alters the list. It removes the first thing in the list. This would be the "!say" word. If we assigned shift() to a variable. Like "let x = message.shift()" ... "x" would be the word that was removed. This is handy for grabbing command words. If you used shift() again, it would remove the second, then the third, each time that you type it.*/
    sentence.shift();
    sentence.shift();

    // Now join the list back together into a sentence with "join()" and set that as the new sentence.
    sentence = sentence.join(" ");

    // Assuming we mention someone in the message, this will return the user
    let user = message.mentions.users.first();

    //if an user is mentionned
    if (user) {

        //get member from user
        let member = message.guild.members.resolve(user);

        //if the memberr is in the guild
        if (member) {
            member
                .ban({
                    reason: `${sentence}`
                })
                .then(() => {
                    // We let the message author know we were able to ban the person
                    message.channel.send(`j'ai bien renvoyé ${user.tag} pour ${sentence}`);
                    message.channel.send("https://media1.tenor.com/images/1e46ced92e2521749ca6f72602765c1a/tenor.gif?itemid=18219363");
                })
                .catch(err => {
                    // An error happened
                    // This is generally due to the bot not being able to ban the member,
                    // either due to missing permissions or role hierarchy
                    message.reply('je ne peut pas le renvoyer');
                    // Log the error
                    console.error(err);
                });
        } else {
            // The mentioned user isn't in this guild
            message.reply("il n'es pas sur ce serveur");
        }
        // Otherwise, if no user was mentioned
    } else {
        message.reply("qui ?");
    }
}

async function showCommands(message) {
    message.channel.send({
        "embed": {
            "title": "Fangie",
            "description": "je suis ici pour l'administration du serveur\n\nje peut comprendre toutes les commandes, qu'elles commencent par une majuscule ou non ^-^",
            "color": 8742353,
            "footer": {
                "icon_url": "https://cdn.discordapp.com/app-icons/756204208587276299/a049e7c53a4401180224c5d57861545f.png",
                "text": ".fangieCommands"
            },
            "thumbnail": {
                "url": "https://cdn.discordapp.com/app-icons/756204208587276299/a049e7c53a4401180224c5d57861545f.png"
            },
            "fields": [
                {
                    "name": "jouer un morceau :",
                    "value": "je peut rejouer n'importe quel musique youtube, demandez le simplement ^-^ ```?play [lien de la video]```"
                },
                {
                    "name": "appel :",
                    "value": "pour que je vous aide, il faut m'appeler avant : ```fangie \nfangie ?```\ntoutes les commandes suivantes ne pourront être écoutées que si je vous écoute."
                },
                {
                    "name": "annuler :",
                    "value": "si tu n'as rien a demander ```nan rien```"
                },
                {
                    "name": "réciter une règle :",
                    "value": "pour que je récite une règle, n'importe laquelle, tant que tu me donne le numéro de celle que tu veux ^^```règle ... stp```"
                },
                {
                    "name": "un oubli ?",
                    "value": "tu peux toujours me demander ce que je peut faire ```commandes \ncommandes?```"
                }
            ]
        }
    });
}


client.login(token);