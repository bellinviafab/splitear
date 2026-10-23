const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuarios.controller")
const authMiddleware = require("../middlewares/auth.middlewares.js")


router.get('/', authMiddleware.validateCookie, usuarioController.getUsuarios);
router.get('/:id', authMiddleware.validateCookie, usuarioController.getUsuario);
router.put('/:id', authMiddleware.validateCookie, usuarioController.actualizarDatosPerfil)



module.exports = router;