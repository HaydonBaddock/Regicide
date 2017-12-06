/**
 * All posible positions in the hierarchy, can be amended.
 * Ranked in decreasing order of priority.
 */
const positions = [
	{
		name: 'King',
		order: 0
	},
	{
		name: 'Lord',
		order: 3
	},
	{
		name: 'Bishop',
		order: 4
	},
	{
		name: 'Knight',
		order: 2
	},
	{
		name: 'Peasant',
		order: 1
	}
];

/**
 * Determines if the player may move.
 * @param {String} personId ID of the person to determine can move or not.
 * @param {Object} players Details about the players of the game.
 * @returns {Boolean} true if the person can move, otherwise false.
 */
function can_move(personId, players) {
	var today = new Date().setHours(0,0,0,0);
	var lastMove = players[personId].lastMove;
	return lastMove < today;
}

/**
 * Updates the 'last_move' field for a given person.
 * @param {String} personId ID of the person to update most recent move for.
 * @param {Object} players Details about the players of the game.
 */
function set_most_recent_move(personId, players) {
	var today = new Date().setHours(0,0,0,0);
	players[personId].last_move = today;
}

/**
 * Determines if the given name is present in the players.
 * @param {String} personId Name of a person to check exists.
 * @param {Object} players Details about the players of the game.
 * @returns {Boolean} true if person is a player, otherwise false.
 */
function is_player(personId, players) {
	return person in players;
}

/**
 * Gets the strength of a given person based on their status,
 * plus the statuses of all their supporters.
 * @param {String} personId ID of the person to calculate strength of.
 * @param {Object} players Details about the players of the game.
 * @param {Object} hierarchy Details about the positions that can be held.
 * @param {Boolean} actual Whether to get actual strength or purported strength.
 * @returns {Number} The strength of the given person plus all their supporters.
 */
function get_strength(personId, players, hierarchy, actual) {
	var supporters = get_supporters(personId, players, actual, false);
	var strength = hierarchy.value([players[personId].title]).attack;
	supporters.forEach(supporter => {
		strength += hierarchy.value([players[supporter].title]).attack;
	});
	return strength;
}

/**
 * Gets all the people supporting a given person.
 * @param {String} personId ID of the person to retrieve supporters of.
 * @param {Object} players Details about the players of the game.
 * @param {Boolean} actual Whether to use actual supporters or claimed supporters.
 * @param {Boolean} pretty True if you want names, false for unique IDs.
 * @returns {Array<String>} Names of supporters of the given person.
 */
function get_supporters(personId, players, actual, pretty) {
	var supporters = [];
	for (var player in players) {
		if ((actual && players[player].actual_supportee === personId)
		|| (!actual && players[player].claimed_supportee === personId))
			supporters.push(player);
	}

	var childSupporters = [];
	for (var player in supporters) {
		childSupporters.push(get_supporters(player, players, actual, false))
	}
	supporters.push(childSupporters);

	if (pretty) swap_ids_for_names(players, supporters)
	return supporters;
}

/**
 * Gets the name of a class a given number of places from a person.
 * @param {String} title title to find position relative to.
 * @param {Object} hierarchy Details about the positions that can be held.
 * @param {Number} move Number of positions to move (positive moves toward Peasant, negative toward King).
 * @returns {String} The title of another societal position.
 */
function get_relative_class(title, hierarchy, move) {
	var indexOfPersonsClass = hierarchy.indexOf(title);
	var numClasses = hierarchy.length();
	var indexOfOtherClass = indexOfPersonsClass + move;
	if (indexOfOtherClass < 0 || indexOfOtherClass >= numClasses)
		return null;
	return hierarchy.keyAt(indexOfOtherClass);
}

/**
 * Creates an object to represent all players of the game with default values for all their stats.
 * @param {Object} people Names of people playing the game.
 * @returns {Object} Details about all the game's players.
 */
function create_players(people) {
	var uniqueIds = Object.keys(people);
	shuffle(uniqueIds);
	var players = {};
	uniqueIds.forEach(id => {
		players[id] = create_player(people[id].name);
	});
	return players;
}

/**
 * Creates a blank person object.
 */
function create_player(personName) {
	return {
		name: personName,
		title: null,
		actual_supportee: null,
		claimed_supportee: null,
		last_move: new Date(0)
	};
}

/**
 * Builds the game's heirarchy (tiers and number of positions within those tiers). 
 * @param {Number} numPlayers The number of players in the game.
 * @returns {Array<Object>} Custom hierarchy for this number of people.
 */
function build_hierarchy(numPlayers) {

	// Determines the number of positions in the hierarchy (2 would mean Kings and Peasants only)
	var i = numPlayers;
	var rungs = 0;
	while (i > 0) {
		rungs += 1;
		i -= rungs;
	}

	// builds an array of titles that will be used
	var useablePositions = [];
	positions.forEach(position => {
		if (position.order < rungs) {
			useablePositions.push(position.name);
		}
	});

	// Determines the number of people at each position
	var placements = new Array(rungs).fill(0);
	var rung = 0;
	for (i = 0; i < numPlayers; i++) {
		placements[rung] += 1;
		rung += 1;
		if (rung === rungs) {
			rung = 0;
			rungs -= 1;
		}
	}
	placements.reverse();

	// Builds the hierarchy object
	var hierarchy = new OrderedHash();
	for (i = 0; i < useablePositions.length; i++) {
		var title = useablePositions[i];
		hierarchy.push(useablePositions[i], {
			attack: placements.length - i,
			spaces: placements[i]
		});
	}
	return hierarchy;
}

