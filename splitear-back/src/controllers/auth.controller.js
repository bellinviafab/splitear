const User = require('../models/User');
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const { Op } = require("sequelize")

const crearUsuario = async (req, res, next) => {
    try {
        const { email, username, password } = req.body
        const newUser = await User.create({ email, username, password })
        const { password: _password, salt, ...usuarioPublico } = newUser.toJSON();
        res.status(201).json(usuarioPublico);
    } catch (error) {
        next(error);
    }
}

const loginUsuario = async (req, res, next) => {
    try {
        const { identificador, password } = req.body;

        const user = await User.findOne({//Operacion de I/O, sale del stack
            where: {
                [Op.or]: [
                    { username: identificador }, { email: identificador }
                ],
            },
        })

        if (!user || !(await user.validarPassword(password))) {
            return res.status(401).json({ message: "Credenciales invalidas" })
        }

        const payload = {  //Payload para el jwt
            id: user.id,
            username: user.username
        }
        const token = generarToken(payload)

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 2 * 60 * 60 * 1000,
        });
        return res.status(200).json({
            message: "Login exitoso",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                name: user.name || null,
                last_name: user.last_name || null,
                alias: user.alias || null
            },
        });

    } catch (error) {
        next(error);
    }
}

function generarToken(payload) {
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "2h" }); //Secret es constante
    return token;
}

const logoutUsuario = (req, res) => {
    res.clearCookie("token");
    return res.sendStatus(204);
}

const obtenerUsuarioActual = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: {
                exclude: ['password', 'salt']
            }
        })
        if (!user)
            return res.status(401).json({ message: "Sesión caducada" });
        return res.json(user)
    } catch (error) {
        next(error);
    }
}

module.exports = { crearUsuario, loginUsuario, logoutUsuario, obtenerUsuarioActual }

