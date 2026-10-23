const Sequelize = require('sequelize')
const sequelize = new Sequelize(
    process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD,
    { //Pasar credenciales al .env
        dialect: 'postgres',
        host: process.env.DB_HOST,
        logging: false
    }
);

module.exports = sequelize;