/**
 * Assigns players positions at random, but taking their current title and who they support into account.
 * This is used to maintain a pyramid structure for the hierarchy.
 * @param {Object} players People to assign to positions.
 * @param {Object} hierarchy Details about the positions that can be held.
 * @param {Array<String>} victors People to prioritise.
 */
function assign_places(players, hierarchy, victors=[]) {
	shuffle(victors);
	for (var i = 0; i < hierarchy.length(); i++) {
		var y = i + 1;
		while (people_in_position(players, hierarchy.keyAt(i)).length < hierarchy.valueAt(i).spaces) {
			if (y < hierarchy.length()) {
				var people = shuffle(people_in_position(players, hierarchy.keyAt(y)));
				if (people.length > 0) {
					var prioritised = matching_elements(people, victors);
					if (prioritised.length > 0)
						players[prioritised[0]].title = hierarchy.keyAt(i);
					else
						players[people[0]].title = hierarchy.keyAt(i);
				}
				else {
					y += 1;
				}
			}
			else {
				var people = shuffle(people_in_position(players, null));
				players[people[0]].title = hierarchy.keyAt(i);
			}
		}
	}
}

/**
 * Gets all the people with the given position.
 * @param {Object} players Details about the players of the game.
 * @param {String} title Class to find members of.
 * @param {Boolean} pretty True if you want names, false for unique IDs.
 * @returns {Array<String>} Unique IDs of all people in that class.
 */
function people_in_position(players, title, pretty=false) {
	var people = [];
	for (var player in players) {
		if (players[player].title === title) {
			people.push(player);
		}
	}
	if (pretty) swap_ids_for_names(players, people)
	return people;
}

/**
 * Generates a string to represent the current state of the game.
 * @param {Object} game The state of the game including players and hierarchy.
 */
function game_tostring(game) {
	var str = "";
	game.hierarchy.keys().forEach(title => {
		var people = people_in_position(game.players, title, true);
		str += title + Array(11 - title.length).join(" ") + people.join(", ") + "\n";
	});
	return str;
}

/**
 * Swaps unique IDs out for the names of the people they represent.
 * In-place.
 * @param {Object} players Details about players of the game.
 * @param {Array<String>} ids Array of unique IDs.
 * @returns {Array<String>} Array of names.
 */
function swap_ids_for_names(players, ids) {
	for (var i = 0; i < ids.length; i++) {
		ids[i] = players[ids[i]].name;
	}
}

/**
 * Returns an array of all common elements.
 * @param {Array} arr1 Array one.
 * @param {Array} arr2 Array two.
 * @returns {Array} Common elements of the two arrays.
 */
function matching_elements(arr1, arr2) {
	var matches = [];
	for (var i in arr1) {
		if (arr2.indexOf(arr1[i]) > -1) {
			matches.push(arr1[i]);
		}
	}
	return matches;
}

/**
 * Shuffles a given array, in-place, but returns the shuffled product too.
 * Uses the Fisher-Yates (aka Knuth) Shuffle.
 * @param {Array} array Array to be suffled.
 * @returns {Array} The same array, shuffled.
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

/**
 * Produces a random number with Gaussian Distribution using the given mean and standard deviation.
 * @param {Number} mean The mean value for the distribution.
 * @param {Number} stdev The standard deviation for the distribution.
 * @returns {Number} A random number with Gaussian Distribution.
 */
function gaussian(mean, stdev) {
	var y2;
	var use_last = false;
	var y1;
	if (use_last) {
		y1 = y2;
		use_last = false;
	}
	else {
		var x1, x2, w;
		do {
			x1 = 2.0 * Math.random() - 1.0;
			x2 = 2.0 * Math.random() - 1.0;
			w  = x1 * x1 + x2 * x2;               
		} while (w >= 1.0);
		w = Math.sqrt((-2.0 * Math.log(w))/w);
		y1 = x1 * w;
		y2 = x2 * w;
		use_last = true;
	}

	var retval = mean + stdev * y1;
	return retval > 0 ? retval : -retval;
}

/**
 * An object similar to regular JSON objects except it maintains the order of added properties,
 * if you use the proper methods.
 */
class OrderedHash {
	constructor() {
		this.keys = [];
		this.vals = {};
	}
	
	push(k, v) {
		if (!this.vals[k]) this.keys.push(k);
		this.vals[k] = v;
	}

	insert(pos, k, v) {
		if (!this.vals[k]) {
			this.keys.splice(pos,0,k);
			this.vals[k] = v;
		}
	}

	value(k) { return this.vals[k] }
	length() { return this.keys.length }
	keys_() { return this.keys }
	values() { return this.vals }
	keyAt(i) { return this.keys[i] }
	valueAt(i) { return this.vals[this.keys[i]] }
	indexOf(k) { return this.keys.indexOf(k) }
}

module.exports = {
	can_move: can_move,
	set_most_recent_move: set_most_recent_move,
	is_player: is_player,
	get_strength: get_strength,
	get_supporters: get_supporters,
	get_relative_class: get_relative_class,
	create_player: create_player,
	create_players: create_players,
	build_hierarchy: build_hierarchy,
	assign_places: assign_places,
	game_tostring: game_tostring,
	gaussian: gaussian
}
