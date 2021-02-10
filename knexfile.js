// Update with your config settings.

module.exports = {

    development: {
      client: 'postgres',
      connection: {
        host: '127.0.0.1',
        database: 'poke_tracker',
        user:     'postgres',
        password: '123'
      }
    },
  
    staging: {
      client: 'postgresql',
      connection: {
        database: 'poke_tracker',
        user:     'Brian',
        password: '123'
      },
      pool: {
        min: 2,
        max: 10
      },
      migrations: {
        tableName: 'knex_migrations'
      }
    },
  
    production: {
      client: 'postgresql',
      connection: {
        database: 'my_db',
        user:     'username',
        password: 'password'
      },
      pool: {
        min: 2,
        max: 10
      },
      migrations: {
        tableName: 'knex_migrations'
      }
    }
  
  };