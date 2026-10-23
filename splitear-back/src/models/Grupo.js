const S = require("sequelize");
const db = require("../db");

class Grupo extends S.Model { };

Grupo.init({
    nombreGrupo: {
        type: S.STRING,
        allowNull: false,
    },
    fechaFin: {
        type: S.DATE,
        allowNull: true,
    },
    /*image: {
        type: S.STRING,
        allowNull: true
    },*/
    descripcion: {
        type: S.STRING,
        allowNull: true
    }
}, { sequelize: db, modelName: 'grupo', paranoid: true })//A partir de un destroy, cualquier consulta que se le haga es ignorada si paranoid:true

module.exports = Grupo;