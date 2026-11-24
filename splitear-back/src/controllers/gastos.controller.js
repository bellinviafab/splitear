const Gasto = require("../models/Gasto")
const Grupo = require("../models/Grupo")
const Pertenencia = require("../models/Pertenencia")
const Detalle_gasto = require("../models/Detalle_gasto")
const gastoService = require("../services/gastos.service")
const { aCentavos, MONTO_MAXIMO_CENTAVOS } = require("../utils/dinero")
const s = require('../db.js')

const LARGO_MAXIMO_DESCRIPCION = 255 // La columna es VARCHAR(255)

// Valida el body de un gasto. Devuelve { error } con el mensaje para el usuario, o los datos ya normalizados.
// No se confía en el front: un gasto sin participantes o con montos raros descuadra los saldos del grupo.
function validarDatosGasto({ monto, descripcion, participantes }) {
    if (typeof monto !== 'number' && typeof monto !== 'string')
        return { error: "Ingresá un monto mayor a cero" }
    const montoCentavos = aCentavos(monto) // Montos con más de dos decimales se redondean al centavo
    if (!Number.isFinite(montoCentavos) || montoCentavos <= 0)
        return { error: "Ingresá un monto mayor a cero" }
    if (montoCentavos > MONTO_MAXIMO_CENTAVOS)
        return { error: "El monto es demasiado grande" }

    if (!Array.isArray(participantes) || participantes.length === 0)
        return { error: "El gasto tiene que tener al menos un participante" }
    const idsParticipantes = participantes.map((p) => Number(p?.id))
    if (idsParticipantes.some((id) => !Number.isInteger(id) || id <= 0))
        return { error: "Hay participantes inválidos" }
    if (new Set(idsParticipantes).size !== idsParticipantes.length)
        return { error: "Hay participantes repetidos" }

    if (descripcion != null && typeof descripcion !== 'string')
        return { error: "La descripción tiene que ser un texto" }
    const descripcionLimpia = descripcion?.trim() || null
    if (descripcionLimpia && descripcionLimpia.length > LARGO_MAXIMO_DESCRIPCION)
        return { error: `La descripción no puede superar los ${LARGO_MAXIMO_DESCRIPCION} caracteres` }

    return { montoCentavos, idsParticipantes, descripcion: descripcionLimpia }
}

const crearGasto = async (req, res, next) => {
    try {
        const user = req.user;
        const grupo = await Grupo.findByPk(req.params.id)
        if (!grupo)
            return res.status(404).json({ message: "Grupo no encontrado" })

        const userParticipante = await Pertenencia.findOne({ where: { integranteId: user.id, grupoId: grupo.id } });
        if (!userParticipante)
            return res.status(403).json({ message: "No perteneces a este grupo" })

        const datos = validarDatosGasto(req.body || {})
        if (datos.error)
            return res.status(400).json({ message: datos.error })

        // Una sola consulta para todos los participantes (antes era una por participante)
        const cantidadMiembros = await Pertenencia.count({
            where: { grupoId: grupo.id, integranteId: datos.idsParticipantes }
        })
        if (cantidadMiembros !== datos.idsParticipantes.length)
            return res.status(400).json({ message: "Algún participante no pertenece al grupo" })

        const nuevoGasto = await gastoService.procesarYCrearGasto(grupo.id, datos.idsParticipantes, datos.montoCentavos, user.id, datos.descripcion)
        return res.status(201).json(nuevoGasto);
    } catch (error) {
        next(error);
    }
}

const eliminarGasto = async (req, res, next) => {
    try {
        const user = req.user;
        const idGrupo = req.params.id;
        const idGasto = req.params.idGasto;

        const grupo = await Grupo.findByPk(idGrupo)
        if (!grupo)
            return res.status(404).json({ message: "Grupo inexistente" })

        const gasto = await Gasto.findOne({ where: { id: idGasto, idGrupo: idGrupo } }) //Dado que Gasto tiene paranoid:true, una segunda consulta retorna 404
        if (!gasto)
            return res.status(404).json({ message: "Gasto no se encuentra y/o no existe en el grupo" })

        if (gasto.idCreadorGasto !== user.id && grupo.creadorId !== user.id) //Solo elimina el que creó el gasto o el admin del grupo
            return res.status(403).json({ message: "No tenes permisos para eliminar un gasto que no creaste" })

        await s.transaction(async (t) => {    //Transaccion limitada a las operaciones necesarias
            await Detalle_gasto.destroy({ where: { idGasto: gasto.id }, transaction: t });
            await gasto.destroy({ transaction: t }) //Soft-delete en ambos
        })
        return res.status(200).json({ message: "Gasto eliminado con exito" })
    } catch (error) {
        next(error);
    }
}

const liquidarDeuda = async (req, res, next) => {
    try {
        const obtieneLiquidacion = await gastoService.obtenerLiquidacion(req.params.id)  //Se va con el idGrupo
        return res.status(200).json(obtieneLiquidacion);
    } catch (error) {
        next(error); // El middleware respeta el 404 de grupo inexistente
    }
}


module.exports = { crearGasto, eliminarGasto, liquidarDeuda, validarDatosGasto };
