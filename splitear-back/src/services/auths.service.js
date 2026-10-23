const Pertenencia = require("../models/Pertenencia")
const Grupo = require("../models/Grupo")

const validarPertenencia = async (idUser, idGrupo) => {
    return await Pertenencia.findOne({ where: { integranteId: idUser, grupoId: idGrupo } })
}

module.exports = { validarPertenencia }