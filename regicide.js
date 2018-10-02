const {
	can_move,
	set_most_recent_move,
	is_player,
	get_strength,
	get_supporters,
	get_relative_class,
	create_players,
	create_player,
	build_hierarchy,
	assign_places,
	game_tostring,
	gaussian
} = require("./supportMethods");

var games = {};

exports.run = (api, event) => {
	var args = event.arguments;

	var intent = args[1] ? args[1].toLowerCase() : null;
	var gameThreadId = (intent === "supporting" || intent === "pledge" || intent === "unpledge") ? args[2] : event.thread_id;
	var game = games[gameThreadId];

	var output;
	switch (intent) {
		case "startgame":  output = start_game(games, gameThreadId, api.getUsers(gameThreadId)); break;
		case "endgame":	   output = end_game(games, gameThreadId); break;
		case "joingame":   output = join_game(game, event.sender_id, event.sender_name); break;
		case "hierarchy":  output = hierarchy(game); break;
		case "supporters": output = supporters(game, args[2]); break;
		case "supporting": output = supporting(game, event.sender_id, event.thread_id, args[2]); break;
		case "pledge":     output = pledge(api, game, event.sender_id, event.thread_id, args[2], args[3], args[4]); break;
		case "unpledge":   output = unpledge(api, game, event.sender_id, event.thread_id, args[2], args[3], args[4]); break;
		case "attack":     output = attack(game, event.sender_id, args[2]); break;
		case "appoint":    output = appoint(game, event.sender_id, args[2], args[3]); break;
		default:           output = "That's not a command, foo!"; break;
	}
	api.sendMessage(output, event.thread_id);
}

/**
 * /regicide startgame
 * @param {Object} games
 * @param {String} threadId
 * @param {Object} people
 */
function start_game(games, threadId, people) {
	var numPlayers = Object.keys(people || {}).length;
	if (numPlayers < 6) return "minimum 6 players";

	var game = {
		hierarchy: build_hierarchy(numPlayers),
		players: create_players(people)
	}
	assign_places(game.players, game.hierarchy);
	games[threadId] = game;
	return "game started\n\n" + game_tostring(game);
}

/**
 * /regicide endgame
 * @param {Object} games
 * @param {String} threadId
 */
function end_game(games, threadId) {
	if (!games[threadId]) return "Game's not running, foo!";

	delete games[threadId];
	return "game ended";
}

/**
 * /regicide joingame
 * @param {Object} game
 * @param {String} callerId
 * @param {String} callerName
 */
function join_game(game, callerId, callerName) {
	if (!game) return "Game's not running, foo!";
	if (is_player(callerId, game.players)) return "You're already in the game, foo!";

	var numPlayers = Object.keys(game.players).length + 1;
	game.hierarchy = build_hierarchy(numPlayers);
	game.players[callerId] = create_player(callerName);
	assign_places(game.players, game.hierarchy);
	return callerName + " has joined the game\n\n" + game_tostring(game);
}

/**
 * /regicide hierarchy
 * @param {Object} game
 */
function hierarchy(game) {
	if (!game) return "Game's not running, foo!";

	return game_tostring(game);
}

/**
 * /regicde supporters <Player's Unique ID>
 * @param {Object} game
 * @param {String} targetId
 */
function supporters(game, targetId) {
	if (!game) return "Game's not running, foo!";
	if (!is_player(targetId, game.players)) return "That's not a player, foo!";

	var targetName = game.players[targetId];
	var message = targetName + "'s supporters: " + get_supporters(targetId, game.players, false, true).join(", ");
	return message + "\nTotal Strength: " + get_strength(targetId, game.players, game.hierarchy, false);
}

/**
 * /regicide supporting <chatId>
 * @param {Object} game
 * @param {String} callerId
 * @param {String} originThreadId
 * @param {String} destinationThreadId
 */
