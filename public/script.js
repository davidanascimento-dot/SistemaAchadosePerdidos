// elementos da interface
const form = document.getElementById('form-objeto')
const tituloForm = document.getElementById('titulo-form')
const botaoSalvar = document.getElementById('btn-salvar')
const botaoCancelar = document.getElementById('btn-cancelar')
const botaoNovo = document.getElementById('btn-novo')
const corpoTabela = document.getElementById('corpo-tabela')
const aviso = document.getElementById('aviso')
const campoBusca = document.getElementById('busca')
const chipsFiltro = document.querySelectorAll('.chip')
const contador = document.getElementById('contador')
const vazio = document.getElementById('vazio')
const totalTodas = document.getElementById('total-todas')
const totalDisponiveis = document.getElementById('total-disponiveis')
const totalDevolvidos = document.getElementById('total-devolvidos')
const modal = document.getElementById('modal-detalhes')
const modalEditar = document.getElementById('modal-editar')

// guarda o ID do objeto que está sendo editado e o filtro ativo
let editandoId = null
let situacaoAtiva = ''

// ---------- camada de dados ----------
// No Live Server (ou abrindo o HTML direto) não existe a API Node.
// Nesse caso os dados ficam no localStorage e o CRUD continua funcionando.
const CHAVE_LOCAL = 'achados-perdidos-objetos'
let modoLocal = false
let origemApi = null // null = ainda não descoberta; '' = mesma origem

function carregarLocal() {
    try {
        const dados = JSON.parse(localStorage.getItem(CHAVE_LOCAL) || '[]')
        return Array.isArray(dados) ? dados : []
    } catch (erro) {
        return []
    }
}

function gravarLocal(lista) {
    localStorage.setItem(CHAVE_LOCAL, JSON.stringify(lista))
}

// tenta a API na mesma origem e, depois, no servidor Node padrão (porta 3001).
// Se nenhuma responder, ativa o modo local.
async function requisitarApi(caminho, opcoes) {
    if (modoLocal) return null

    // No Live Server (5500/5501) ou abrindo o HTML direto, a origem atual é
    // estática: tenta primeiro o servidor Node para não gerar 404 desnecessário.
    const porta = window.location.port
    const estatico = porta === '5500' || porta === '5501' || window.location.protocol === 'file:'
    const origens = origemApi !== null
        ? [origemApi]
        : (estatico ? ['http://localhost:3001'] : ['', 'http://localhost:3001'])

    for (const origem of origens) {
        try {
            const resposta = await fetch(origem + caminho, opcoes)
            const tipo = resposta.headers.get('content-type') || ''

            // HTML (404 de servidor estático): esta origem não tem API
            if (!tipo.includes('application/json')) continue

            const dados = await resposta.json()

            // a API respondeu em JSON com erro: mostra a mensagem ao usuário
            if (!resposta.ok) {
                const erro = new Error(dados.erro || dados.detalhe || 'Erro na API')
                erro.daApi = true
                throw erro
            }

            origemApi = origem
            return dados
        } catch (erro) {
            if (erro.daApi) throw erro
            // falha de rede / servidor indisponível: tenta a próxima origem
        }
    }

    modoLocal = true
    esconderAviso()
    return null
}

function salvarLocalmente(id, objeto) {
    const lista = carregarLocal()

    if (id) {
        const indice = lista.findIndex(function (item) { return Number(item.id) === Number(id) })
        if (indice >= 0) lista[indice] = Object.assign({}, objeto, { id: Number(id) })
    } else {
        const proximoId = lista.reduce(function (maior, item) {
            return Math.max(maior, Number(item.id) || 0)
        }, 0) + 1
        lista.push(Object.assign({}, objeto, { id: proximoId }))
    }

    gravarLocal(lista)
}

// data de hoje no formato usado pelo input date (ano-mes-dia)
function dataDeHoje() {
    const hoje = new Date()
    const mes = String(hoje.getMonth() + 1).padStart(2, '0')
    const dia = String(hoje.getDate()).padStart(2, '0')
    return `${hoje.getFullYear()}-${mes}-${dia}`
}

