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
 * @param {String} person Name of the person to determine can move or not.
 * @param {Object} players Details about the players of the game.
 * @returns {Boolean} true if the person can move, otherwise false.
 */
function can_move(person, players) {
	var today = new Date().setHours(0,0,0,0);
	var last_move = players[person].last_move;
	return last_move < today;
}

/**
 * Updates the 'last_move' field for a given person.
 * @param {String} person Name of the person to update most recent move for.
 * @param {Object} players Details about the players of the game.
 */
function set_most_recent_move(person, players) {
	var today = new Date().setHours(0,0,0,0);
	players[person].last_move = today;
}

/**
 * Determines if the given name is present in the players.
 * @param {String} person Name of a person to check exists.
 * @param {Object} players Details about the players of the game.
 * @returns {Boolean} true if person is a player, otherwise false.
 */
function is_player(person, players) {
	return person in players;
}

/**
 * Gets the strength of a given person based on their status,
 * plus the statuses of all their supporters.
 * @param {String} person Name of the person to calculate strength of.
 * @param {Object} players Details about the players of the game.
 * @param {Object} hierarchy Details about the positions that can be held.
 * @returns {Number} The strength of the given person plus all their supporters.
 */
function get_strength(person, players, hierarchy) {
	var supporters = get_supporters(person, players);
	var strength = hierarchy.val([players[person].title]).attack;
	supporters.forEach(supporter => {
		strength += hierarchy.val([players[supporter].title]).attack;
	});
	return strength;
}

/**
 * Gets all the people supporting a given person.
 * @param {String} person Name of the person to retrieve supporters of.
 * @param {Object} players Details about the players of the game.
 * @returns {Array<String>} Names of supporters of the given person.
 */
function get_supporters(person, players) {
	var supporters = [];
	for (var player in players) {
		if (players[player].supporting === person) {
			supporters.push(player);
		}
	}

	var child_supporters = [];
	for (var player in supporters) {
		child_supporters.push(get_supporters(state, player))
	}
	supporters.push(child_supporters);

	return supporters;
}

/**
 * Gets the name of a class a given number of places from a person.
 * @param {String} person Name of person to find position relative to.
 * @param {Object} hierarchy Details about the positions that can be held.
 * @param {Number} move Number of positions to move (positive moves toward Peasant, negative toward King).
 * @returns {String} The title of another societal position.
 */
function get_relative_class(person, hierarchy, move) {
	var persons_class = hierarchy.keys().indexOf[person.title];
	var num_classes = hierarchy.length();
	var other_class = persons_class + move;
	if (other_class < 0 || other_class >= num_classes)
		return null;
	return hierarchy.keys()[other_class];
}

/**
 * Creates an object to represent all players of the game with default values for all their stats.
 * @param {Array<String>} people Names of people playing the game.
 * @returns {Object} Details about all the game's players.
 */
function create_players(people) {
	shuffle(people);
	var players = {};
	people.forEach(person => {
		players[person] = {
			title: null,
			supporting: null,
			last_move: new Date(0)
		}
	});
}

/**
 * Builds the game's heirarchy (tiers and number of positions within those tiers). 
 * @param {Number} num_players The number of players in the game.
 * @returns {Array<Object>} Custom hierarchy for this number of people.
 */
function build_hierarchy(num_players) {
	var i, rungs, rung, useable_positions, position, placements, hierarchy, title;

	// Determines the number of positions in the hierarchy (2 would mean Kings and Peasants only)
	i = num_players;
	rungs = 0;
	while (i > 0) {
		rungs += 1;
		i -= rungs;
	}

	// builds an array of titles that will be used
	useable_positions = [];
	positions.forEach(position => {
		if (position.order < rungs) {
			useable_positions.push(position.name);
		}
	});

	// Determines the number of people at each position
	placements = new Array(rungs).fill(0);
	rung = 0;
	for (i = 0; i < num_players; i++) {
		placements[rung] += 1;
		rung += 1;
		if (rung === rungs) {
			rung = 0;
			rungs -= 1;
		}
	}
	placements.reverse();

	// Builds the hierarchy object
	hierarchy = make_ordered_hash();
	for (i = 0; i < useable_positions.length; i++) {
		title = useable_positions[i];
		hierarchy.push(useable_positions[i], {
			attack: placements.length - i,
			spaces: placements[i]
		});
	}
	return hierarchy;
}

/**
 * Assigns players positions at random, but taking their current title and who they support into account.
 * @param {Object} players People to assign to positions.
 * @param {Object} hierarchy Details about the positions that can be held.
 * @param {Array<String>} victors People to prioritise.
 */
function assign_places(players, hierarchy, victors) {
	for (var i = 0; i < hierarchy.length(); i++) {
		var y = i + 1;
		while (people_in_position(players, hierarchy.keys()[i].title).length < hierarchy.keys()[i].spaces) {
			if (y < hierarchy.length()) {
				var people = people_in_position(players, hierarchy.keys()[y].title);
				if (people.length > 0) {
					var prioritised = matching_elemets(people, victors);
					if (prioritised.length > 0)
						players[shuffle(prioritised)[0]].title = hierarchy.keys()[i];
					else
						players[shuffle(people)[0]].title = hierarchy.keys()[i];
				}
				else {
					y += 1;
				}
			}
			else {
				var people = people_in_position(players, null);
				players[people[0]].title = hierarchy.keys()[i];
			}
		}
	}
}

/**
 * Gets all the people with the given position.
 * @param {Object} players Details about the players of the game.
 * @param {String} title Class to find members of.
 * @returns {Array<String>} Names of all people in that class.
 */
function people_in_position(players, title) {
	var people = [];
	for (var player in players) {
		if (players[player].title === title) {
			people.push(player);
		}
	}
	return people;
}

/**
 * Returns an array of all common elements.
 * @param {Array} arr1 Array one.
 * @param {Array} arr2 Array two.
 * @returns {Array} Common elements of the two arrays.
 */
function matching_elemets(arr1, arr2) {
	var ret = [];
	for (var i in arr1) {
		if (arr2.indexOf(arr1[i]) > -1) {
			ret.push(arr1[i]);
		}
	}
}

/**
 * Shuffles a given array.
 * Uses the Fisher-Yates (aka Knuth) Shuffle.
 * @param {Array} array Array to be suffled.
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
	if(use_last) {
		y1 = y2;
		use_last = false;
	}
	else {
		var x1, x2, w;
		do {
			x1 = 2.0 * Math.random() - 1.0;
			x2 = 2.0 * Math.random() - 1.0;
			w  = x1 * x1 + x2 * x2;               
		} while( w >= 1.0);
		w = Math.sqrt((-2.0 * Math.log(w))/w);
		y1 = x1 * w;
		y2 = x2 * w;
		use_last = true;
	}

	var retval = mean + stdev * y1;
	if(retval > 0) 
		return retval;
	return -retval;
}

/**
 * Creates an object similar to Javascript Objects except keys hold their order.
 * @returns {Object} A new empty Ordered Hash.
 */
function make_ordered_hash() {
	var keys = [];
    var vals = {};
    return {
        push: function(k,v) {
            if (!vals[k]) keys.push(k);
            vals[k] = v;
        },
        insert: function(pos,k,v) {
            if (!vals[k]) {
                keys.splice(pos,0,k);
                vals[k] = v;
            }
        },
        val: function(k) { return vals[k] },
        length: function() { return keys.length },
        keys: function() { return keys },
        values: function() { return vals }
    }
}
