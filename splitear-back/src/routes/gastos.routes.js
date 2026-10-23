const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middlewares.js")
const gastosController = require("../controllers/gastos.controller.js");

router.post('/:id', authMiddleware.validateCookie, gastosController.crearGasto);
router.delete('/:id/:idGasto', authMiddleware.validateCookie, authMiddleware.validaPertenencia, gastosController.eliminarGasto);
router.get('/grupos/:id/balance', authMiddleware.validateCookie, authMiddleware.validaPertenencia, gastosController.liquidarDeuda)




module.exports = router