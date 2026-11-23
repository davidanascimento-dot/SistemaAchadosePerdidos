const { createClient } = require('@supabase/supabase-js')

// conexão com o banco de dados do Supabase
// os valores padrão permitem que o deploy funcione mesmo sem variáveis de ambiente
const url = process.env.SUPABASE_URL || 'https://uxuagcqifqkunibazuor.supabase.co'
const chave = process.env.SUPABASE_KEY || 'sb_publishable_fQUVsFFRbE-ZjqASiBjTiw_xlncw-r6'

const supabase = createClient(url, chave)

module.exports = supabase