// mostra uma mensagem para o usuário
function mostrarAviso(texto, sucesso) {
    aviso.textContent = texto
    aviso.className = sucesso ? 'aviso sucesso' : 'aviso erro'
}

function esconderAviso() {
    aviso.className = 'aviso escondido'
}

// evita que o texto do banco seja interpretado como HTML
function escapar(texto) {
    return String(texto == null ? '' : texto)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;')
}

// data para exibir na tabela (dia/mes/ano)
function formatarData(data) {
    if (!data) return ''
    const partes = data.split('T')[0].split('-')
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : data
}

// ícones em SVG usados nos botões de ação
const iconeEditar = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>'
const iconeExcluir = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/></svg>'

// CONSULTAR: carrega os objetos da API ou do armazenamento local
async function listar() {
    try {
        const parametros = new URLSearchParams()
        const busca = campoBusca.value.trim()

        if (busca) parametros.append('busca', busca)

        let dados = await requisitarApi('/api/objetos?' + parametros.toString())

        if (modoLocal) {
            dados = carregarLocal()

            if (busca) {
                const termo = busca.toLowerCase()
                dados = dados.filter(function (objeto) {
                    return String(objeto.descricao || '').toLowerCase().includes(termo) ||
                        String(objeto.local || '').toLowerCase().includes(termo)
                })
            }

            dados = dados.slice().sort(function (a, b) { return Number(b.id) - Number(a.id) })
        }

        const objetos = Array.isArray(dados) ? dados : []

        // atualiza as contagens dos filtros
        totalTodas.textContent = objetos.length
        totalDisponiveis.textContent = objetos.filter(function (o) { return o.situacao === 'Disponível' }).length
        totalDevolvidos.textContent = objetos.filter(function (o) { return o.situacao === 'Devolvido' }).length

        // aplica o filtro escolhido nas "pílulas"
        const filtrados = situacaoAtiva
            ? objetos.filter(function (o) { return o.situacao === situacaoAtiva })
            : objetos

        mostrarTabela(filtrados)
    } catch (erro) {
        corpoTabela.innerHTML = ''
        contador.textContent = '0 objeto(s) encontrado(s)'
        mostrarAviso('Erro ao carregar os objetos: ' + erro.message, false)
    }
}

// monta as linhas da tabela
function mostrarTabela(objetos) {
    corpoTabela.innerHTML = ''
    contador.textContent = `${objetos.length} objeto(s) encontrado(s)`
    vazio.className = objetos.length === 0 ? 'vazio' : 'vazio escondido'

    objetos.forEach(function (objeto) {
        const linha = document.createElement('tr')

        const classeSituacao = objeto.situacao === 'Devolvido' ? 'devolvido' : 'disponivel'
        const proximaSituacao = objeto.situacao === 'Disponível' ? 'Devolvido' : 'Disponível'

        // no celular cada célula ganha um rótulo via CSS (data-label)
        const botaoDevolver = objeto.situacao === 'Disponível'
            ? `<button type="button" class="button-small" data-acao="situacao" data-id="${objeto.id}" data-situacao="${escapar(proximaSituacao)}">Devolver</button>`
            : ''

        linha.innerHTML = `
            <td class="col-id" data-label="ID">${objeto.id}</td>
            <td data-label="Descrição"><strong class="link-detalhes" data-acao="ver" data-id="${objeto.id}" role="button" tabindex="0" title="Ver detalhes do objeto ${objeto.id}">${escapar(objeto.descricao)}</strong></td>
            <td data-label="Categoria">${escapar(objeto.categoria)}</td>
            <td data-label="Local">${escapar(objeto.local)}</td>
            <td data-label="Data">${formatarData(objeto.data_registro)}</td>
            <td data-label="Situação"><span class="situacao ${classeSituacao}">${escapar(objeto.situacao)}</span></td>
            <td class="botoes-tabela" data-label="Ações">
                ${botaoDevolver}
                <button type="button" class="button-small" data-acao="editar" data-id="${objeto.id}" title="Editar" aria-label="Editar objeto ${objeto.id}">${iconeEditar}</button>
                <button type="button" class="button-small danger" data-acao="excluir" data-id="${objeto.id}" title="Excluir" aria-label="Excluir objeto ${objeto.id}">${iconeExcluir}</button>
            </td>
        `

        corpoTabela.appendChild(linha)
    })
}

