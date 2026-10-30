require('dotenv').config();
const app = require('./app');
const db = require('./db');
const User = require('./models/User');
const PORT = process.env.PORT; //Pasar al .env
require('./models');


db.authenticate()
    .then(() => {
        console.log('Conexión a PostgreSQL establecida correctamente.');
        app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
    })
    .catch((err) => console.error('Error al conectar a la BD:', err));



