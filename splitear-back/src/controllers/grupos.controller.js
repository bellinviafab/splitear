const Grupo = require("../models/Grupo.js");
const Pertenencia = require("../models/Pertenencia.js");
const User = require("../models/User.js");
const s = require('../db.js')
const grupoService = require("../services/grupos.service.js")
const gastosService = require("../services/gastos.service.js")

const crearGrupo = async (req, res, next) => {
    const t = await s.transaction();
    try {
        const { nombreGrupo, descripcion, fechaFin } = req.body;  //Extrae el nombre del grupo y el usuario del body
        const user = req.user;
        const grupo = await Grupo.findOne({ where: { nombreGrupo: nombreGrupo, creadorId: user.id }, transaction: t })  //Verifica que no exista en bd para ese usuario
        if (grupo) {
            await t.rollback(); //Cancelo la transaccion y libero la bd.
            return res.status(400).json({ message: "El grupo con ese nombre ya existe" }); //Invalido por existencia del grupo con ese nombre en la cuenta de ese usuario
        }
        const newGrupo = await Grupo.create({
            nombreGrupo: nombreGrupo,
            descripcion: descripcion || null,
            fechaFin: fechaFin || null,
            creadorId: user.id
        }, { transaction: t });

        const { integrantes = [] } = req.body;
        const arrayIntegrantes = [];

        for (let integrante of integrantes) {  //Arreglar consulta para evitar N+1
            const newIntegrante = await User.findOne({ where: { email: integrante }, transaction: t })
            if (!newIntegrante)
                enviarMail(integrante.email, newGrupo.nombreGrupo);
            else
                arrayIntegrantes.push(newIntegrante.id);
        }

        arrayIntegrantes.push(user.id);
        await newGrupo.addUsers(arrayIntegrantes, { transaction: t });
        console.log(`Grupo creado con exito: ${newGrupo.nombreGrupo} por el usuario: ${user.username}`);
        await t.commit();
        return res.status(201).json(newGrupo);
    } catch (error) {
        await t.rollback();
        next(error);
    }

}

async function enviarMail() { //Puertos diferentes
    //Invitacion por mail
}

const eliminarGrupo = async (req, res, next) => {  //Soft delete
    try {
        const idUser = req.user.id;
        const idGrupo = req.params.id;
        const grupo = await Grupo.findOne({ where: { id: idGrupo, creadorId: idUser } }) //Busqueda por id y por fk al creador
        if (!grupo)
            return res.status(404).json({ message: "Grupo no encontrado" }); //Grupo no encontrado
        await grupo.destroy();
        return res.status(200).json({ message: "Grupo eliminado exitosamente" }); //Grupo soft-deleted
    } catch (error) {
        next(error);
    }

}

const agregarMiembro = async (req, res, next) => {
    try {
        const { integrante = {} } = req.body;
        const grupo = await Grupo.findOne({ where: { id: req.params.id, creadorId: req.user.id } })
        if (!grupo)
            return res.status(404).json({ message: "Grupo no encontrado y/o Usuario no autorizado para añadir integrantes" });

        const newIntegrante = await User.findOne({ where: { email: integrante.email } })

        if (!newIntegrante) {
            enviarMail(integrante.email, grupo);
            return res.status(200).json({ message: "El usuario no posee cuenta, se ha enviado un email de invitación" })
        }

        if (await grupo.hasUser(newIntegrante))
            return res.status(409).json({ message: "Usuario ya forma parte del grupo" })

        await grupo.addUser(newIntegrante);
        return res.status(201).json({ message: "Usuario añadido con exito" })
    } catch (error) {
        next(error);
    }
}

const eliminarMiembro = async (req, res) => { //Soft delete
    try {
        const grupo = await Grupo.findOne({ where: { id: req.params.id, creadorId: req.user.id } })
        const miembroElim = Number(req.params.userId) //Express parsea params como string
        if (!grupo) //Grupo inexistente o usuario no tiene permisos por no ser el creador
            return res.status(404).json({ mensaje: "Grupo no encontrado y/o Usuario no autorizado" })

        if (miembroElim == req.user.id)
            return res.status(400).json({ mensaje: "El administrador no puede eliminarse" })

        if (!(await grupo.hasUser(miembroElim)))
            return res.status(400).json({ mensaje: "Usuario no pertenece al grupo" })

        await grupo.removeUser(miembroElim)
        return res.status(200).json({ mensaje: "Miembro eliminado con exito" })
    } catch (error) {
        console.error(error)
        return res.sendStatus(500)
    }
}

const getGrupos = async (req, res) => { //Grupos referidos a un usuario
    try {
        const listaGrupos = await grupoService.getGrupos(req.user.id)
        return res.status(200).json(listaGrupos)
    } catch (error) {
        return res.status(500).json({ error: "Ocurrió un error al buscar al tus grupos" })
    }
}

const detalleGrupo = async (req, res) => {
    try {
        const detalleGrupo = await grupoService.getDetalleGrupo(req.params.id)
        if (!detalleGrupo) {
            return res.status(404).json({ message: "El grupo solicitado no existe" });
        }
        return res.status(200).json(detalleGrupo)
    } catch (error) {
        return res.status(500).json({ error: "Ocurrió un error al mostrar el detalle del Grupo" })
    }
}

const listadoGastosGrupo = async (req, res) => {
    try {
        const listado = await grupoService.obtenerListadoGastosGrupo(req.params.id)
        return res.status(200).json(listado)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Ocurrió un error al obtener el listado de gastos" })
    }
}

const listadoIntegrantesGrupo = async (req, res, next) => {
    try {
        const idGrupo = req.params.id
        const integrantes = await grupoService.obtenerListadoIntegrantes(idGrupo)
        return res.status(200).json({ integrantes })
    } catch (error) {
        next(error);
    }
}

const listadoActividadGrupos = async (req, res, next) => { //Retorna la actividad de los grupos a los que pertenece un usuario, perteneciente a Actividad en el front
    try {
        const listadoGrupos = await grupoService.listadoGruposUsuario(req.user.id)
        const gastosGrupos = await gastosService.obtenerGastosGrupos(listadoGrupos)
        return res.status(200).json({ gastosGrupos })
    } catch (error) {
        next(error);
    }
}

module.exports = {
    crearGrupo,
    eliminarGrupo,
    agregarMiembro,
    eliminarMiembro,
    getGrupos,
    detalleGrupo,
    listadoGastosGrupo,
    listadoIntegrantesGrupo,
    listadoActividadGrupos
};