// CADASTRAR ou ATUALIZAR: envia o formulário para a API (ou salva localmente)
form.addEventListener('submit', async function (evento) {
    evento.preventDefault()
    esconderAviso()

    const objeto = {
        descricao: form.descricao.value,
        categoria: form.categoria.value,
        local: form.local.value,
        data_registro: form.data_registro.value,
        situacao: form.situacao.value
    }

    const idEmEdicao = editandoId

    try {
        const caminho = idEmEdicao ? `/api/objetos/${idEmEdicao}` : '/api/objetos'
        const metodo = idEmEdicao ? 'PUT' : 'POST'

        await requisitarApi(caminho, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(objeto)
        })

        if (modoLocal) salvarLocalmente(idEmEdicao, objeto)

        mostrarAviso(idEmEdicao ? 'Objeto atualizado com sucesso!' : 'Objeto cadastrado com sucesso!', true)
        cancelarEdicao()
        form.reset()
        form.data_registro.value = dataDeHoje()
        listar()
    } catch (erro) {
        mostrarAviso(erro.message, false)
    }
})

// CONSULTA INDIVIDUAL: abre o modal com os dados de um objeto específico
async function verDetalhes(id) {
    let objeto = null

    if (modoLocal) {
        objeto = carregarLocal().find(function (item) { return Number(item.id) === Number(id) })
    } else {
        try {
            objeto = await requisitarApi('/api/objetos/' + id)
            if (modoLocal) {
                objeto = carregarLocal().find(function (item) { return Number(item.id) === Number(id) })
            }
        } catch (erro) {
            mostrarAviso('Erro ao consultar o objeto: ' + erro.message, false)
            return
        }
    }

    if (!objeto || !objeto.id) {
        mostrarAviso('Objeto não encontrado.', false)
        return
    }

    const classeSituacao = objeto.situacao === 'Devolvido' ? 'devolvido' : 'disponivel'

    document.getElementById('det-id').textContent = objeto.id
    document.getElementById('det-descricao').textContent = objeto.descricao
    document.getElementById('det-categoria').textContent = objeto.categoria
    document.getElementById('det-local').textContent = objeto.local
    document.getElementById('det-data').textContent = formatarData(objeto.data_registro)
    document.getElementById('det-situacao').innerHTML =
        `<span class="situacao ${classeSituacao}">${escapar(objeto.situacao)}</span>`

    modal.dataset.id = objeto.id
    modal.classList.remove('escondido')
}

function fecharModal() {
    modal.classList.add('escondido')
}

// prepara o formulário para editar um objeto
function editar(id) {
    const botao = document.querySelector(`tr [data-id="${id}"][data-acao="editar"]`)
    if (!botao) return

    const colunas = botao.closest('tr').children

    form.descricao.value = colunas[1].querySelector('strong').textContent
    form.categoria.value = colunas[2].textContent
    form.local.value = colunas[3].textContent
    form.situacao.value = colunas[5].querySelector('span').textContent

    // a data da tabela está em dia/mes/ano, converte para ano-mes-dia
    const partes = colunas[4].textContent.split('/')
    form.data_registro.value = `${partes[2]}-${partes[1]}-${partes[0]}`

    editandoId = id
    tituloForm.textContent = `Editar objeto #${id}`
    botaoSalvar.textContent = 'Salvar alterações'
    botaoCancelar.className = 'button-secondary'
    document.getElementById('descricao').scrollIntoView({ behavior: 'smooth', block: 'center' })
    document.getElementById('descricao').focus({ preventScroll: true })
}

