require('dotenv').config();
const app = require('./app');
const db = require('./db');
const User = require('./models/User');
const PORT = process.env.PORT; //Pasar al .env
require('./models');


db.sync({ alter: true }) //Cambiar a false
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Servidor escuchando en el puerto ${PORT} y DB conectada`)
        })
    })
    .catch((error) => {
        console.error('El error al sincronizar la bd fue: ', error)
    })



