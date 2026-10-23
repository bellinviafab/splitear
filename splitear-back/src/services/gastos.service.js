const Gasto = require("../models/Gasto")
const Detalle_gasto = require("../models/Detalle_gasto.js")
const Pertenencia = require("../models/Pertenencia.js")
const Grupo = require("../models/Grupo.js")
const User = require("../models/User.js")
const s = require('../db.js')
const sequelize = require("sequelize")

async function procesarYCrearGasto(idGrupo, arrayParticipantes, monto, idPagador, descripPago) {
    const t = await s.transaction();
    try {
        const nuevoGasto = await Gasto.create({
            monto: monto, descripcion: descripPago, idCreadorGasto: idPagador, idGrupo: idGrupo
        },
            { transaction: t }
        );

        const montoCentavos = Math.round(monto * 100); //Pasar monto a centavos para manejar redondeos
        const cuotaBase = Math.floor(montoCentavos / arrayParticipantes.length);
        let cuotaRestante = montoCentavos % arrayParticipantes.length;

        const arrayRepartoParticipantes = [];
        for (let participante of arrayParticipantes) {
            if (cuotaRestante) {
                arrayRepartoParticipantes.push({ monto: (cuotaBase + 1) / 100, idGasto: nuevoGasto.id, idParticipante: participante.id })
                cuotaRestante--;
            } else
                arrayRepartoParticipantes.push({ monto: cuotaBase / 100, idGasto: nuevoGasto.id, idParticipante: participante.id })
        }

        const reparto = await Detalle_gasto.bulkCreate(arrayRepartoParticipantes, { transaction: t })
        await t.commit();
        return reparto;
    } catch (error) {
        await t.rollback();
        throw error;
    }
}

const obtenerLiquidacion = async (idGrupo) => {  //Recorrer arreglos con find dentro de un for me daría complejidad cuadratica
    try {

        const grupo = await Grupo.findByPk(idGrupo)
        if (!grupo) {
            const error = new Error("Grupo inexistente")
            error.status = 404
            throw error;
        }
        const listaParticipantes = await Pertenencia.findAll({  //Se debe comenzar con un findAll ya que puede haber participantes que nunca aportaron y son deudores totales
            where: {
                grupoId: idGrupo
            }
        })
        const gastoTotalIntegrante = await obtenerGastoTotalIntegrante(idGrupo);
        const participacionesPorIntegrante = await obtenerParticipacionesPorIntegrante(idGrupo)

        const listaSaldoNeto = await obtenerListaSaldoNeto(listaParticipantes, gastoTotalIntegrante, participacionesPorIntegrante)
        let izq = 0; let der = listaSaldoNeto.length - 1; //Punteros por izquierda y derecha

        const listadoDeudas = [];   //ED a retornar
        while (izq < der) {
            const monto = Math.min(Math.abs(listaSaldoNeto[izq].saldoNeto), listaSaldoNeto[der].saldoNeto)  //Valor absoluto 
            listaSaldoNeto[izq].saldoNeto = listaSaldoNeto[izq].saldoNeto + monto;
            listaSaldoNeto[der].saldoNeto = listaSaldoNeto[der].saldoNeto - monto;

            listadoDeudas.push({    //Front debe capturar que idA(Consulta a User por id) debe a idB montoDeuda
                idA: listaSaldoNeto[izq].id,
                idB: listaSaldoNeto[der].id,
                montoDeuda: monto
            });

            if (listaSaldoNeto[izq].saldoNeto == 0) //Si alguno de los dos posiciones con monto=0 --> retrocedo o avanzo
                izq++;
            if (listaSaldoNeto[der].saldoNeto == 0)
                der--;
        }

        return listadoDeudas;
    } catch (error) {
        throw error;
    }

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

async function obtenerListaSaldoNeto(listaParticipantes, gastoTotalIntegrante, participacionesPorIntegrante) { //Sn = Total Erogado - (Total de participaciones)
    const arregloSaldoNeto = [];

    for (const integrante of listaParticipantes) { //Ambos map pueden devolver un undefined si no gastaron o no participaron de gastos

        const totalErogado = gastoTotalIntegrante.get(integrante.integranteId) || 0
        const totalParticipaciones = participacionesPorIntegrante.get(integrante.integranteId) || 0

        const saldoNeto = totalErogado - totalParticipaciones

        if (saldoNeto != 0)             //Si queda en cero --> fuera de la liquidación (Gastó lo mismo que lo que participó)
            arregloSaldoNeto.push({ id: integrante.integranteId, saldoNeto: saldoNeto })
    }

    arregloSaldoNeto.sort((a, b) => a.saldoNeto - b.saldoNeto) //Sort por saldoNeto
    return arregloSaldoNeto;
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


module.exports = { procesarYCrearGasto, obtenerLiquidacion, obtenerGastoTotalIntegrante, obtenerGastosGrupo, obtenerTotalGastadoUsuario, obtenerTotalConsumidoUsuario, obtenerGastosGrupos };




