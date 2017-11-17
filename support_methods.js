/**
 * All posible positions in the hierarchy, can be amended.
 * Ranked in decreasing order of priority.
 */
const positions = {
	0: 'King',
	2: 'Lord',
	4: 'Bishop',
	3: 'Knight',
	1: 'Peasant'
};

/**
 * Determines if the player may move, and updates 'last_move' if they can.
 * @param {Object} state Game state, including hierarchy and players.
 * @param {String} caller Name of the person to calculate strength of.
 * @returns {Boolean} true if the caller can move, otherwise false.
 */
function can_move(state, caller) {
	var today = new Date().setHours(0,0,0,0);
	var last_move = state.players[caller]['last_move'];
	if (last_move < today) {
		state.players[caller]['last_move'] = today;
		return true;
	}
	return false;
}

/**
 * Gets the strength of a given person based on their status,
 * plus the statuses of all their supporters.
 * @param {Object} state Game state, including hierarchy and players.
 * @param {String} caller Name of the person to calculate strength of.
 * @returns {Number} The strength of the given person plus all their supporters.
 */
function get_strength(state, caller) {
	var supporters = get_supporters(state, caller);
	var strength = state.hierarchy[state.players[caller]['title']]['attack'];
	for (var supporter in supporters) {
		strength += state.hierarchy[state.players[supporter]['title']]['attack'];
	};
	return strength;
}

/**
 * Gets all the people supporting a given person.
 * @param {Object} state Game state, including hierarchy and players.
 * @param {String} caller Name of the person to calculate strength of.
 * @returns {Array<String>} Names of supports of the given person.
 */
function get_supporters(state, caller) {
	var supporters = [];
	for (var person in state.players) {
		if (state.players[person]['supporting'] === caller) {
			supporters.push(person);
		}
	}

	var child_supporters = [];
	for (var person in supporters) {
		child_supporters.push(get_supporters(state, person))
	}
	supporters.push(child_supporters);
	return supporters;
}

/**
 * Builds the game's heirarchy (tiers and number of positions within those tiers). 
 * @param {Number} num_players The number of players in the game.
 * @returns {Object} Custom hierarchy for this number of people.
 */
function build_hierarchy(num_players) {

	// Gets the number of positions in the hierarchy (2 would mean Kings and Peasants only)
	var i = num_players;
	var rungs = 0;
	while (i > 0) {
		rungs += 1;
		i -= rungs;
	}

	// builds an object containing just the positions that will be used
	var useable_positions = {};
	for (var key in positions) {
		if (key < rungs)
			useable_positions[key] = positions[key];
	}

	// Determines the number of people at each position
	i = num_players;
	var placements = new Array(rungs).fill(0);
	var rung = 0;
	while (i > 0) {
		placements[rung] += 1;
		rung += 1;

		if (rung === rungs) {
			rung = 0;
			rungs -= 1;
		}

		i -= 1;
	}
	placements.reverse();

	// Builds the hierarchy object
	var hierarchy = {};
	for (i in [...Array(placements.length).keys()]) {
		var title = useable_positions[i];
		hierarchy[title] = {
			'attack': placements.length - i,
			'spaces': placements[i]
		}
	}
	return hierarchy;
}

/**
 * Assigns players positions at random.
 * @param {Object} hierarchy Possible positions and the number of people at each.
 * @param {Array<String>} people People to assign to positions.
 * @returns {Object} People with assigned positions and everything else they need.
 */
function assign_places(hierarchy, people) {
	var players = {};
	people = shuffle(people);
	for (var title in hierarchy) {
		for (var i in [...Array(hierarchy[title].spaces).keys()]) {
			players[people.pop()] = {
				'title': title,
				'supporting': null,
				'last_move': new Date(0),
				'score': 0
			};
		}
	}
	return players;
}

/**
 * Creates a shuffled version of a given array.
 * Uses the Fisher-Yates (aka Knuth) Shuffle.
 * @param {Array} array Array to be suffled.
 * @returns {Array} Shuffled array.
 */
function shuffle(array) {
	var currentIndex = array.length, temporaryValue, randomIndex;
	while (0 !== currentIndex) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}
	return array;
}
