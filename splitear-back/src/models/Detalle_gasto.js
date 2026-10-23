const S = require("sequelize");
const db = require("../db");

class Detalle_gasto extends S.Model { };

Detalle_gasto.init({
    monto: {
        type: S.DECIMAL(10, 2),
        allowNull: false,
        unique: false
    },
    idGasto: {  //Se definen explicitamente para evitar el allowNull
        type: S.INTEGER,
        allowNull: false
    },
    idParticipante: {
        type: S.INTEGER,
        allowNull: false
    }
}, {
    sequelize: db, modelName: "detalle_gasto", indexes: [
        {
            unique: true,
            fields: ['idGasto', 'idParticipante']
        }
    ]
    , paranoid: true
})

module.exports = Detalle_gasto;
