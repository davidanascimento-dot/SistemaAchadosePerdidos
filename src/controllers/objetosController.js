const supabase = require('../supabase')

// normaliza a situação para o padrão salvo no banco
// aceita "Disponível", "disponivel", "Devolvido", "devolvido"...
function normalizarSituacao(valor) {
    if (valor === null || valor === undefined) return null

    const texto = String(valor)
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()

    if (texto === 'disponivel') return 'Disponível'
    if (texto === 'devolvido') return 'Devolvido'

    return null
}

// confere se a data está no formato ano-mes-dia e é uma data real
function dataValida(valor) {
    const texto = String(valor)

    if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false

    const data = new Date(texto + 'T00:00:00')

    return !isNaN(data.getTime()) && data.toISOString().slice(0, 10) === texto
}

// limpa o texto da busca para não quebrar o filtro do Supabase
function limparBusca(texto) {
    return String(texto).replace(/[,%()]/g, ' ').trim()
}

// valida os dados recebidos do front-end
function validar(dados) {
    const erros = []

    if (!dados.descricao || String(dados.descricao).trim() === '') {
        erros.push('A descrição do objeto é obrigatória')
    }

    if (!dados.categoria || String(dados.categoria).trim() === '') {
        erros.push('A categoria é obrigatória')
    }

    if (!dados.local || String(dados.local).trim() === '') {
        erros.push('O local onde foi encontrado é obrigatório')
    }

    if (!dados.data_registro) {
        erros.push('A data do registro é obrigatória')
    } else if (!dataValida(dados.data_registro)) {
        erros.push('A data do registro é inválida (use o formato AAAA-MM-DD)')
    }

    if (!dados.situacao) {
        erros.push('A situação é obrigatória')
    } else if (!normalizarSituacao(dados.situacao)) {
        erros.push('A situação deve ser "Disponível" ou "Devolvido"')
    }

    return erros
}

// monta o objeto que vai para o banco, já limpo e padronizado
function montarObjeto(dados) {
    return {
        descricao: String(dados.descricao).trim(),
        categoria: String(dados.categoria).trim(),
        local: String(dados.local).trim(),
        data_registro: dados.data_registro,
        situacao: normalizarSituacao(dados.situacao)
    }
}

// confere o ID recebido na URL
function idValido(id) {
    const numero = Number(id)
    return Number.isInteger(numero) && numero > 0 ? numero : null
}

// resposta de erro amigável (inclusive quando a tabela ainda não existe)
function responderErro(res, erro, acao) {
    console.error(`Erro ao ${acao}:`, erro.message)

    if (erro.message && erro.message.includes('PGRST205')) {
        return res.status(500).json({
            erro: 'A tabela "objetos" não foi encontrada no Supabase',
            detalhe: 'Execute o script banco.sql no SQL Editor do Supabase'
        })
    }

    return res.status(500).json({
        erro: `Erro ao ${acao}`,
        detalhe: erro.message
    })
}

// CADASTRO: cria um novo objeto
async function criar(req, res) {
    const dados = req.body || {}
    const erros = validar(dados)

    if (erros.length > 0) {
        return res.status(400).json({ erro: 'Dados inválidos', detalhes: erros })
    }

    try {
        const { data, error } = await supabase
            .from('objetos')
            .insert(montarObjeto(dados))
            .select()
            .single()

        if (error) throw error

        return res.status(201).json(data)
    } catch (erro) {
        return responderErro(res, erro, 'cadastrar o objeto')
    }
}

// CONSULTA: lista os objetos, com busca e filtro de situação
async function listar(req, res) {
    try {
        let consulta = supabase
            .from('objetos')
            .select('*')
            .order('id', { ascending: false })

        const busca = limparBusca(req.query.busca || '')
        const situacao = normalizarSituacao(req.query.situacao)

        if (req.query.situacao && !situacao) {
            return res.status(400).json({ erro: 'Situação inválida para o filtro' })
        }

        if (busca !== '') {
            consulta = consulta.or(`descricao.ilike.%${busca}%,local.ilike.%${busca}%`)
        }

        if (situacao) {
            consulta = consulta.eq('situacao', situacao)
        }

        const { data, error } = await consulta

        if (error) throw error

        return res.status(200).json(data)
    } catch (erro) {
        return responderErro(res, erro, 'consultar os objetos')
    }
}

// CONSULTA: busca um objeto específico pelo ID
async function buscarPorId(req, res) {
    const id = idValido(req.params.id)

    if (!id) {
        return res.status(400).json({ erro: 'ID inválido' })
    }

    try {
        const { data, error } = await supabase
            .from('objetos')
            .select('*')
            .eq('id', id)
            .maybeSingle()

        if (error) throw error

        if (!data) {
            return res.status(404).json({ erro: 'Objeto não encontrado' })
        }

        return res.status(200).json(data)
    } catch (erro) {
        return responderErro(res, erro, 'consultar o objeto')
    }
}

// ATUALIZAÇÃO: altera todos os dados de um objeto
async function atualizar(req, res) {
    const id = idValido(req.params.id)
    const dados = req.body || {}

    if (!id) {
        return res.status(400).json({ erro: 'ID inválido' })
    }

    const erros = validar(dados)

    if (erros.length > 0) {
        return res.status(400).json({ erro: 'Dados inválidos', detalhes: erros })
    }

    try {
        const { data, error } = await supabase
            .from('objetos')
            .update(montarObjeto(dados))
            .eq('id', id)
            .select()

        if (error) throw error

        if (data.length === 0) {
            return res.status(404).json({ erro: 'Objeto não encontrado' })
        }

        return res.status(200).json(data[0])
    } catch (erro) {
        return responderErro(res, erro, 'atualizar o objeto')
    }
}

// ATUALIZAÇÃO: altera somente a situação (Disponível / Devolvido)
async function alterarSituacao(req, res) {
    const id = idValido(req.params.id)
    const situacao = normalizarSituacao(req.body ? req.body.situacao : null)

    if (!id) {
        return res.status(400).json({ erro: 'ID inválido' })
    }

    if (!situacao) {
        return res.status(400).json({ erro: 'A situação deve ser "Disponível" ou "Devolvido"' })
    }

    try {
        const { data, error } = await supabase
            .from('objetos')
            .update({ situacao })
            .eq('id', id)
            .select()

        if (error) throw error

        if (data.length === 0) {
            return res.status(404).json({ erro: 'Objeto não encontrado' })
        }

        return res.status(200).json(data[0])
    } catch (erro) {
        return responderErro(res, erro, 'alterar a situação')
    }
}

// EXCLUSÃO: remove um objeto do sistema
async function excluir(req, res) {
    const id = idValido(req.params.id)

    if (!id) {
        return res.status(400).json({ erro: 'ID inválido' })
    }

    try {
        const { data, error } = await supabase
            .from('objetos')
            .delete()
            .eq('id', id)
            .select()

        if (error) throw error

        if (data.length === 0) {
            return res.status(404).json({ erro: 'Objeto não encontrado' })
        }

        return res.status(200).json({ mensagem: 'Objeto excluído com sucesso', objeto: data[0] })
    } catch (erro) {
        return responderErro(res, erro, 'excluir o objeto')
    }
}

module.exports = {
    criar,
    listar,
    buscarPorId,
    atualizar,
    alterarSituacao,
    excluir
}
