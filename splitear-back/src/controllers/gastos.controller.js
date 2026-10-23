const Gasto = require("../models/Gasto")
const Grupo = require("../models/Grupo")
const Pertenencia = require("../models/Pertenencia")
const Detalle_gasto = require("../models/Detalle_gasto")
const User = require("../models/User")
const { Op } = require("sequelize")
const gastoService = require("../services/gastos.service")
const s = require('../db.js')

const crearGasto = async (req, res) => {    //Desacoplar con services
    try {
        const user = req.user;
        const idGrupo = req.params.id;
        const { monto, descripcion } = req.body;
        const grupo = await Grupo.findByPk(idGrupo)
        if (!grupo)
            return res.status(404).json({ mensaje: "Grupo no encontrado" })
        if (!monto || monto <= 0)
            return res.status(400).json({ mensaje: "Monto invalido y/o inexistente" })
        const userParticipante = await Pertenencia.findOne({
            where: {
                [Op.and]: [
                    { integranteId: user.id }, { grupoId: grupo.id }
                ],
            },
        });
        if (!userParticipante)
            return res.status(403).json({ mensaje: "Usuario no pertenence y/o no existe en el grupo" })

        const { participantes = [] } = req.body;
        const arrayParticipantes = [];
        //arrayParticipantes.push(user) Solo ingresan al arreglo los seleccionados desde el front
        for (let participante of participantes) {   //Cambiar consulta para evitar N+1
            const newParticipante = await Pertenencia.findOne({ where: { integranteId: participante.id, grupoId: grupo.id } }) //Que sucede con los que dan null?
            if (!newParticipante)
                return res.status(400).json({ mensaje: `El participante con ID ${participante.id} no pertenece al grupo` })
            else
                arrayParticipantes.push(participante)
        }
        const nuevoGasto = await gastoService.procesarYCrearGasto(grupo.id, arrayParticipantes, monto, user.id, descripcion)
        return res.status(201).json(nuevoGasto);
    } catch (error) {
        return res.status(500).json({ mensaje: "Hubo un error al crear el Gasto" });
    }
}

const eliminarGasto = async (req, res) => {
    try {
        const user = req.user;
        const idGrupo = req.params.id;
        const idGasto = req.params.idGasto;

        const grupo = await Grupo.findByPk(idGrupo)
        if (!grupo)
            return res.status(404).json({ mensaje: "Grupo inexistente" })

        const userPertenece = await Pertenencia.findOne({ where: { integranteId: user.id, grupoId: idGrupo } })
        if (!userPertenece)
            return res.status(403).json({ mensaje: "Usuario inexistente y/o no pertenece al grupo" })

        const gasto = await Gasto.findOne({ where: { id: idGasto, idGrupo: idGrupo } }) //Dado que Gasto tiene paranoid:true, una segunda consulta retorna 404
        if (!gasto)
            return res.status(404).json({ mensaje: "Gasto no se encuentra y/o no existe en el grupo" })

        if (gasto.idCreadorGasto !== user.id && grupo.creadorId !== user.id) //Solo elimina el que creó el gasto o el admin del grupo
            return res.status(403).json({ mensaje: "No tenes permisos para eliminar un gasto que no creaste" })

        const t = await s.transaction();    //Transaccion limitada a las operaciones necesarias
        try {
            await Detalle_gasto.destroy({ where: { idGasto: gasto.id }, transaction: t });
            await gasto.destroy({ transaction: t }) //Soft-delete en ambos

            await t.commit();
            return res.status(200).json({ mensaje: "Gasto eliminado con exito" })
        } catch (error) {
            await t.rollback();
            throw error;
        }
    } catch (error) {
        return res.status(500).json({ mensaje: "Hubo un error al eliminar el gasto" });
    }

}

const liquidarDeuda = async (req, res) => {
    try {
        const obtieneLiquidacion = await gastoService.obtenerLiquidacion(req.params.id)  //Se va con el idGrupo
        return res.status(200).json(obtieneLiquidacion);
    } catch (error) {
        return res.status(500).json({ mensaje: "Hubo un error al liquidar la deuda, intente nuevamente" });
    }
}


module.exports = { crearGasto, eliminarGasto, liquidarDeuda };