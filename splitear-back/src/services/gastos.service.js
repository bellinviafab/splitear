const Gasto = require("../models/Gasto")
const Detalle_gasto = require("../models/Detalle_gasto.js")
const Pertenencia = require("../models/Pertenencia.js")
const Grupo = require("../models/Grupo.js")
const User = require("../models/User.js")
const s = require('../db.js')
const sequelize = require("sequelize")
const { aCentavos, aPesos, repartirEnCentavos, liquidar } = require('../utils/dinero.js')

// Crea el gasto y su reparto en una transacción. Recibe el monto ya validado y en centavos.
async function procesarYCrearGasto(idGrupo, idsParticipantes, montoCentavos, idPagador, descripPago) {
    return await s.transaction(async (t) => { // Transacción administrada: si algo falla, Sequelize hace el rollback
        const nuevoGasto = await Gasto.create({
            monto: aPesos(montoCentavos), descripcion: descripPago, idCreadorGasto: idPagador, idGrupo: idGrupo
        },
            { transaction: t }
        );

        const cuotas = repartirEnCentavos(montoCentavos, idsParticipantes.length)
        const arrayRepartoParticipantes = idsParticipantes.map((idParticipante, i) => ({
            monto: aPesos(cuotas[i]), idGasto: nuevoGasto.id, idParticipante
        }))

        return await Detalle_gasto.bulkCreate(arrayRepartoParticipantes, { transaction: t })
    })
}

const obtenerLiquidacion = async (idGrupo) => {  //Recorrer arreglos con find dentro de un for me daría complejidad cuadratica
    const grupo = await Grupo.findByPk(idGrupo)
    if (!grupo) {
        const error = new Error("Grupo inexistente")
        error.statusCode = 404
        throw error;
    }
    const listaParticipantes = await Pertenencia.findAll({  //Se debe comenzar con un findAll ya que puede haber participantes que nunca aportaron y son deudores totales
        where: {
            grupoId: idGrupo
        }
    })
    const gastoTotalIntegrante = await obtenerGastoTotalIntegrante(idGrupo);
    const participacionesPorIntegrante = await obtenerParticipacionesPorIntegrante(idGrupo)

    // Además de los integrantes actuales, entra cualquiera que haya pagado o consumido en el grupo:
    // si alguien dejó el grupo con gastos cargados, sacarlo de la cuenta haría que los saldos no sumen cero
    const ids = new Set([
        ...listaParticipantes.map((p) => p.integranteId),
        ...gastoTotalIntegrante.keys(),
        ...participacionesPorIntegrante.keys(),
    ])

    const saldos = [...ids].map((id) => ({ //Sn = Total Erogado - (Total de participaciones), en centavos
        id,
        saldo: aCentavos(gastoTotalIntegrante.get(id) || 0) - aCentavos(participacionesPorIntegrante.get(id) || 0)
    }))

    return liquidar(saldos).map(({ idA, idB, montoCentavos }) => ({  //Front debe capturar que idA debe a idB montoDeuda
        idA, idB, montoDeuda: aPesos(montoCentavos)
    }))
}

async function obtenerGastoTotalIntegrante(idGrupo) {
    const listaIntegrantes = await Gasto.findAll({  //Obtengo el total gastado por cada integrante, devuelve arreglo de objetos
        where: { //Condicion principal
            idGrupo: idGrupo
        },

        attributes: [ //Select con sum, devuelve un string
            'idCreadorGasto', 'idGrupo', [sequelize.fn('SUM', sequelize.col('monto')), 'montoTotalErogado']
        ],

        group: [  //group by
            'idCreadorGasto', 'idGrupo'
        ],
        raw: true
    });
    const mapIntegrantes = new Map(); //Descarto idGrupo porque ya queda garantizado por la consulta
    listaIntegrantes.forEach((integrante) => mapIntegrantes.set(integrante.idCreadorGasto, Number(integrante.montoTotalErogado)))
    return mapIntegrantes;
}

