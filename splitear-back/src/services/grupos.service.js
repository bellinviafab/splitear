const Grupo = require("../models/Grupo")
const User = require("../models/User")
const gastosService = require("./gastos.service")

const getGrupos = async (idUser) => { //Debe devolver grupos y el saldo neto por integrante por grupo
    const listaGrupos = await listadoGruposUsuario(idUser);

    const gruposConSaldo = [] //Inicializo arreglo vacio

    for (const grupoInstancia of listaGrupos) //Obtener el saldo neto del participante por grupo
    {
        const grupo = grupoInstancia.toJSON();

        const gastado = await gastosService.obtenerTotalGastadoUsuario(grupo.id, idUser)
        const consumido = await gastosService.obtenerTotalConsumidoUsuario(grupo.id, idUser)

        grupo.saldoNeto = gastado - consumido

        gruposConSaldo.push(grupo);
    }

    return gruposConSaldo
}

const listadoGruposUsuario = async (idUser) => {   //Reutilización para evitar repetición de codigo
    return await Grupo.findAll({
        attributes: ['id', 'nombreGrupo', 'fechaFin'],

        include: [{
            model: User,    //Como User tiene belongsToMany through pertenencia, se debe llamar al modelo final.
            where: { id: idUser },
            attributes: [],
            through: { attributes: [] } // Evita que el JSON traiga el objeto Pertenencia
        }]
    })
}

const getGrupo = async (idGrupo) => {  //Utilizado para detalleGrupo
    return await Grupo.findByPk(idGrupo, {
        attributes: ['id', 'nombreGrupo', 'descripcion', 'fechaFin']
    })
}

const getDetalleGrupo = async (idGrupo) => {
    const grupo = await getGrupo(idGrupo);  //Se debe validar primero el grupo
    if (!grupo)  //fail fast
        return null

    const integrantes = await User.findAll({
        attributes: ['id', 'name', 'last_name', 'alias'],

        include: [{
            model: Grupo,
            where: { id: idGrupo },
            attributes: [],
            through: { attributes: [] }
        }]
    })

    const gastosMap = await gastosService.obtenerGastoTotalIntegrante(idGrupo);
    const gastosPorIntegrante = Object.fromEntries(gastosMap) //Se debe pasar a un arreglo de objetos. El front no puede deserializar un map desde un json

    let sumaTotal = 0
    for (const monto of gastosMap.values()) { sumaTotal += monto }
    const gastoTotalGrupo = sumaTotal
    return { grupo, integrantes, gastosPorIntegrante, gastoTotalGrupo }
}

const validarPermiso = async (idUser, idGrupo) => {
    return await Grupo.findOne({
        where: { id: idGrupo, creadorId: idUser }
    })
}

const obtenerListadoGastosGrupo = async (idGrupo) => {
    const listadoGastos = await gastosService.obtenerGastosGrupo(idGrupo)

    return listadoGastos
}

const obtenerListadoIntegrantes = async (idGrupo) => {
    const listado = await User.findAll({
        attributes: ['id', 'name', 'last_name', 'alias'],

        include: [{
            model: Grupo,
            where: { id: idGrupo },
            attributes: [],
            through: { attributes: [] }
        }]

    })
    return listado
}


module.exports = { getGrupos, getDetalleGrupo, validarPermiso, obtenerListadoGastosGrupo, obtenerListadoIntegrantes, listadoGruposUsuario }