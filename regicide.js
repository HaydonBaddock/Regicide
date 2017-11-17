import "support_methods";

var state = {
	game_running: false,
	hierarchy: {},
	players: {}
};

exports.run = (api, event) => {
	// call appropriate method
	output = 'result of method';

	api.sendMessage(output, event.thread_id);
}

function start_game() {
	// TODO: somehow need to load all the people in the chat
	var people = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf", "Hotel", "India", "Juliett", "Kilo", "Lima", "Mike", "November", "Oscar"];

	if (people.length < 3) return "minimum players is 3";

	state.hierarchy = build_hierarchy(players);
	state.players = assign_places(state.hierarchy, people);
	state.game_running = true;
	return "game started";
}

function end_game() {
	if (!state.game_running) return "Game's not running, foo!";

	state.game_running = false;
	return "game ended";
}

function status(target) {
	if (!state.game_running) return "Game's not running, foo!";
	if (!is_player(target)) return "That's not a player, foo!";

	return state.players[target].title;
}

function pledge(caller, target) {
	if (!state.game_running) return "Game's not running, foo!";
	if (!can_move(state, caller)) return "You already went, foo!";
	if (!is_player(target)) return "That's not a player, foo!";
	set_most_recent_move(state, caller);

	var old_pledge = state.players[caller].supporting;
	state.players[caller].supporting = target;
	if (old_pledge) return caller + " is no longer supporting " + old_pledge + ", now supporting " + target;
	return caller + " now supporting " + target;
}

function unpledge(caller) {
	if (!state.game_running) return "Game's not running, foo!";
	if (!can_move(state, caller)) return "You already went, foo!";
	if (state.players[caller].supporting === null) return "You're not supporting anyone, foo!";
	set_most_recent_move(state, caller);

	var old_pledge = state.players[caller].supporting;
	state.players[caller].supporting = null;
	return caller + " is no longer supporting " + old_pledge;
}

function attack(caller, target) {
	if (!state.game_running) return "Game's not running, foo!";
	if (!can_move(state, caller)) return "You already went, foo!";
	if (!is_player(target)) return "That's not a player, foo!";
	set_most_recent_move(state, caller);

	var caller_attack_strength = get_strength(state, caller);
	var target_attack_strength = get_strength(state, target);
	var victory = caller_attack_strength > target_attack_strength; // TODO: add RNG element

	if (victory) {
		state.players[caller].title = state.players[target].title;
		state.players[target].title = lowest_place();
		return caller + " overthrew " + target + " and is now a " + state.players[caller].title;
		// TODO: What happens to person-who-went-up's old place?
	}
	else {
		state.players[caller].title = lowest_place();
		return caller + " died tring to overthrow " + target;
		// TODO: What happens to person-who-died's old place?
	}
}

function appoint(caller, target) {
	if (!state.game_running) return "Game's not running, foo!";
	if (!can_move(state, caller)) return "You already went, foo!";
	if (!is_player(target)) return "That's not a player, foo!";
	set_most_recent_move(state, caller);

	// TODO: What happens here again?
}
