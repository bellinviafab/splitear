const Sequelize = require('sequelize')

const opciones = {
    dialect: 'postgres',
    logging: false,
    // Los Postgres gestionados (Render, Railway, Neon, Supabase, etc.) exigen SSL
    dialectOptions: process.env.DB_SSL === 'true'
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
}

const sequelize = process.env.DATABASE_URL
    ? new Sequelize(process.env.DATABASE_URL, opciones)
    : new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        {
            ...opciones,
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 5432,
        }
    )

module.exports = sequelize