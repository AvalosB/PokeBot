
exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('trainer_tracker').del()
    .then(function () {
      // Inserts seed entries
      return knex('trainer_tracker').insert([
        {server: 'secret_server',
          trainer: 'SecretSpook', 
          name: 'test', 
          sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/39.png", 
          level: 3, 
          health: 75,
          attack: 80,
          defence: 90,
          day_caught: 4}
      ]);
    });
};
