const dotenv = require("dotenv");

const Discord = require("discord.js");
const { Client } = require(`discord.js`);
var userdata = require("./userdata.json");
const fs = require("fs");
const moment = require("moment");

const scripting = require(__dirname + "/scripting.js");

function sleep(ms) {
	return new Promise(r => setTimeout(r, ms));
}

const client = new Client({
	partials: ["MESSAGE", "CHANNEL", "REACTION"],
	disableMentions: "all",
});

dotenv.config({
	path: __dirname + "/.env",
});

function sleep(ms) {
	return new Promise(r => setTimeout(r, ms));
}

let evalObj = {};
const mathChannels = [
	"536995777981972491",
	"704944645712642098",
	"641351235215294486",
	"641351291343208448",
	"754860723321962628",
];

let mathChannelOrderCache = [];

let mathChannelHeat = {};

for (const cid of mathChannels) {
	mathChannelHeat[cid] = 0;
}

let sorting = false;
const pingRoleOption = roles => {
	return {
		disableMentions: "everyone",
		allowedMentions: { roles: roles },
	};
};
const pingEveryoneRoleOption = {
	disableMentions: "none",
};
function arraysEqual(a, b) {
	if (a === b) return true;
	if (a == null || b == null) return false;
	if (a.length !== b.length) return false;

	// If you don't care about the order of the elements inside
	// the array, you should sort both arrays here.
	// Please note that calling sort on an array will modify that array.
	// you might want to clone your array first.

	for (var i = 0; i < a.length; ++i) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}

client.on("message", async message => {
	if (
		message.channel
			.permissionsFor(message.guild.roles.everyone)
			.has(["VIEW_CHANNEL", "SEND_MESSAGES"]) &&
		message.content.match(/credit card clue/i) &&
		message.content.match(/phone number clue/i)
	) {
		message.delete();
		message.member.roles
			.add("733953754537132072")
			.then(() => {
				message.channel.send(
					`${message.author} muted for potential doxing`,
					pingEveryoneRoleOption
				);
			})
			.catch(() =>
				message.channel.send(
					`<&534923363748151301><&536996925581295627>`,
					pingEveryoneRoleOption
				)
			);
	}
	if (mathChannels.indexOf(message.channel.id) !== -1) {
		mathChannelHeat[message.channel.id] += 1;
		for (const cid of mathChannels) {
			mathChannelHeat[cid] *= 0.9;
		}
		if (sorting) return;
		sorting = true;
		try {
			// make changes to the math channel
			// reorder the math channels
			let sortedChannels = mathChannels.sort(
				(a, b) => mathChannelHeat[a] - mathChannelHeat[b]
			);
			if (arraysEqual(mathChannelOrderCache, sortedChannels)) {
				// do nothing
			} else {
				// order is different
				let order = 0;
				for (const cid of sortedChannels) {
					await (await client.channels.fetch(cid)).setPosition(order++);
				}
				mathChannelOrderCache = [...sortedChannels];
			}
		} catch (e) {
			console.log(e);
		} finally {
			sorting = false;
		}
		return;
	}
});

let submissionLog;
let mainGuild;
let serverChangeLog = "700677895634419803";
let potdAnnounceChannel = "762716928702939156";
let potdManagersChannel = "775752080291004437";
let potdPendingChannel = "776471057614766130";
let potdAnswersChannel = "778290442390863892";
let potdLogChannel = "772406579177848843";

client.on("ready", async () => {
	console.log(`online: bot name ${client.user.username}`);
	client.user.setPresence({
		status: "online",
		afk: false,
	});
	for (const [guildid, guild] of client.guilds.cache) {
		console.log(`Searching in guild ${guild.name} ${guildid}`);
		// if (guildid === "493173110799859713") {
		// 	mainGuild = guild;
		// 	console.log("set main guild");
		// }
	}
	submissionLog = client.channels.fetch("772406579177848843");
	potdAnswersChannel = client.channels
		.fetch(potdAnswersChannel)
		.then(c => (potdAnswersChannel = c));
	potdAnnounceChannel = client.channels
		.fetch(potdAnnounceChannel)
		.then(c => (potdAnnounceChannel = c));
	potdManagersChannel = client.channels
		.fetch(potdManagersChannel)
		.then(c => (potdManagersChannel = c));
	potdLogChannel = client.channels
		.fetch(potdLogChannel)
		.then(c => (potdLogChannel = c));

	potdPendingChannel = client.channels
		.fetch(potdPendingChannel)
		.then(c => (potdPendingChannel = c));

	serverChangeLog = await client.channels.fetch(serverChangeLog);
	mainGuild = await client.guilds.fetch("493173110799859713");
	console.log("mainguild's id is " + mainGuild.id);
	await mainGuild.members.fetch();
	// console.log(mainGuild.member("341446613056880641"));
});

const adv = "767915316164427836";
const val = "666802449646092319";

