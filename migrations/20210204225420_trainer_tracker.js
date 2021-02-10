
exports.up = function(knex) {
    return knex.schema.createTable('trainer_tracker', table => {
        table.increments('user_id'); // adds an auto incrementing PK column
        table.string('server');
        table.string('trainer');
	table.string('trainer_id');
	table.integer('money');
        table.string('name');
        table.string('sprite');
        table.integer('level');
        table.integer('health');
        table.integer('attack');
        table.integer('defence');
        table.integer('day_caught');
        table.integer('wins');
      });
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('trainer_tracker');
};
