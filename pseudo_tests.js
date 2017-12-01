var helpers = require("./support_methods");

function assign_places_test() {
    var people = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf", "Hotel", "India", "Juliett", "Kilo", "Lima", "Mike", "November", "Oscar"];
    var hierarchy = helpers.build_hierarchy(people.length);
    var players = helpers.create_players(people);
    helpers.assign_places(players, hierarchy, []);

    var king = helpers.people_in_position(players, "King")[0];
    var lord = helpers.people_in_position(players, "Lord")[0];
    var bishop = helpers.people_in_position(players, "Bishop")[0];
    var knight = helpers.people_in_position(players, "Knight")[0];
    var peasant = helpers.people_in_position(players, "Peasant")[0];

    players[king].title = null;

    helpers.assign_places(players, hierarchy, [lord, bishop, peasant]);

    console.info("King", players[lord].title)
    console.info("Lord", players[bishop].title)
    console.info("Bishop", players[knight].title)
    console.info("Knight", players[peasant].title)
    console.info("Peasant", players[king].title)
}

assign_places_test();