class JSONFileHandler {
	constructor(filePath) {
		this.filePath = filePath;
		try {
			this.obj = require(filePath);
		} catch (error) {
			console.log("error reading the json file", error);
			this.error = true;
		}
	}
	save() {
		fs.writeFileSync(this.filePath, JSON.stringify(this.obj, null, " "), {
			encoding: "utf8",
		});
	}
}
// i never used this thing
class AnswerLogManager {
	constructor(client, channelId) {
		this.channelId = channelId;
		this.client = client; // this class module will work by its own (hopefully)
		// answerLogMessage
	}
	async add(id, obj) {
		if (!obj) throw new Error("Object cannot be null or undefined");
		if (!obj.answer) throw new Error("Answer cannot be blank or a falsy value");
		userdata[id] = obj;
		(await this.client.channels.fetch(this.clientId)).send();
		save();
	}
	async delete(id) {
		if (!userdata[id]) return false;
		delete userdata[id];
		save();
	}
	async clear() {
		userdata = {};
		fs.writeFileSync(
			__dirname + "/userdata.json",
			JSON.stringify(userdata, null, "\t"),
			"utf8"
		);
		// purge the fking channel
	}
	save() {
		// dont rerender
		fs.writeFileSync(
			__dirname + "/userdata.json",
			JSON.stringify(userdata, null, "\t"),
			"utf8"
		);
	}
}
const POTDDIFFICULTY = {
	m: {
		name: "Math",
		description: [
			"No Math, Logic",
			"Systems of inequations, inequalities, polynomials, number system, basic geometry.",
			"Functions, graphs, sequences, probability, trigonometry, advanced geometry.",
			"Advanced trig, rigorous algebra, advanced functions.",
			"Limits and derivatives.",
			'"Real" calculus.',
			"Hell",
		],
	},
	ch: {
		name: "Chemistry",
		description: [
			"Stoichiometry.",
			"Basic Kinetics, ideal gasses, basic mechanisms.",
			"Intro Undergrad Organic / Inorganic / Physical (The specific subject will be clarified).",
			"Final Year bachelors / Masters and above.",
		],
	},
	p: {
		name: "Physics",
		description: [
			"Conservation of Energy, Efficiency etc.",
			"Classical Mechanics (suvat etc.). Intro astrophysics.",
			"Optics, Electromagnetism. Atomic theory. More astrophysics. Special relativity.",
			"Hell",
		],
	},
	cs: {
		name: "Computer Science",
		description: [
			"Binary, Hex etc.",
			"Basic algorithms might be needed.",
			"Anything above that. More advanced algorithms, BigO, logic gates, forming datastructures, information theory etc. (The specific subject will be clarified.",
		],
	},
};

let settings = new JSONFileHandler(__dirname + "/settings.json");
let pendingQuestions = new JSONFileHandler(__dirname + "/potd/pending.json");
let resolvedQuestions = new JSONFileHandler(__dirname + "/potd/resolved.json");
let winnersFile = new JSONFileHandler(__dirname + "/winners.json");

let config = new JSONFileHandler(__dirname + "/config.json");

const voteYesEmoji = "✅";
const voteNoEmoji = "❎";
const sendPOTDEmoji = "📫";
const deletePOTDEmoji = "🗑️";

