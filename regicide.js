import "support_methods";

var state = {
	game_running: false,
	hierarchy: null,
	players: null
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
	assign_places(state.players, state.hierarchy, []);
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

	var caller_attack_strength = get_strength(state, caller) * gaussian(1, 0.1);
	var target_attack_strength = get_strength(state, target) * gaussian(1, 0.1);
	var victory = caller_attack_strength > target_attack_strength;

	if (victory) {
		state.players[caller].title = state.players[target].title;
		[target].push(get_supporters(target, state.players)).forEach(loser => {
			state.players[loser].title = null;
		});
		assign_places(state.players, state.hierarchy, get_supporters(caller, state.players));
		return caller + " overthrew " + target + " and is now a " + state.players[caller].title;		
	}
	else {
		[caller].push(get_supporters(caller, state.players)).forEach(loser => {
			state.players[loser].title = null;
		});
		assign_places(state.players, state.hierarchy, get_supporters(target, state.players));
		return caller + " died trying to overthrow " + target + " and all their fellow conspirators have been executed";
	}
}

function appoint(caller, promotee, demotee) {
	if (!state.game_running) return "Game's not running, foo!";
	if (!can_move(state, caller)) return "You already went, foo!";
	if (!is_player(promotee)) return "That's not a player, foo!";
	if (!is_player(demotee)) return "That's not a player, foo!";
	// check positions of promotee and demotee relative to caller are allowed for this command
	set_most_recent_move(state, caller);

	// TODO: What happens here again?
}
