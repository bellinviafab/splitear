const express = require('express');
const app = express();
const authRoutes = require('./routes/auth.routes.js');
const cookieParser = require('cookie-parser');
const grupoRoutes = require("./routes/grupos.routes.js");
const gastoRoutes = require("./routes/gastos.routes.js")
const usuarioRoutes = require("./routes/usuarios.routes.js")
const cors = require('cors')
const errorHandler = require('./middlewares/error.middleware.js')

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}));

app.use('/auth', authRoutes);
app.use('/grupos', grupoRoutes);
app.use('/gastos', gastoRoutes);
app.use('/usuarios', usuarioRoutes);

app.use(errorHandler)


module.exports = app;
