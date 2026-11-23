// elementos da interface
const form = document.getElementById('form-objeto')
const tituloForm = document.getElementById('titulo-form')
const botaoSalvar = document.getElementById('btn-salvar')
const botaoCancelar = document.getElementById('btn-cancelar')
const corpoTabela = document.getElementById('corpo-tabela')
const aviso = document.getElementById('aviso')
const campoBusca = document.getElementById('busca')
const filtroSituacao = document.getElementById('filtro-situacao')
const contador = document.getElementById('contador')
const vazio = document.getElementById('vazio')

// guarda o ID do objeto que está sendo editado
let editandoId = null

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

// CONSULTAR: carrega todos os objetos da API
async function listar() {
    try {
        const parametros = new URLSearchParams()
        const busca = campoBusca.value.trim()
        const situacao = filtroSituacao.value

        if (busca) parametros.append('busca', busca)
        if (situacao) parametros.append('situacao', situacao)

        const resposta = await fetch('/api/objetos?' + parametros.toString())
        const dados = await resposta.json()

        if (!resposta.ok) {
            throw new Error(dados.detalhe || dados.erro || 'Erro ao carregar os objetos')
        }

        mostrarTabela(dados)
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
        const rotuloBotao = objeto.situacao === 'Disponível' ? 'Marcar devolvido' : 'Marcar disponível'

        linha.innerHTML = `
            <td>${objeto.id}</td>
            <td><strong>${escapar(objeto.descricao)}</strong></td>
            <td>${escapar(objeto.categoria)}</td>
            <td>${escapar(objeto.local)}</td>
            <td>${formatarData(objeto.data_registro)}</td>
            <td><span class="situacao ${classeSituacao}">${escapar(objeto.situacao)}</span></td>
            <td class="botoes-tabela">
                <button type="button" class="button-small" data-acao="editar" data-id="${objeto.id}">Editar</button>
                <button type="button" class="button-small" data-acao="situacao" data-id="${objeto.id}" data-situacao="${escapar(proximaSituacao)}">${rotuloBotao}</button>
                <button type="button" class="button-small danger" data-acao="excluir" data-id="${objeto.id}">Excluir</button>
            </td>
        `

        corpoTabela.appendChild(linha)
    })
}

// CADASTRAR ou ATUALIZAR: envia o formulário para a API
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

    try {
        const url = editandoId ? `/api/objetos/${editandoId}` : '/api/objetos'
        const metodo = editandoId ? 'PUT' : 'POST'

        const resposta = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(objeto)
        })

        const dados = await resposta.json()

        if (!resposta.ok) {
            const detalhes = dados.detalhes ? ' (' + dados.detalhes.join('; ') + ')' : ''
            throw new Error((dados.erro || 'Erro ao salvar') + detalhes)
        }

        mostrarAviso(editandoId ? 'Objeto atualizado com sucesso!' : 'Objeto cadastrado com sucesso!', true)
        cancelarEdicao()
        form.reset()
        form.data_registro.value = dataDeHoje()
        listar()
    } catch (erro) {
        mostrarAviso(erro.message, false)
    }
})

// prepara o formulário para editar um objeto
function editar(id) {
    const linha = document.querySelector(`tr [data-id="${id}"][data-acao="editar"]`)
    if (!linha) return

    const colunas = linha.closest('tr').children

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
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
        const resposta = await fetch(`/api/objetos/${id}/situacao`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ situacao })
        })

        const dados = await resposta.json()

        if (!resposta.ok) {
            throw new Error(dados.erro || 'Erro ao alterar a situação')
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
        const resposta = await fetch(`/api/objetos/${id}`, { method: 'DELETE' })
        const dados = await resposta.json()

        if (!resposta.ok) {
            throw new Error(dados.erro || 'Erro ao excluir o objeto')
        }

        if (editandoId === id) cancelarEdicao()

        mostrarAviso('Objeto excluído com sucesso!', true)
        listar()
    } catch (erro) {
        mostrarAviso(erro.message, false)
    }
}

// eventos dos botões dentro da tabela
corpoTabela.addEventListener('click', function (evento) {
    const botao = evento.target.closest('button[data-acao]')
    if (!botao) return

    const id = Number(botao.dataset.id)
    const acao = botao.dataset.acao

    if (acao === 'editar') editar(id)
    if (acao === 'situacao') alterarSituacao(id, botao.dataset.situacao)
    if (acao === 'excluir') excluir(id)
})

// eventos dos filtros
campoBusca.addEventListener('input', listar)
filtroSituacao.addEventListener('change', listar)
botaoCancelar.addEventListener('click', function () {
    cancelarEdicao()
    form.reset()
    form.data_registro.value = dataDeHoje()
    esconderAviso()
})

// inicia a aplicação
form.data_registro.value = dataDeHoje()
listar()
