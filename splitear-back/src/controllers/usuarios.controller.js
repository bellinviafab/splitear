const usuarioService = require("../services/usuarios.service")

const getUsuarios = async (req, res) => {  //Podría pensarse en una busqueda eficaz buscando entre amigos de amigos
    try {
        const { q } = req.query
        if (!q)
            return res.status(200).json([]) //Devuelve nada si no se ingresa nada en la consulta
        const listaUsuarios = await usuarioService.obtenerListaUsuarios(q, req.user.id)
        return res.status(200).json(listaUsuarios)
    } catch (error) {
        return res.status(500).json({ error: "Ocurrió un error al buscar los usuarios" })
    }

}

const getUsuario = async (req, res) => {
    try {
        const id = req.params.id;
        if (!id || id == req.user.id)
            return res.status(200).json([])
        const usuario = await usuarioService.obtenerUsuario(id)
        return res.status(200).json(usuario)
    } catch (error) {
        return res.status(500).json({ error: "Ocurrió un error al buscar al usuario" })
    }
}


const actualizarDatosPerfil = async (req, res, next) => {
    try {
        const id = req.user.id;
        if (!id || id != req.user.id) {
            return res.status(403).json({ error: "No tienes permiso para actualizar este perfil" });
        }
        const { name, last_name, alias } = req.body;
        if (!name && !last_name && !alias) {
            return res.status(400).json({ message: "Debes modificar algunos de los datos" });
        }
        const datosActualizados = await usuarioService.actualizarDatosPerfil(id, { name, last_name, alias });
        return res.status(200).json(datosActualizados);
    } catch (error) {
        next(error)
    }
}


module.exports = { getUsuarios, getUsuario, actualizarDatosPerfil }