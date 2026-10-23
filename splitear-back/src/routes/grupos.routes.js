const express = require("express");
const router = express.Router();
//const Grupo = require("../models/Grupo.js");
const grupoController = require("../controllers/grupos.controller.js")
const authMiddleware = require("../middlewares/auth.middlewares.js")

router.post('/', authMiddleware.validateCookie, grupoController.crearGrupo); //Verificar roles
router.get('/', authMiddleware.validateCookie, grupoController.getGrupos)
router.get('/actividad', authMiddleware.validateCookie, grupoController.listadoActividadGrupos) //Obtiene actividad de todos los grupos ordenado por fecha
router.post('/:id/miembros', authMiddleware.validateCookie, authMiddleware.validaPertenencia, grupoController.agregarMiembro);
router.delete('/:id', authMiddleware.validateCookie, authMiddleware.validaPermiso, grupoController.eliminarGrupo);
router.delete('/:id/miembros/:userId', authMiddleware.validateCookie, authMiddleware.validaPermiso, grupoController.eliminarMiembro);

router.get('/:id', authMiddleware.validateCookie, authMiddleware.validaPertenencia, grupoController.detalleGrupo);
router.get('/:id/gastos', authMiddleware.validateCookie, authMiddleware.validaPertenencia, grupoController.listadoGastosGrupo)
router.get('/:id/integrantes', authMiddleware.validateCookie, authMiddleware.validaPertenencia, grupoController.listadoIntegrantesGrupo)



module.exports = router;