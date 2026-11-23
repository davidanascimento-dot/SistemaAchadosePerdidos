// ponto de entrada da função serverless da Vercel
// recebe todas as requisições /api e repassa para o app Express
const app = require('../src/app')

module.exports = app
