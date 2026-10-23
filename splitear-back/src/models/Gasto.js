const S = require("sequelize");
const db = require("../db");

class Gasto extends S.Model { };

Gasto.init({
    monto: {
        type: S.DECIMAL(10, 2),
        unique: false,
        allowNull: false
    },
    descripcion: {
        type: S.STRING,
        unique: false,
        allowNull: true
    },
    idCreadorGasto: {
        type: S.INTEGER,
        allowNull: false
    },
    idGrupo: {
        type: S.INTEGER,
        allowNull: false
    }
}, { sequelize: db, modelName: "gasto", paranoid: true });

module.exports = Gasto;