function supporting(game, callerId, originThreadId, destinationThreadId) {
	if (originThreadId === destinationThreadId) return "Message me in private, foo!";
	if (!game) return "No game in that thread, foo!";
	if (!is_player(callerId, game.players)) return "You're not playing, foo!";

	var message = "Purportedly supporting " + game.players[callerId].claimed_supportee;
	message += "\nActually supporting " + game.players[callerId].actual_supportee;
	return message;
}

/**
 * /regicide pledge <chatId> <targetId> <sincere> <declare>
 * @param {Object} api
 * @param {Object} game
 * @param {String} callerId
 * @param {String} originThreadId
 * @param {String} destinationThreadId
 * @param {String} targetId
 * @param {Boolean} sincere
 * @param {Boolean} declare
 */
function pledge(api, game, callerId, originThreadId, destinationThreadId, targetId, sincere, declare) {
	if (originThreadId === destinationThreadId) return "Message me in private, foo!";
	if (!game) return "No game in that thread, foo!";
	if (!is_player(callerId, game.players)) return "You're not playing, foo!";
	if (!can_move(callerId, game.players)) return "You already went, foo!";
	if (!is_player(targetId, game.players)) return "That's not a player, foo!";
	set_most_recent_move(callerId, game.players);

	var targetName = game.players[targetId].name;
	if (sincere) {
		game.players[callerId].actual_supportee = targetId;
	}
	if (declare) {
		var oldPledge = game.players[callerId].claimed_supportee;
		game.players[callerId].claimed_supportee = targetId;

		var callerName = game.players[callerId].name;
		var message;
		if (oldPledge) message = callerName + " has abandoned " + oldPledge + " in favor of " + targetName;
		else message = callerName + " has pledged their support to " + targetName;
		api.sendMessage(message, destinationThreadId);
	}

	if (sincere && declare)   return "You sincerely proclaim your support to " + targetName;
	if (!sincere && declare)  return "You deceitfully proclaim your support to " + targetName;
	if (sincere && !declare)  return "You secretly support " + targetName;
	if (!sincere && !declare) return "You achieve nothing";
}

/**
 * /regicide unpledge <chatId> <sincere> <declare>
 * @param {Object} api
 * @param {Object} game
 * @param {String} callerId
 * @param {String} originThreadId
 * @param {String} destinationThreadId
 * @param {Boolean} sincere
 * @param {Boolean} declare
 */
function unpledge(api, game, callerId, originThreadId, destinationThreadId, sincere, declare) {
	if (originThreadId === destinationThreadId) return "Message me in private, foo!";
	if (!game) return "No game in that thread, foo!";
	if (!is_player(callerId, game.players)) return "You're not playing, foo!";
	if (!can_move(callerId, game.players)) return "You already went, foo!";
	set_most_recent_move(callerId, game.players);

	var actualPledge = game.players[callerId].actual_supportee;
	var claimedPledge = game.players[callerId].claimed_supportee;
	var actualPledgeName = actualPledge ? game.players[actualPledge].name : null;
	var claimedPledgeName = claimedPledge ? game.players[claimedPledge].name : null;

	if (sincere && actualPledge) {
		game.players[callerId].actual_supportee = null;
	}
	if (declare && claimedPledge) {
		game.players[callerId].claimed_supportee = null;

		var callerName = game.players[callerId].name;
		var message = callerName + " has disavowed " + claimedPledgeName;
		api.sendMessage(message, destinationThreadId);
	}

	if (!sincere && !declare) { // not changing anything about the game state
		return "You achieve nothing";
	}
	if (!actualPledge && !claimedPledge) { // both pledge types are null
		return "You're already not supporting anyone, publicy or otherwise";
	}
	if (actualPledge === claimedPledge) { // purported and actual pledges are the same person, and it's not null
		if (sincere && declare)  return "You sincerely proclaim that you are no longer supporting " + actualPledgeName;
		if (sincere && !declare) return "You're no longer supporting " + actualPledgeName + ", but you don't tell anyone";
		if (!sincere && declare) return "You claim you are no longer supporting " + actualPledgeName + ", but you still are";
	}
	if (!actualPledge) { // no actual pledge, only a purported pledge
		if (sincere && declare)  return "You're no longer claiming to support " + claimedPledgeName;
		if (sincere && !declare) return "You're already not supporting anyone; you still claim allegiance to " + claimedPledgeName;
		if (!sincere && declare) return "You're no longer claiming to support " + claimedPledgeName;
	}
	if (!claimedPledge) { // no public pledge, only a secret pledge (yes I know the 'if' statement is redundant)
		if (sincere && declare)  return "You're no longer secretly supporting " + actualPledgeName;
		if (sincere && !declare) return "You're no longer secretly supporting " + actualPledgeName;
		if (!sincere && declare) return "You're already claiming to not support anyone; you still hold allegiance to " + actualPledgeName;
	}
}

