const Sequelize = require('sequelize')

/** Exemplo: 
* 
* const sequelize = new Sequelize('database', 'username', 'password', {
*   host: 'localhost',
*   dialect: 'mysql'|'sqlite'|'postgres'|'mssql',
* 
*   pool: {
*     max: 5,
*     min: 0,
*     acquire: 30000,
*     idle: 10000
*   },
* 
*   // SQLite only
*   storage: 'path/to/database.sqlite',
* 
*   // http://docs.sequelizejs.com/manual/tutorial/querying.html#operators
*   operatorsAliases: false
* });
* 
*/

const Schema = new Sequelize("athena", "athena", "athena", {
  host: "localhost",
  dialect: "postgres"
});

module.exports = {
  Schema
}