const express = require('express');
const router = express.Router();
const User = require('../models/User')
const authController = require('../controllers/auth.controller')
const authMiddleware = require('../middlewares/auth.middlewares')


/*router.get('/register', (req, res) => {
    User.findAll().then(result => res.send(result))
})*/

router.post('/register', authController.crearUsuario);
router.post('/login', authController.loginUsuario);
router.post('/logout', authController.logoutUsuario);
router.get('/me', authMiddleware.validateCookie, authController.obtenerUsuarioActual);

module.exports = router;