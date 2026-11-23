const express = require('express')
const cors = require('cors')
const path = require('path')
const rotasObjetos = require('./routes/objetos')

const app = express()

app.use(cors())
app.use(express.json())

// servir o front-end da pasta public
app.use(express.static(path.join(__dirname, '..', 'public')))

// rotas da API (CRUD de achados e perdidos)
app.use('/api/objetos', rotasObjetos)

// rota de teste da API
app.get('/api', (req, res) => {
    res.status(200).json({ mensagem: 'API de Achados e Perdidos funcionando' })
})

// tratamento de erro geral
app.use((erro, req, res, next) => {
    console.error('Erro:', erro.message)
    res.status(500).json({ erro: 'Erro interno no servidor' })
})

module.exports = app
