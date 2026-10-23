const jwt = require("jsonwebtoken")
const authService = require("../services/auths.service")
const grupoService = require("../services/grupos.service")


const validateCookie = (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token)
            return res.sendStatus(401); //Acceso denegado
        const payload = validateToken(token);
        req.user = payload //Se guarda el objeto decodificado dentro de req.user para utilizar
        next();
    } catch (error) {
        return res.sendStatus(401); //Acceso denegado
    }

}

function validateToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET)
}

const validaPertenencia = async (req, res, next) => {
    try {
        const pertenece = await authService.validarPertenencia(req.user.id, req.params.id)

        if (!pertenece)
            return res.status(403).json({ mensaje: "No perteneces a este grupo" })

        next();
    } catch (error) {
        return res.status(500).json({ error: "Error al validar la pertenencia al grupo" });
    }
}

const validaPermiso = async (req, res, next) => {
    try {
        const permisoAdmin = await grupoService.validarPermiso(req.user.id, req.params.id) //Valida que el usuario sea el admin
        if (!permisoAdmin)
            return res.status(403).json({ mensaje: "No tienes permisos de administrador en este grupo" })
        next();
    } catch (error) {
        return res.status(500).json({ error: "Error interno al verificar permisos" });
    }
}

module.exports = { validateCookie, validaPertenencia, validaPermiso }