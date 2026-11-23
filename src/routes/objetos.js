const express = require('express')
const controller = require('../controllers/objetosController')

const router = express.Router()

// rotas do CRUD de achados e perdidos
router.post('/', controller.criar)
router.get('/', controller.listar)
router.get('/:id', controller.buscarPorId)
router.put('/:id', controller.atualizar)
router.patch('/:id/situacao', controller.alterarSituacao)
router.delete('/:id', controller.excluir)

module.exports = router