/**
 * /regicide attack <targetId>
 * @param {Object} game
 * @param {String} callerId
 * @param {String} targetId
 */
function attack(game, callerId, targetId) {
	if (!game) return "Game's not running, foo!";
	if (!is_player(callerId, game.players)) return "You're not playing, foo!";
	if (!can_move(callerId, game.players)) return "You already went, foo!";
	if (!is_player(targetId, game.players)) return "That's not a player, foo!";
	set_most_recent_move(callerId, game.players);

	var callerName = game.players[callerId].name;
	var targetName = game.players[targetId].name;

	var callerStrength = get_strength(callerId, game.players, game.hierarchy, true) * gaussian(1, 0.1);
	var targetStrength = get_strength(targetId, game.players, game.hierarchy, true) * gaussian(1, 0.1);
	var victorious = callerStrength > targetStrength;
	if (victorious) {
		game.players[callerId].title = game.players[targetId].title;
		[targetId].push(get_supporters(targetId, game.players, true, false)).forEach(loserId => {
			game.players[loserId] = create_player();
		});
		assign_places(game.players, game.hierarchy, get_supporters(callerId, game.players, true, false));
		return callerName + " has usurped the position of " + game.players[callerId].title + " from " + targetName + "\n\n" + game_tostring(game);
	}
	else {
		[callerId].push(get_supporters(callerId, game.players, true, false)).forEach(loserId => {
			game.players[loserId] = create_player();
		});
		assign_places(game.players, game.hierarchy, get_supporters(targetId, game.players, true, false));
		return callerName + " died trying to overthrow " + targetName + "\nAll their fellow conspirators have been executed\n\n" + game_tostring(game);
	}
}

/**
 * /regicide appoint <promoteeId> <demoteeId>
 * @param {Object} game
 * @param {String} callerId
 * @param {String} promoteeId
 * @param {String} demoteeId
 */
function appoint(game, callerId, promoteeId, demoteeId) {
	if (!game) return "Game's not running, foo!";
	if (!is_player(callerId, game.players)) return "You're not playing, foo!";
	if (!can_move(callerId, game.players)) return "You already went, foo!";
	if (!is_player(promoteeId, game.players)) return "Can't promote someone who's not playing, foo!";
	if (!is_player(demoteeId, game.players)) return "Can't demote someone who's not playing, foo!";
	if (get_relative_class(game.players[callerId].title, game.hierarchy, 1) !== game.players[demoteeId].title) return "You can't demote " + game.players[demoteeId].name + ", foo!";
	if (get_relative_class(game.players[callerId].title, game.hierarchy, 2) !== game.players[promoteeId].title) return "You can't promote " + game.players[promoteeId].name + ", foo!";
	set_most_recent_move(callerId, game.players);

	game.players[promoteeId].title = get_relative_class(game.players[callerId].title, game.hierarchy, 1);
	game.players[demoteeId].title = get_relative_class(game.players[callerId].title, game.hierarchy, 2);

	var promoteeName = game.players[promoteeId].name;
	var demoteeName = game.players[demoteeId].name;
	var message = promoteeName + " has been promoted to the position of " + game.players[promoteeId].title;
	return message + "\n" + demoteeName + " demoted to " + promoteeName + "'s old position of " + game.players[demoteeId].title;
}
