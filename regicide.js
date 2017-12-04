
// TODO: There's got to be a better way to do this...
var helpers = require("./support_methods");
var can_move = helpers.can_move;
var set_most_recent_move = helpers.set_most_recent_move;
var is_player = helpers.is_player;
var get_strength = helpers.get_strength;
var get_supporters = helpers.get_supporters;
var get_relative_class = helpers.get_relative_class;
var create_players = helpers.create_players;
var create_player = helpers.create_player;
var build_hierarchy = helpers.build_hierarchy;
var assign_places = helpers.assign_places;
var state_tostring = helpers.state_tostring;
var gaussian = helpers.gaussian;

var state = {
	hierarchy: null,
	players: null,
	game_running: false
};

exports.run = (api, event) => {
	// TODO: call appropriate method
	output = 'result of method';

	api.sendMessage(output, event.thread_id);
}

function start_game() {
	// TODO: somehow need to load all the people in the chat
	var people = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf", "Hotel", "India", "Juliett", "Kilo", "Lima", "Mike", "November", "Oscar"];

	if (people.length < 6) return "minimum 6 players";

	state.hierarchy = build_hierarchy(people.length);
	state.players = create_players(people);
	assign_places(state.players, state.hierarchy);
	state.game_running = true;
	return "game started\n\n" + state_tostring(state);
}

function end_game() {
	if (!state.game_running) return "Game's not running, foo!";

	state.hierarchy = null;
	state.players = null;
	state.game_running = false;
	return "game ended";
}

function join_game(caller) {
	if (!state.game_running) return "Game's not running, foo!";
	if (is_player(caller, state.players)) return "You're already in the game, foo!";

	var num_players = Object.keys(state.players).length + 1;
	state.hierarchy = build_hierarchy(num_players);
	state.players[caller] = create_player();
	assign_places(state.players, state.hierarchy);
	return caller + " has joined the game\n\n" + state_tostring(state);
}

function hierarchy() {
	if (!state.game_running) return "Game's not running, foo!";

	return state_tostring(state);
}

function supporters(target) {
	if (!state.game_running) return "Game's not running, foo!";
	if (!is_player(target, state.players)) return "That's not a player, foo!";

	var message = target + "'s supporters: " + get_supporters(target, state.players).join(", ");
	return message + "\nTotal Strength: " + get_strength(target, state.players, state.hierarchy);
}

function pledge(caller, target) {
	if (!state.game_running) return "Game's not running, foo!";
	if (!can_move(caller, state.players)) return "You already went, foo!";
	if (!is_player(target, state.players)) return "That's not a player, foo!";
	set_most_recent_move(caller, state.players);

	var old_pledge = state.players[caller].supporting;
	state.players[caller].supporting = target;
	if (old_pledge) return caller + " has abandoned " + old_pledge + " in favor of " + target;
	return caller + " has pledged their support to " + target;
}

function unpledge(caller) {
	if (!state.game_running) return "Game's not running, foo!";
	if (!can_move(caller, state.players)) return "You already went, foo!";
	if (state.players[caller].supporting === null) return "You're not supporting anyone, foo!";
	set_most_recent_move(caller, state.players);

	var old_pledge = state.players[caller].supporting;
	state.players[caller].supporting = null;
	return caller + " has disavowed " + old_pledge;
}

function attack(caller, target) {
	if (!state.game_running) return "Game's not running, foo!";
	if (!can_move(caller, state.players)) return "You already went, foo!";
	if (!is_player(target, state.players)) return "That's not a player, foo!";
	set_most_recent_move(caller, state.players);

	var caller_attack_strength = get_strength(state, caller) * gaussian(1, 0.1);
	var target_attack_strength = get_strength(state, target) * gaussian(1, 0.1);
	var victorious = caller_attack_strength > target_attack_strength;
	if (victorious) {
		state.players[caller].title = state.players[target].title;
		[target].push(get_supporters(target, state.players)).forEach(loser => {
			state.players[loser] = create_player();
		});
		assign_places(state.players, state.hierarchy, get_supporters(caller, state.players));
		return caller + " has usurped the position of " + state.players[caller].title + " from " + target + "\n\n" + state_tostring(state);
	}
	else {
		[caller].push(get_supporters(caller, state.players)).forEach(loser => {
			state.players[loser] = create_player();
		});
		assign_places(state.players, state.hierarchy, get_supporters(target, state.players));
		return caller + " died trying to overthrow " + target + "\nAll their fellow conspirators have been executed\n\n" + state_tostring(state);
	}
}

function appoint(caller, promotee, demotee) {
	if (!state.game_running) return "Game's not running, foo!";
	if (!can_move(caller, state.players)) return "You already went, foo!";
	if (!is_player(promotee, state.players)) return "That's not a player, foo!";
	if (!is_player(demotee, state.players)) return "That's not a player, foo!";
	if (get_relative_class(state.players[caller].title, state.hierarchy, 1) !== state.players[demotee].title) return "You can't demote " + demotee + ", foo!";
	if (get_relative_class(state.players[caller].title, state.hierarchy, 2) !== state.players[promotee].title) return "You can't promote " + promotee + ", foo!";
	set_most_recent_move(caller, state.players);

	state.players[promotee].title = get_relative_class(state.players[caller].title, state.hierarchy, 1);
	state.players[demotee].title = get_relative_class(state.players[caller].title, state.hierarchy, 2);
	var message = promotee + " has been promoted to the position of " + state.players[promotee].title + "\n";
	return message + demotee + " demoted to " + promotee + "'s old position of " + state.players[demotee].title;
}
