
const errorHandler = (error, req, res, next) => {
    if (error.name === 'SequelizeUniqueConstraintError') { //Email o username repetidos
        return res.status(409).json({ message: "El email o el nombre de usuario ya está en uso" })
    }

    if (error.name === 'SequelizeValidationError') { //Email con formato equivocado
        return res.status(400).json({ message: "Revisa los datos ingresados" })
    }

    if (error.statusCode) {
        return res.status(error.statusCode).json({ message: error.message });
    }

    console.error(error)
    return res.status(500).json({ message: "Ocurrió un error inesperado" });
}

module.exports = errorHandler