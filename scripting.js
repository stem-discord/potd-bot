const ohm = require(`ohm-js`);
const fs = require(`fs`);

const g = ohm.grammar(fs.readFileSync(__dirname + `/addPending.peg`));

const s = g.createSemantics();

const text = `
author: @nope#7777  
question: what is life?
answer: 42
answerType: single
image: https://cdn.discordapp.com/attachments/775752080291004437/782275673343393812/unknown.png
explanation: bruh
difficulty: 6m
`;

s.addOperation(`interpret`, {
	KeyValues: function (_, e, _) {
		return { keyValues: e.interpret() };
	},
	KeyValue: function (_, t, _, content) {
		return { key: t.interpret(), content: content.interpret() };
	},
	key: function (v) {
		return this.sourceString;
	},

	content: function (c) {
		return c.interpret();
	},

	inlineContent: function (_, _, _) {
		return this.sourceString;
	},

	NonemptyListOf: function (a, b, c) {
		return [a.interpret(), ...c.children.map((v) => v.interpret())];
	},
	EmptyListOf: function () {
		return [];
	},

	number: function (_, _, _) {
		return parseFloat(this.sourceString);
	},
	string: function (_, s, _) {
		return s.sourceString;
	},
});

// s.addOperation(`json`, {
// 	Events: (_, e, __) => {
// 		return { Events: e.interpret() };
// 	},
// });
// const mr = g.match(text);
// if (mr.succeeded()) {
// 	// console.log(mr);
// 	const n = s(mr);
// 	console.log(n.interpret());
// 	fs.writeFileSync(
// 		__dirname + "/outjson.json",
// 		JSON.stringify(n.interpret(), null, "\t")
// 	);
// } else {
// 	console.log(mr.message);
// }
module.exports = (t) => {
	let mr = g.match(t);
	if (mr.succeeded()) {
		return s(mr).interpret();
	} else {
		throw new Exception(mr.message);
	}
};