const urlRegex = /(https?:\/\/)?([\w\-])+\.{1}([a-zA-Z]{2,63})([\/\w-]*)*\/?\??([^#\n\r]*)?#?([^\n\r]*)/;

const potdManagerRole = "775752282331414538";
const potdAdminRole = "780107740047605770";
const problemOfTheDayRole = "762718445971177492";

//:envelope_with_arrow: :white_check_mark: :negative_squared_cross_mark:
client.on(`messageReactionAdd`, async (reaction, user) => {
	if (user.id === client.user.id) return;
	handlePOTDPendingReactions(true, reaction, user);
});
client.on(`messageReactionRemove`, async (reaction, user) => {
	if (user.id === client.user.id) return;
	handlePOTDPendingReactions(false, reaction, user);
});
function userdataSave() {
	fs.writeFileSync(
		__dirname + "/userdata.json",
		JSON.stringify(userdata, null, "\t"),
		"utf8"
	);
}

async function handlePOTDPendingReactions(add, reaction, user) {
	// this is a bad thing to do but i dont care rn
	if (user.partial) {
		await user.fetch();
	}
	if (reaction.partial) {
		await reaction.fetch();
	}
	// check what message type it is
	if (pendingQuestions.obj[reaction.message.id]) {
		let ogChannel = reaction.message.channel;
		// parse as guild memeber
		let gm = mainGuild.member(user);
		// it exists
		let questionObj = pendingQuestions.obj[reaction.message.id];
		console.log(questionObj);
		let respond;
		if (reaction.emoji.name === voteYesEmoji) {
			if (add) {
				// find all vote no emojis
				[...reaction.message.reactions.cache.values()]
					.find(r => r.emoji.name === voteNoEmoji)
					.users.remove(user);
				arrRemove(questionObj.votes_no, user.id);
				arrAdd(questionObj.votes_yes, user.id);
			} else {
				arrRemove(questionObj.votes_yes, user.id);
			}
			pendingQuestions.obj[reaction.message.id] = questionObj;
			pendingQuestions.save();
			updateQuestion(reaction.message.id);
		} else if (reaction.emoji.name === voteNoEmoji) {
			if (add) {
				// find all vote yes emojis

				[...reaction.message.reactions.cache.values()]
					.find(r => r.emoji.name === voteYesEmoji)
					.users.remove(user);
				arrRemove(questionObj.votes_yes, user.id);
				arrAdd(questionObj.votes_no, user.id);
			} else {
				arrRemove(questionObj.votes_no, user.id);
			}
			pendingQuestions.obj[reaction.message.id] = questionObj;
			pendingQuestions.save();
			updateQuestion(reaction.message.id);
		} else if (reaction.emoji.name === sendPOTDEmoji && add) {
			console.log("attempting to send...");
			if (gm.roles.cache.has(potdAdminRole)) {
				let winners;
				await (async () => {
					if (questionObj.answerType === "subjective") {
						// do nothing
					} else if (questionObj.answerType === "regex") {
						if (!questionObj.answerRegex) {
							respond =
								"Answer type is regex but answer regex is not set. aborting...";
							return;
						}
					} else if (questionObj.answerType === "single") {
						if (!questionObj.answer) {
							respond =
								"Answer type is single but answer is not set. aborting...";
							return;
						}
					} else {
						// unknown type
						respond = "unknown answer type. aborting...";
						return;
					}
					if (!settings.obj.answerExplanation) {
						respond =
							"answer explanation is not set! set explanation <explanation>";
						return;
					}

					// first, autograde the existing question
					try {
						console.log("trying to autograde...");
						winners = await autoGrade();
						console.log(`${winners.length}`);
						// console.log(winners[0]);
						console.log("done autograding");
					} catch (e) {
						respond = "Something wrong happened.\n" + e.message;
						return;
					}
					// passed all tests.
					// now send the thing
				})();
				if (!respond) {
					// send the answer announcement
					// increase by 1
					try {
						for (const winner of winners) {
							winnersFile.obj[winner.id] = winnersFile.obj[winner.id] + 1 || 1;
						}
						winnersFile.save();
					} catch (e) {
						console.error(e);
					}
					let answerAnnouncement = `The answer to the above potd is: ${
						settings.obj.answer ?? "not defined to one answer :)"
					}\nExplanation (click the spoiler if you want to know): \n> ||${settings.obj.answerExplanation.replace(
						/\n/g,
						"\n> "
					)}||\n`;
					await potdAnnounceChannel
						.send(
							answerAnnouncement.replace(/@(?:everyone|here)/g, ""),
							pingEveryoneRoleOption
						)
						.then(v => v.crosspost());
					// winner announcement
					let winnerAnnouncement = `${
						winners.length
							? "🎉🎉🎉Congratulations to the winners🎉🎉🎉"
							: "There were no winners"
					}\n${winners.map(gm => gm.user.toString()).join("")}`;
					await potdAnnounceChannel.send(
						winnerAnnouncement.replace(/@(?:everyone|here)/g, ""),
						pingEveryoneRoleOption
					);
					potdAnnounceChannel
						.send(
							`<@&${problemOfTheDayRole}>\n${
								questionObj.author
									? "This question is from: " + questionObj.author
									: "This is a question from an anonymous user"
							}\n${
								questionObj.difficulty
									? "__**Category**__\n" +
									  difficultyToString(
											questionObj.difficulty,
											questionObj.subject
									  ) +
									  "\n"
									: "\n"
							}${
								questionObj.difficultyDescription
									? "*" + questionObj.difficultyDescription + "*\n"
									: ""
							}Problem: ${questionObj.question}${
								questionObj.image ? "\nImage: " + questionObj.image : ""
							}\n\ndm ${client.user} with \`submit\`\nGood Luck!`,
							pingEveryoneRoleOption
						)
						.then(v => v.crosspost())
						.then(() => {
							userdata = {};
							userdataSave();
							settings.obj.answerType = questionObj.answerType;
							settings.obj.answer = questionObj.answer;
							settings.obj.answerRegex = questionObj.answerRegex;
							settings.obj.answerInputRegex = questionObj.answerInputRegex;
							settings.obj.answerExplanation = questionObj.explanation;
							settings.save();
							resolvedQuestions.obj[reaction.message.id] = questionObj;
							resolvedQuestions.save();
							delete pendingQuestions.obj[reaction.message.id];
							pendingQuestions.save();
							respond = "Successfully sent the potd";
							// clear viewers
							mainGuild.members.cache
								.filter(member =>
									member.roles.cache.find(
										role => role.id === "776482429913006110"
									)
								)
								.forEach(member =>
									member.roles.remove("776482429913006110").catch(() => {
										console.log("no permission to clear " + member.displayName);
										if (member.displayName === undefined) {
											console.log(member);
										}
									})
								);
						})
						.catch(e => {
							respond =
								"something went wrong while trying to send the Problem!";
							console.log(e);
						});
					const r = config.obj.nextReactions;
					potdAnnounceChannel.send(config.obj.nextMessage).then(async msg => {
						for (const react of r) {
							await msg.react(react);
						}
					});
				} else {
					[...reaction.message.reactions.cache.values()]
						.find(r => r.emoji.name === sendPOTDEmoji)
						.users.remove(user);
				}
			} else {
				[...reaction.message.reactions.cache.values()]
					.find(r => r.emoji.name === sendPOTDEmoji)
					.users.remove(user);
				respond = "Only potd admins can do this!";
			}
		} else if (reaction.emoji.name === deletePOTDEmoji && add) {
			if (gm.roles.cache.has(potdAdminRole)) {
				delete pendingQuestions.obj[reaction.message.id];
				(await reaction.message.fetch()).delete();
				respond = "deleted question";
				pendingQuestions.save();
			} else {
				[...reaction.message.reactions.cache.values()]
					.find(r => r.emoji.name === deletePOTDEmoji)
					.users.remove(user);
				respond = "Only potd admins can do this!";
			}
		}
		if (respond) {
			respond = await ogChannel.send(respond);
			await sleep(5000);
			respond.delete();
		}
	}
}

async function updateQuestion(id) {
	let message = await potdAnswersChannel.messages.fetch(id);
	if (!message) {
		return null;
	}
	// edit it
	message.edit(await embedFromQuestionObj(pendingQuestions.obj[id], id));
}

function arrRemove(arr, item) {
	let idx = arr.indexOf(item);
	if (idx === -1) {
		return;
	}
	arr.splice(idx, 1);
}
function arrAdd(arr, item) {
	if (arr.indexOf(item) === -1) {
		arr.push(item);
	}
}

async function autoGrade() {
	let match;
	let members = (
		await mainGuild.members
			.fetch({ user: Object.keys(userdata) })
			.catch(console.log)
	).array();
	// automatic grading
	if (settings.obj.answerType === "subjective") {
		// do vote based grading
		match = "votes";
	} else if (settings.obj.answerType === "regex") {
		// do regex based grading
		if (!settings.obj.answerRegex) {
			throw new Exception(
				"Answer is undefined! i dont know how this happened. please nope"
			);
		}
		let re = settings.obj.answerRegex;
		members = members.filter(
			member =>
				userdata[member.id] &&
				userdata[member.id].answer.match(settings.obj.answerRegex)
		);
	} else if (settings.obj.answerType === "single") {
		match = `<${settings.obj.answer}>`;
	}
	if (match === "votes") {
		members = members.filter(member => {
			return (
				(userdata[member.id].vote_no.length === 0 ||
					userdata[member.id].vote_yes.length /
						userdata[member.id].vote_no.length >=
						2) &&
				userdata[member.id].vote_yes.length
			);
		});
	} else if (match) {
		members = members.filter(member => {
			return userdata[member.id].answer.includes(match);
		});
	}
	await Promise.all(
		mainGuild.members.cache
			.filter(member =>
				member.roles.cache.find(role => role.id === "772414951012433930")
			)
			.map(
				async member =>
					await member.roles
						.remove("772414951012433930")
						.catch(() =>
							console.log("no permission to clear " + member.username)
						)
			)
	);
	console.log("removed roles");
	await sleep(5000);
	members.forEach(member => {
		if (!member.roles.cache.has("772414951012433930"))
			member.roles
				.add("772414951012433930")
				.then(() => console.log("success adding to " + member.displayName))
				.catch(console.log);
	});
	return members;
}
function difficultyToStars(d) {
	return "★".repeat(d) + "☆".repeat(10 - d);
}

function difficultyToString(d, subject) {
	return POTDDIFFICULTY[subject]
		? POTDDIFFICULTY[subject].description[d]
			? `${POTDDIFFICULTY[subject].name}: ${POTDDIFFICULTY[subject].description[d]}`
			: undefined
		: undefined;
}
function validURL(str) {
	var pattern = new RegExp(
		"^(https?:\\/\\/)?" + // protocol
			"((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
			"((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
			"(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
			"(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
			"(\\#[-a-z\\d_]*)?$",
		"i"
	); // fragment locator
	return !!pattern.test(str);
}
async function embedFromQuestionObj(obj, id) {
	let embed = new Discord.MessageEmbed()
		.setTitle("Problem")
		.addField("Question", obj.question)
		.addField("Author", obj.author ?? "Undefined")
		.setTimestamp()
		.setFooter(id);
	if (obj.image && validURL(obj.image)) {
		embed.setImage(obj.image);
	}
	if (obj.answerType) {
		embed.addField("Answer type", obj.answerType);
	}
	if (obj.answerType === "regex" && obj.answerRegex) {
		embed.addField("Answer regex", obj.answerRegex);
	}
	if (obj.answerType === "single" && obj.answer) {
		embed.addField("Answer", obj.answer);
	}
	if (obj.difficulty) {
		const d = obj.difficulty;
		embed.addField("Difficulty Integer", d);
		const s = obj.subject;
		embed.addField("Subject", POTDDIFFICULTY[s].name);
		embed.addField(
			"Difficulty Description",
			POTDDIFFICULTY[s].description[d],
			true
		);
	}
	if (obj.difficultyDescription) {
		embed.addField("Difficulty Description", obj.difficultyDescription);
	}
	if (obj.answerInputRegex) {
		embed.addField("Required Input Regex", obj.answerInputRegex);
	}
	if (obj.answerRegex) {
		embed.addField("Correct Answer Regex", obj.answerRegex);
	}

	if (obj.explanation) {
		embed.addField("Explanation", obj.explanation);
	}

	if (obj.attachments.length) {
		embed.addField("Attachments", obj.attachments.join("\n"));
	}

	if (obj.votes_yes.length) {
		embed.addField(
			"Votes yes",
			(await Promise.all(obj.votes_yes.map(v => client.users.fetch(v)))).join(
				""
			)
		);
	}
	if (obj.votes_no.length) {
		embed.addField(
			"Votes no",
			(await Promise.all(obj.votes_no.map(v => client.users.fetch(v)))).join("")
		);
	}
	return embed;
}
const cooldownInMinutes = 60;

client.on(`message`, async message => {
	if (message.author.id === client.user.id) return;
	let match;
	if (message.channel.type === "dm") {
		if ((match = message.content.match(/^delete submission$/is))) {
			if (!userdata[message.author.id]) {
				message.channel.send("You don't have any submissions!");
			} else {
				// the user has an answer
				// check for time
				if (
					Date.now() - userdata[message.author.id].timestamp <
					cooldownInMinutes * 60 * 1000
				) {
					message.channel.send(
						`You need to wait ${moment(
							userdata[message.author.id].timestamp
						).from(
							Date.now() - cooldownInMinutes * 60 * 1000,
							false
						)} in order to delete your answer!`
					);
					return;
				} else {
					delete userdata[message.author.id];
					fs.writeFileSync(
						__dirname + "/userdata.json",
						JSON.stringify(userdata, null, "\t"),
						"utf8"
					);
					return message.channel.send("Deleted");
				}
			}
			return;
		}

		if (message.content === "submit help") {
			return message.channel.send("We dont have a help command ok?");
		}
		if ((match = message.content.match(/^submit(?:\s*(.+)|$)/is))) {
			// if user is on one of the managers give them access to the shit
			if (match[1] === undefined && settings.obj.answerType == "subjective") {
				if (message.attachments.size === 0) {
					message.channel.send(
						"Your submission doesnt include an answer nor an attachment. Aborted"
					);
					return;
				}
				match[1] = "[Attachment]";
			} else if (settings.obj.answerType === "subjective") {
				// do nothing
			} else if (settings.obj.answerType === "regex") {
				if (!match[1].match(settings.obj.answerInputRegex)) {
					return message.channel.send(
						"Your answer does not meet the answer format! unfortunately, I cant provide you with an example. Please refer to the original quesiton"
					);
				}
			} else if (
				message.attachments.size > 0 &&
				match[1] === undefined &&
				settings.obj.answerType === "single"
			) {
				// do nothing because an answer with an attachment doesnt need answer checks... hopefully
				return message.channel.send(
					`The answer type for this question is '${settings.obj.answerType}'. You MUST include a text answer`
				);
			} else if (!match[1].match(/^<.*>/)) {
				return message.channel.send(
					"Your submission format is incorrect!\nReason: 'no <> around answer'\nex: <1>, <A>, <1.6>, <404> bad ex: < 1>, <a>, <5 because i think so>"
				);
			} else if (match[1].match(/^<>/)) {
				return message.channel.send(
					"Your submission format is incorrect!\nReason: 'no answer inside <>'\nex: <1>, <A>, <1.6>, <404> bad ex: < 1>, <a>, <5 because i think so>"
				);
			} else if (match[1].match(/^<[a-z]>/)) {
				return message.channel.send(
					"Your submission format is incorrect!\nReason: 'includes a singular lowercase letter'\nex: <1>, <A>, <1.6>, <404> bad ex: < 1>, <a>, <5 because i think so>"
				);
			} else if (match[1].match(/^[^<]/)) {
				return message.channel.send(
					"Your submission format is incorrect!\nReason: 'answer doesnt start with an opening bracket'\nex: <1>, <A>, <1.6>, <404> bad ex: < 1>, <a>, <5 because i think so>"
				);
			} else if (match[1].match(/^<[^>]*$/)) {
				return message.channel.send(
					"Your submission format is incorrect!\nReason: 'no closing > for answer'\nex: <1>, <A>, <1.6>, <404> bad ex: < 1>, <a>, <5 because i think so>"
				);
			} else if (match[1].match(/^<\s/)) {
				return message.channel.send(
					"Your submission format is incorrect!\nReason: 'a space after opening <'\nex: <1>, <A>, <1.6>, <404> bad ex: < 1>, <a>, <5 because i think so>"
				);
			} else if (match[1].match(/^<[^>]*?\s>/)) {
				return message.channel.send(
					"Your submission format is incorrect!\nReason: 'space before closing >'\nex: <1>, <A>, <1.6>, <404> bad ex: < 1>, <a>, <5 because i think so>"
				);
			} else if (
				settings.obj.answerType === "single" &&
				!match[1].match(/^<(?:[A-Z]|\d+)>/)
			) {
				return message.channel.send(
					"Your submission format is incorrect!\nReason: 'Answer for this potd must be a single integer or capital letter'\nex: <1>, <A>, <1.6>, <404> bad ex: < 1>, <a>, <5 because i think so>"
				);
			}
		} else {
			return;
		}
		if (userdata[message.author.id] !== undefined) {
			return message.channel.send("you already submitted an answer today!");
		}
		try {
			console.log(mainGuild.id);
			let mem = mainGuild.member(message.author);
			// console.log("member is", mem);
			if (mem.roles.cache.has("775752282331414538")) {
				mem.roles.add("776482429913006110");
				message.channel.send("You can now view answers");
			}
		} catch (e) {
			// do nothing
			// console.log(e);
		}
		// return;
		userdata[message.author.id] = {
			answer: match[1],
			timestamp: Date.now(),
			vote_yes: [], // the user ids who marked this answer as valid
			vote_no: [],
			attachments: message.attachments.size
				? [...message.attachments.values()]
				: [],
		};
		fs.writeFileSync(
			__dirname + "/userdata.json",
			JSON.stringify(userdata, null, "\t"),
			"utf8"
		);
		(await submissionLog).send(
			new Discord.MessageEmbed()
				.setAuthor(message.author.username, message.author.displayAvatarURL())
				.setColor(
					"#" + (0x1000000 + Math.random() * 0xffffff).toString(16).substr(1, 6)
				)
				.addFields(
					{
						name: "ping",
						value: message.author,
					},
					{
						name: "answer",
						value: match[1],
					}
				)
				.setTimestamp()
		);
		if (message.attachments.size > 0) {
			(await submissionLog).send("attachments: ", {
				files: message.attachments.array(),
			});
		}
		message.channel.send("Submitted your response!");
		return;
	}
	if (message.guild.id === mainGuild.id) {
		let match;
		if (
			(match = message.content.match(
				/^advanced math(?:s|ematics)(?: (\d+))?/is
			))
		) {
			if (message.guild.member(message.author).roles.cache.has(val)) {
				if (message.mentions.users.size === 0 && !match[1]) {
					message.channel.send(
						"please specify the person you want to give advanced maths"
					);
				} else {
					let person;
					if (message.mentions.users.size === 0) {
						person = await client.users.fetch(match[1]);
					} else {
						person = message.mentions.users.first();
					}
					try {
						if (!person) {
							message.channel.send("invalid user id");
							return;
						}
						console.log(person.id);
						person = await message.guild.members.fetch(person);
						person.roles.add(adv);
					} catch (e) {
						console.log(e);
						message.channel.send("something went wrong");
						return;
					}
					message.channel.send("gave the role");
					serverChangeLog.send(
						`${message.author} gave ${person} advanced mathematics`,
						pingEveryoneRoleOption
					);
				}
			} else {
				message.channel.send("a valued person should execute this command");
			}
		}
	}
	// ping managers

	if (
		(gm = (await submissionLog).guild.member(message.author)) &&
		gm.roles.cache.has("780107740047605770")
	) {
		if (message.content === "ping managers") {
			return message.channel.send(
				`<@&${potdManagerRole}>`,
				pingRoleOption([potdManagerRole])
			);
		}
	}
	if (
		message.channel.type !== "dm" &&
		(gm = (await submissionLog).guild.member(message.author)) &&
		(gm.hasPermission("ADMINISTRATOR") || gm.roles.cache.has(potdAdminRole))
	) {
		if (
			(match = message.content.match(/^potd config set nextmessage (.+)/is))
		) {
			config.obj.nextMessage = match[1];
			await config.save();
			return message.channel.send("Successfully altered");
		}
		if (
			(match = message.content.match(/^potd config set nextreactions (.+)/is))
		) {
			config.obj.nextReactions = match[1].split(/(?:,\s*|\s+)/gi);
			await config.save();
			return message.channel.send("Successfully altered");
		}
		if ((match = message.content.match(/^potd config$/i))) {
			return message.channel.send(
				"```json\n" + JSON.stringify(config.obj, null, "\t") + "```"
			);
		}
		if ((match = message.content.match(/^delete answer (.+)/is))) {
			if (!userdata[match[1]])
				return message.channel.send("The user has no entry!");
			delete userdata[match[1]];
			fs.writeFileSync(
				__dirname + "/userdata.json",
				JSON.stringify(userdata, null, "\t"),
				{ encoding: "utf8" }
			);
			message.channel.send("deleted answer");
		}
		if ((match = message.content.match(/^set author (\d+)\s+(.+)$/is))) {
			pendingQuestions.obj[match[1]].author = match[2];
			pendingQuestions.save();
			updateQuestion(match[1]);
			let resp = await message.channel.send("Updated author");
			await sleep(5000);
			resp.delete();
			message.delete();
			return;
		}
		if ((match = message.content.match(/^set explanation (\d+)\s+(.+)$/is))) {
			pendingQuestions.obj[match[1]].explanation = match[2];
			pendingQuestions.save();
			updateQuestion(match[1]);
			let resp = await message.channel.send("Updated explanation");
			await sleep(5000);
			resp.delete();
			message.delete();
			return;
		}
		if ((match = message.content.match(/^set explanation\s(.*)/is))) {
			settings.obj.answerExplanation = match[1];
			settings.save();
			return message.channel.send("set answer explanation for today's potd");
		}
		if ((match = message.content.match(/^set question (\d+)\s+(.+)$/is))) {
			let url;
			if (message.attachments.size) {
				pendingQuestions.obj[
					match[1]
				].image = message.attachments.first().attachment;
			} else if ((url = message.content.match(urlRegex))) {
				pendingQuestions.obj[match[1]].image = url[0];
			}
			pendingQuestions.obj[match[1]].question = match[2];
			pendingQuestions.save();
			updateQuestion(match[1]);
			let resp = await message.channel.send("Updated question");
			await sleep(5000);
			resp.delete();
			message.delete();
			return;
		}

		if (
			(match = message.content.match(/^set difficulty (\d+)\s+(\d+)(\w+)$/is))
		) {
			let resp;
			try {
				let subject = match[3];
				let d = parseInt(match[2]);
				if (!POTDDIFFICULTY[subject]) {
					resp = "that is not a valid subject!";
				} else {
					if (!POTDDIFFICULTY[subject].description[d]) {
						resp = `No valid description set for difficulty integer ${d}`;
						"that is not a valid difficulty for the subject '" +
							POTDDIFFICULTY[subject].name +
							"'.";
					} else {
						pendingQuestions.obj[match[1]].difficulty = match[2];
						pendingQuestions.obj[match[1]].subject = match[3];
						pendingQuestions.save();
						updateQuestion(match[1]);
						resp = "Updated difficulty";
					}
				}
			} catch {
				resp = "something went wrong while trying to parse the integer";
			}
			resp = await message.channel.send(resp);
			await sleep(5000);
			resp.delete();
			message.delete();
		}
		if ((match = message.content.match(/^set answer ?type (\d+)\s+(.+)$/is))) {
			pendingQuestions.obj[match[1]].answerType = match[2];
			pendingQuestions.save();
			updateQuestion(match[1]);
			let resp = await message.channel.send("Updated answer type");
			await sleep(5000);
			resp.delete();
			message.delete();
			return;
		}
		if ((match = message.content.match(/^set answer ?regex (\d+)\s+(.+)$/is))) {
			try {
				let re = new RegExp(match[2], "is");
				pendingQuestions.obj[match[1]].answerRegex = re;
				pendingQuestions.save();
				updateQuestion(match[1]);
				resp = "Updated answer regex";
			} catch (e) {
				resp = "invalid regex";
			}
			resp = await message.channel.send(resp);
			await sleep(5000);
			resp.delete();
			message.delete();
			return;
		}
		if (
			(match = message.content.match(
				/^set answer ? input ?regex (\d+)\s+(.+)$/is
			))
		) {
			try {
				let re = new RegExp(match[1], "is");
				pendingQuestions.obj[match[1]].answerInputRegex = re;
				pendingQuestions.save();
				updateQuestion(match[1]);
				resp = "Updated answer regex";
			} catch (e) {
				resp = "invalid regex";
			}
			resp = await message.channel.send(resp);
			await sleep(5000);
			resp.delete();
			message.delete();
			return;
		}
		if ((match = message.content.match(/^set answer ?regex\s+(.+)$/is))) {
			try {
				let re = new RegExp(match[1], "is");
				console.log(re);
				settings.obj.answerRegex = re;
				settings.save();
				resp = "Updated answer regex for today's potd";
			} catch (e) {
				resp = "invalid regex";
			}
			resp = await message.channel.send(resp);
			await sleep(5000);
			resp.delete();
			message.delete();
			return;
		}
		if ((match = message.content.match(/^set answer (\d+)\s+(.+)$/is))) {
			pendingQuestions.obj[match[1]].answer = match[2];
			pendingQuestions.save();
			updateQuestion(match[1]);
			let resp = await message.channel.send("Updated answer");
			await sleep(5000);
			resp.delete();
			message.delete();
			return;
		}

		if ((match = message.content.match(/^set answer ?type\s+(.+)/is))) {
			settings.obj.answerType = match[1];
			settings.save();
			message.channel.send("set answer type  regex for today's potd");
		} else if (
			(match = message.content.match(/^set answer ?input ?regex (.+)/is))
		) {
			settings.obj.answerInputRegex = match[1];
			settings.save();
			message.channel.send("set answer input regex regex for today's potd");
		}

		if (message.content === "clear users") {
			userdata = {};
			fs.writeFileSync(
				__dirname + "/userdata_log/" + Math.floor(Date.now() / 1000) + ".json",
				fs.readFileSync(__dirname + "/userdata.json"),
				{ flag: "w+" }
			);
			fs.writeFileSync(__dirname + "/userdata.json", "{}", "utf8");
			message.channel.send("cleared users");
		}
		if (message.content === "clear viewers") {
			try {
				console.log("starting to fetch members...");
				await message.guild.members.fetch();
				console.log("done");
				message.guild.members.cache
					.filter(member =>
						member.roles.cache.find(role => role.id === "776482429913006110")
					)
					.forEach(member =>
						member.roles.remove("776482429913006110").catch(() => {
							console.log("no permission to clear " + member.displayName);
							if (member.displayName === undefined) {
								console.log(member);
							}
						})
					);

				message.channel.send("cleared viewers");
			} catch {
				message.channel.send("something went wrong");
			}
		}
		if (message.content === "reload file") {
			try {
				userdata = JSON.parse(fs.readFileSync(__dirname + "/userdata.json"));
			} catch {
				return message.channel.send("JSON file is wrong!");
			}
			return message.channel.send("reloaded");
		}
		if (message.content === "clear winners") {
			try {
				message.guild.members.cache
					.filter(member =>
						member.roles.cache.find(role => role.id === "772414951012433930")
					)
					.forEach(member =>
						member.roles
							.remove("772414951012433930")
							.catch(() =>
								console.log("no permission to clear " + member.username)
							)
					);

				message.channel.send("cleared winners");
			} catch {
				message.channel.send("something went wrong");
			}
		}
		if (message.content.startsWith("give winners")) {
			let match;
			if ((match = message.content.match(/^give winners(?: (.+))?/is))) {
				console.log("giving winners");
				let members = (
					await message.guild.members
						.fetch({ user: Object.keys(userdata) })
						.catch(console.log)
				).array();
				if (!match[1]) {
					// automatic grading
					if (settings.obj.answerType === "subjective") {
						// do vote based grading
						match[1] = "votes";
					} else if (settings.obj.answerType === "regex") {
						// do regex based grading
						if (!settings.obj.answerRegex) {
							return message.channel.send(
								"Answer is undefined! i dont know how this happened. please nope"
							);
						}
						let re = new RegExp(settings.obj.answerRegex, "is");
						members = members.filter(member => {
							userdata[member.id] &&
								userdata[member.id].answer.match(settings.obj.answerRegex);
						});
					} else if (settings.obj.answerType === "single") {
						match[1] = `<${settings.obj.answer}>`;
					}
				}
				if (match[1] === "votes") {
					message.channel.send("checking for votes");
					members = members.filter(member => {
						return (
							(userdata[member.id].vote_no.length === 0 ||
								userdata[member.id].vote_yes.length /
									userdata[member.id].vote_no.length >=
									2) &&
							userdata[member.id].vote_yes.length
						);
					});
				} else {
					members = members.filter(member => {
						console.log(userdata[member.id].answer);
						return userdata[member.id].answer.includes(match[1]);
					});
				}
				members.forEach(member => {
					if (!member.roles.cache.has("772414951012433930"))
						member.roles
							.add("772414951012433930")
							.then(() =>
								console.log("success adding to " + member.displayName)
							)
							.catch(console.log);
				});
				message.channel.send("done");
				message.channel.send(
					"pings: ```\n" +
						members.map(member => member.toString()).join("\n") +
						"```",
					pingEveryoneRoleOption
				);
				// .filter((id) => {
				// 	const answer = userdata[id].answer;
				// 	// console.log(id);
				// 	// console.log(message.guild.member(id));
				// 	return answer.includes(match[1]);
				// })
				// .map((memberId) => message.guild.member(memberId))
				// .forEach((member) => {
				// 	if (!member) return;
				// 	console.log("giving role to " + member.username);
				// 	member.roles
				// 		.add("772414951012433930")
				// 		.catch(
				// 			"no permission to add role to member " + member.username
				// 		);
				// });
			}
		}
	}
	if (
		[
			potdAnswersChannel,
			potdManagersChannel,
			potdPendingChannel,
			potdLogChannel,
		].some(v => v.id === message.channel.id)
	) {
		let match;

		if ((match = message.content.match(/^add pending yaml(.*)/is))) {
			let questionObj;
			try {
				let res = scripting(match[1]);
				questionObj = {
					author: undefined,
					question: undefined,
					attachments: [...message.attachments.values()],
					votes_yes: [],
					votes_no: [],
					difficulty: undefined,
					difficultyDescription: undefined,
					image: undefined,
					explanation: undefined,
					answerRegex: undefined,
					answerType: undefined,
					answer: undefined,
				};
				for (const o of res.keyValues) {
					if (!Object.keys(questionObj).includes(o.key)) {
						return message.channel.send("Invalid key `" + o.key + "`");
					}
					if (o.key === "difficulty") {
						let m = o.content.match(/(\d+)(\w+)/);
						let subject = m[2];
						let d = parseInt(m[1]);
						try {
							difficultyToString(d, subject);
						} catch {
							return message.channel.send("invalid difficulty code");
						}
						questionObj.difficulty = d;
						questionObj.subject = subject;
					} else {
						questionObj[o.key] = o.content;
					}
				}
				if (!questionObj) {
					return message.channel.send("Question is not provided!");
				}
			} catch (e) {
				return message.channel.send("ERROR\n" + e.message);
			}
			let sentMessage = await potdAnswersChannel.send("generating embed...");
			let embed = await embedFromQuestionObj(questionObj, sentMessage.id);
			sentMessage.edit("", embed);
			pendingQuestions.obj[sentMessage.id] = questionObj;
			pendingQuestions.save();
			message.react("✅");
			await sentMessage.react(voteYesEmoji);
			await sentMessage.react(voteNoEmoji);
			await sentMessage.react(sendPOTDEmoji);
			await sentMessage.react(deletePOTDEmoji);
			return;
		}
		if ((match = message.content.match(/^add pending(?: (.+))?/is))) {
			let questionObj = {
				author: undefined,
				question: match[1] ?? "[Attachment]",
				attachments: [...message.attachments.values()],
				votes_yes: [],
				votes_no: [],
				difficulty: undefined,
				image: undefined,
				explanation: undefined,
			};
			let url;
			if (message.attachments.size) {
				questionObj.image = message.attachments.first().attachment;
			} else if ((url = message.content.match(urlRegex))) {
				questionObj.image = url[0];
			}
			let sentMessage = await potdAnswersChannel.send("generating embed...");
			let embed = await embedFromQuestionObj(questionObj, sentMessage.id);
			sentMessage.edit("", embed);
			pendingQuestions.obj[sentMessage.id] = questionObj;
			pendingQuestions.save();
			message.react("✅");
			await sentMessage.react(voteYesEmoji);
			await sentMessage.react(voteNoEmoji);
			await sentMessage.react(sendPOTDEmoji);
			await sentMessage.react(deletePOTDEmoji);
			return;
		}
		if (message.content.match("potd status")) {
			message.channel.send(
				"```json\n" +
					Object.keys(settings.obj)
						.filter(k => settings.obj[k])
						.map(
							k => `${k}: ${settings.obj[k].toString().replace("\n", "\n  ")}`
						)
						.join("\n") +
					"```"
			);
		}
		if ((match = message.content.match(/^delete pending (\d+)/is))) {
			let rep;
			try {
				const toDelete = await (
					await client.channels.fetch(potdPendingChannel)
				).messages.fetch(match[1]);
				if (!toDelete) {
					rep = await message.channel.send("id is invalid");
				}
				toDelete.delete();
				rep = await message.channel.send("deleted");
			} catch (e) {
				console.log(e);
				rep = await message.channel.send("something went wrong");
			}
			message.delete();
			await sleep(5000);
			rep.delete();
			return;
		}
	}
	if (message.channel.id === "772406579177848843") {
		let match;
		if ((match = message.content.match(/^edit answer (\d+)\s(.+)$/is))) {
			if (!userdata[match[1]]) {
				return message.channel.send(`The user id ${match[1]} has no entry`);
			}
			try {
				userdata[match[1]].answer = match[2];
				userdata[match[1]].edited = true;
				fs.writeFileSync(
					__dirname + "/userdata.json",
					JSON.stringify(userdata, null, "\t"),
					{ encoding: "utf8" }
				);
				message.channel.send("edited");
			} catch (e) {
				message.channel.send("something went wrong");
			}

			return;
		}
		if ((match = message.content.match(/^vote yes (\d+)/is))) {
			if (!userdata[match[1]]) {
				return message.channel.send(`The user id ${match[1]} has no entry`);
			}
			if (userdata[match[1]].vote_no.indexOf(message.author.id) !== -1) {
				return message.channel.send(`You already voted no!`);
			}
			if (userdata[match[1]].vote_yes.indexOf(message.author.id) !== -1) {
				return message.channel.send(`You already voted yes!`);
			}
			userdata[match[1]].vote_yes.push(message.author.id);
			fs.writeFileSync(
				__dirname + "/userdata.json",
				JSON.stringify(userdata, null, "\t"),
				{ encoding: "utf8" }
			);
			return message.channel.send(`Vote submitted`);
		}
		if ((match = message.content.match(/^vote no (\d+)/is))) {
			if (!userdata[match[1]]) {
				return message.channel.send(`The user id ${match[1]} has no entry`);
			}
			if (userdata[match[1]].vote_yes.indexOf(message.author.id) !== -1) {
				return message.channel.send(`You already voted yes!`);
			}
			if (userdata[match[1]].vote_no.indexOf(message.author.id) !== -1) {
				return message.channel.send(`You already voted no!`);
			}
			userdata[match[1]].vote_no.push(message.author.id);
			fs.writeFileSync(
				__dirname + "/userdata.json",
				JSON.stringify(userdata, null, "\t"),
				{ encoding: "utf8" }
			);
			return message.channel.send(`Vote submitted`);
		}
		if ((match = message.content.match(/^vote remove (\d+)/is))) {
			if (!userdata[match[1]]) {
				return message.channel.send(`The user id ${match[1]} has no entry`);
			}
			if (userdata[match[1]].vote_yes.indexOf(message.author.id) !== -1) {
				userdata[match[1]].vote_yes.splice(
					userdata[match[1]].vote_yes.indexOf(message.author.id),
					1
				);
			} else if (userdata[match[1]].vote_no.indexOf(message.author.id) !== -1) {
				userdata[match[1]].vote_no.splice(
					userdata[match[1]].vote_no.indexOf(message.author.id),
					1
				);
			} else {
				return message.channel.send("No votes detected");
			}
			fs.writeFileSync(
				__dirname + "/userdata.json",
				JSON.stringify(userdata, null, "\t"),
				{ encoding: "utf8" }
			);
			return message.channel.send(`Vote removed`);
		}
		if (message.content === "view answers") {
			m = [];
			for (const [u, d] of Object.entries(userdata)) {
				m.push(
					`> ${
						(await client.users.fetch(u)).username
					} - ${u}\n > Answer: ${d.answer.replace(/\n/g, "\n> ")}${
						d.attachments.length
							? "\n> Attachments\n> " +
							  d.attachments.map(v => v.attachment).join("\n> ")
							: ""
					}${
						d.vote_yes.length
							? "\n> votes yes: " +
							  (
									await Promise.all(
										d.vote_yes.map(async v => (await client.users.fetch(v)).tag)
									)
							  ).join(", ")
							: ""
					}${
						d.vote_no.length
							? "\n> votes no: " +
							  (
									await Promise.all(
										d.vote_no.map(async v => (await client.users.fetch(v)).tag)
									)
							  ).join(", ")
							: ""
					}\n> ${moment(d.timestamp).fromNow()}`
				);
			}
			message.channel.send("answers:\n" + m.join("\n\n"), { split: true });
			return;
		}
		if ((match = message.content.match(/approve( ?\d+)?/i))) {
		}

		// message.channel.send("File: ", {
		// 	files: [
		// 		{
		// 			name: "userdata.json",
		// 			attachment: fs.readFileSync(__dirname + "/userdata.json"),
		// 		},
		// 	],
		// });
	}
	if (message.author.id === "341446613056880641") {
		if (message.content.startsWith("!eval")) {
			let match;
			if ((match = message.content.match(/^!eval (.+)/s))) {
				await eval("(async () => {" + match[1] + "})()");
			}
		}
	}
});

client.login(process.env.TOKEN);

// function askQ(query) {
// 	// asks the query and then accepts a readline
// 	const rl = readline.createInterface({
// 		input: process.stdin,
// 		output: process.stdout
// 	});
// 	return new Promise(res => rl.question(query, answer => {
// 		rl.close();
// 		res(answer);
// 	}));
// }
// function input() {
// 	// accepts a readline
// 	const rl = readline.createInterface({
// 		input: process.stdin,
// 		output: process.stdout
// 	});
// 	return new Promise(res => rl.question("", answer => {
// 		rl.close();
// 		res(answer);
// 	}));
// }
