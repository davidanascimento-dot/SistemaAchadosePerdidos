const { createClient } = require('@supabase/supabase-js')

// conexão com o banco de dados do Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
)

module.exports = supabase