async function obtenerParticipacionesPorIntegrante(idGrupo) {
    const listaParticipacionesPorIntegrante = await Detalle_gasto.findAll({ //Modularizar//Trae los gastos en los que participó cada uno

        attributes: [
            'idParticipante', [sequelize.fn('SUM', sequelize.col('detalle_gasto.monto')), 'totalConsumido']
        ],

        include: [  //Inner Join
            {
                model: Gasto,
                as: 'gasto',
                where: { idGrupo: idGrupo },    //Solo toma los gastos con el idGrupo

                attributes: [], //No arrastra ninguna columna
            },
        ],

        group: [
            'detalle_gasto.idParticipante'
        ],

        raw: true

    })

    const mapIntegrantes = new Map();
    listaParticipacionesPorIntegrante.forEach((integrante) => mapIntegrantes.set(integrante.idParticipante, Number(integrante.totalConsumido)))
    return mapIntegrantes;
}


async function obtenerGastosGrupo(idGrupo) {

    return await Gasto.findAll({
        attributes: ['id', 'monto', 'descripcion', 'idCreadorGasto', 'createdAt'],
        where: { idGrupo: idGrupo },

        include: [
            {
                model: User,
                as: 'creador',
                attributes: ['id', 'name', 'alias']
            }
        ],
        order: [['createdAt', 'DESC']]
    });
}

const obtenerTotalGastadoUsuario = async (idGrupo, idUser) => {
    const resultado = await Gasto.findOne({
        attributes: [
            [sequelize.fn('SUM', sequelize.col('monto')), 'montoTotalErogado']
        ],


        where: { idGrupo: idGrupo, idCreadorGasto: idUser },

        raw: true
    })

    return Number(resultado?.montoTotalErogado) || 0 //Si no gastó nada, MontoTotalErogado Termina siendo null y devuleve 0
}

const obtenerTotalConsumidoUsuario = async (idGrupo, idUser) => {
    const resultado = await Detalle_gasto.findOne({
        attributes: [
            [sequelize.fn('SUM', sequelize.col('detalle_gasto.monto')), 'totalConsumido']
        ],

        include: [  //Inner Join
            {
                model: Gasto,
                as: 'gasto',
                where: { idGrupo: idGrupo },    //Solo toma los gastos con el idGrupo

                attributes: [], //No arrastra ninguna columna
            },
        ],

        where: { idParticipante: idUser },

        raw: true
    })

    return Number(resultado?.totalConsumido) || 0
}

const obtenerSaldoUsuarioCentavos = async (idGrupo, idUser) => { //Lo que pagó menos lo que consumió, en centavos
    const gastado = await obtenerTotalGastadoUsuario(idGrupo, idUser)
    const consumido = await obtenerTotalConsumidoUsuario(idGrupo, idUser)
    return aCentavos(gastado) - aCentavos(consumido)
}

const obtenerGastosGrupos = async (listadoGrupos) => {
    const idsGrupos = listadoGrupos.map((g) => g.id) //Me quedo solo con las ids
    if (idsGrupos.length === 0) return [];
    const gastosGrupos = await Gasto.findAll({
        attributes: ["id", "monto", "descripcion", "idCreadorGasto", "idGrupo", "createdAt"],

        where: { idGrupo: idsGrupos }, //Internamente sequelize genera un IN, no es necesario utilizar Op.in
        limit: 30,
        order: [
            ["createdAt", "DESC"]   //Orden descendente para mostrar los ultimos gastos primero
        ],
        include: [
            {
                model: User,
                as: 'creador',
                attributes: ["id", "name", "last_name", "username"]
            },
            {
                model: Grupo,
                as: "grupo",
                attributes: ["id", "nombreGrupo"]
            },
            {
                model: Detalle_gasto,
                attributes: ["idParticipante", "monto"],
                separate: true,         //Genera dos consultas separadas y luego empareja cada detalle_gasto con su gasto usando la FK a gasto
                as: 'detalle_gastos',
                include: [{ model: User, as: 'participante', attributes: ["id", "name", "last_name", "username"] }]
            }
        ]
    })
    return gastosGrupos;
}


module.exports = { procesarYCrearGasto, obtenerLiquidacion, obtenerGastoTotalIntegrante, obtenerGastosGrupo, obtenerTotalGastadoUsuario, obtenerTotalConsumidoUsuario, obtenerSaldoUsuarioCentavos, obtenerGastosGrupos };




