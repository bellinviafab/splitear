const User = require("../models/User")
const { Op } = require("sequelize")


const obtenerListaUsuarios = async (nombre, idUser) => {
    const nombreBusqueda = `%${nombre}%`
    const lista = User.findAll({
        attributes: [
            'id', 'name', 'last_name', 'alias', 'email', 'image'
        ],
        where: {
            name: {
                [Op.iLike]: nombreBusqueda,
            },
            id: {
                [Op.ne]: idUser
            },
        },
        limit: 20
    })

    return lista;
}

const obtenerUsuario = async (idBusqueda) => {
    const usuario = await User.findByPk(idBusqueda, {
        attributes: ['id', 'name', 'last_name', 'alias', 'email', 'image']
    })
    return usuario
}

const actualizarDatosPerfil = async (id, datosActualizados) => {
    const usuario = await User.findByPk(id);
    if (!usuario) {
        const error = new Error("Usuario no encontrado");
        error.status = 404;
        throw error;
    }

    const { name, last_name, alias } = datosActualizados;

    if (usuario.name && name && name !== usuario.name) { //Para impedir mediante peticiones directas que se modifiquen otros campos
        const error = new Error("El nombre o apellido no pueden ser modificados una vez establecidos");
        error.statusCode = 400;
        throw error;
    }

    if (usuario.last_name && last_name && last_name !== usuario.last_name) {
        const error = new Error("El apellido no puede ser modificado una vez establecido.");
        error.statusCode = 400;
        throw error;
    }

    if (!usuario.name && name) {
        usuario.name = name;
    }

    if (!usuario.last_name && last_name) {
        usuario.last_name = last_name;
    }

    if (alias !== undefined) {
        usuario.alias = alias;
    }

    await usuario.save();

    const { password, salt, ...usuarioActualizado } = usuario.toJSON()
    return usuarioActualizado;
}

module.exports = { obtenerListaUsuarios, obtenerUsuario, actualizarDatosPerfil }