// volta o formulário ao modo de cadastro
function cancelarEdicao() {
    editandoId = null
    tituloForm.textContent = 'Cadastrar objeto'
    botaoSalvar.textContent = 'Cadastrar objeto'
    botaoCancelar.className = 'button-secondary escondido'
}

// ATUALIZAR SITUAÇÃO: altera apenas disponível/devolvido
async function alterarSituacao(id, situacao) {
    try {
        await requisitarApi(`/api/objetos/${id}/situacao`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ situacao })
        })

        if (modoLocal) {
            const lista = carregarLocal()
            const objeto = lista.find(function (item) { return Number(item.id) === Number(id) })
            if (objeto) objeto.situacao = situacao
            gravarLocal(lista)
        }

        mostrarAviso('Situação alterada com sucesso!', true)
        listar()
    } catch (erro) {
        mostrarAviso(erro.message, false)
    }
}

// EXCLUIR: remove o objeto depois de confirmar
async function excluir(id) {
    if (!confirm('Tem certeza que deseja excluir este objeto?')) return

    try {
        await requisitarApi(`/api/objetos/${id}`, { method: 'DELETE' })

        if (modoLocal) {
            gravarLocal(carregarLocal().filter(function (item) { return Number(item.id) !== Number(id) }))
        }

        if (editandoId === id) cancelarEdicao()

        mostrarAviso('Objeto excluído com sucesso!', true)
        listar()
    } catch (erro) {
        mostrarAviso(erro.message, false)
    }
}

// eventos dos botões e da descrição dentro da tabela
corpoTabela.addEventListener('click', function (evento) {
    const alvo = evento.target.closest('[data-acao]')
    if (!alvo) return

    const id = Number(alvo.dataset.id)
    const acao = alvo.dataset.acao

    if (acao === 'ver') verDetalhes(id)
    if (acao === 'editar') editar(id)
    if (acao === 'situacao') alterarSituacao(id, alvo.dataset.situacao)
    if (acao === 'excluir') excluir(id)
})

corpoTabela.addEventListener('keydown', function (evento) {
    if (evento.key !== 'Enter' && evento.key !== ' ') return
    const alvo = evento.target.closest('[data-acao="ver"]')
    if (!alvo) return
    evento.preventDefault()
    verDetalhes(Number(alvo.dataset.id))
})

// eventos dos filtros
campoBusca.addEventListener('input', listar)

chipsFiltro.forEach(function (chip) {
    chip.addEventListener('click', function () {
        situacaoAtiva = chip.dataset.situacao

        chipsFiltro.forEach(function (item) {
            item.classList.toggle('ativo', item === chip)
        })

        listar()
    })
})

// botão do cabeçalho: prepara um novo cadastro
botaoNovo.addEventListener('click', function () {
    cancelarEdicao()
    form.reset()
    form.data_registro.value = dataDeHoje()
    esconderAviso()
    document.getElementById('descricao').scrollIntoView({ behavior: 'smooth', block: 'center' })
    document.getElementById('descricao').focus({ preventScroll: true })
})

botaoCancelar.addEventListener('click', function () {
    cancelarEdicao()
    form.reset()
    form.data_registro.value = dataDeHoje()
    esconderAviso()
})

// eventos do modal de detalhes
document.getElementById('modal-fechar').addEventListener('click', fecharModal)
document.getElementById('modal-fechar-acao').addEventListener('click', fecharModal)

modal.addEventListener('click', function (evento) {
    if (evento.target === modal) fecharModal()
})

document.addEventListener('keydown', function (evento) {
    if (evento.key === 'Escape' && !modal.classList.contains('escondido')) fecharModal()
})

modalEditar.addEventListener('click', function () {
    const id = Number(modal.dataset.id)
    fecharModal()
    editar(id)
})

// inicia a aplicação
form.data_registro.value = dataDeHoje()
listar()
