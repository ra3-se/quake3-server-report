const message = require('./message');
const {GENDER_NEUTER} = require('./constant/gender');

function parseDataString(data) {
	const result = {};
	data = data.split('\\');
	while (data.length) {
		const keyValue = data.splice(0, 2);
		result[keyValue[0]] = keyValue[1];
	}

	return result;
}

const events = {
	init: {
		regExp: 'InitGame: \\\\(.+)',
		parser: ([data]) =>
			parseDataString(data)
	},
	shutdown: {
		regExp: 'ShutdownGame:',
		parser: () => {}
	},
	connect: {
		regExp: 'ClientConnect: (\\d+) (.+) \\((.+)\\)',
		parser: ([playerIndex, player, ip]) =>
			({playerIndex, player, ip})
	},
	disconnect: {
		regExp: 'ClientDisconnect: (\\d+)',
		parser: ([playerIndex]) =>
			({playerIndex})
	},
	info: {
		regExp: 'ClientUserinfoChanged: (\\d+) (.+)',
		parser: ([playerIndex, data]) =>
			Object.assign({playerIndex}, parseDataString(data))
	},
	kill: {
		regExp: 'Kill: (\\d+) (\\d+) (\\d+) \\d+: (.+) killed (.+) by ([A-Z_]+)',
		parser: ([attackerIndex, targetIndex, modIndex, attacker, target, mod]) =>
			({attackerIndex, targetIndex, modIndex, attacker, target, mod,
				messageParts: message(mod, attacker, target, GENDER_NEUTER)})
	},
	message: {
		regExp: 'say: (\\d+) \\d+: ([^:]+): (.+)',
		parser: ([playerIndex, player, message]) =>
			({playerIndex, player, message})
	}
};

const eventHandlers = Object.keys(events).map(key => {
	const event = events[key];
	const evtRegExp = new RegExp(event.regExp);
	const {parser} = event;

	return function (line) {
		if (evtRegExp.test(line)) {
			return {event: key, data: parser(line.match(evtRegExp).slice(1))};
		}
	};
});

module.exports = line => {
	for (let index = 0; index < eventHandlers.length; index++) {
		const result = eventHandlers[index](line);
		if (result) {
			return result;
		}
	}

	return {event: 'unknown', data: {line}};
};