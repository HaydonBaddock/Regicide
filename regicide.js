import "support_methods";

var is_game_running = false;
var state = {
	hierarchy: {},
	players: {}
};

exports.run = (api, event) => {
	// do some stuff

	api.sendMessage('you win! merrrr', event.thread_id);
}

function start_game() {
	// TODO: somehow need to load all the people in the chat
	var people = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf", "Hotel", "India", "Juliett", "Kilo", "Lima", "Mike", "November", "Oscar"];

	// TODO: tell them they don't have enough players
	if (people.length < 3) return "minimum players is 3";

	state.hierarchy = build_hierarchy(players);
	state.players = assign_places(state.hierarchy, people);

	is_game_running = true;
}

function end_game() {
	is_game_running = false;
}

function appoint(caller, target) {
	if (!is_game_running) return "Start the game, foo!"; // TODO
	if (!can_move(state, caller)) return "You already went, foo!" // TODO
}

function execute(caller, target) {
	if (!is_game_running) return "Start the game, foo!"; // TODO
	if (!can_move(state, caller)) return "You already went, foo!" // TODO
}

function pledge(caller, target) {
	if (!is_game_running) return "Start the game, foo!"; // TODO
	if (!can_move(state, caller)) return "You already went, foo!" // TODO
}

function unpledge(caller, target) {
	if (!is_game_running) return "Start the game, foo!"; // TODO
	if (!can_move(state, caller)) return "You already went, foo!" // TODO
}

function attack(caller, target) {
	if (!is_game_running) return "Start the game, foo!"; // TODO
	if (!can_move(state, caller)) return "You already went, foo!" // TODO
}
