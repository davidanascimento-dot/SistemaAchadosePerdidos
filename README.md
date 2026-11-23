# Sistema de Achados e Perdidos

CRUD completo (Node.js + Express + Supabase) para a atividade prática SA_03, com interface responsiva inspirada no layout de referência.

## Estrutura do projeto

```
index.html                         -> redireciona /index.html para /public/index.html (compatibilidade com Live Server)
server.js                          -> inicia o servidor na porta 3001 (uso local)
src/app.js                         -> configura o Express (JSON, CORS, arquivos estáticos)
src/supabase.js                    -> conexão com o banco Supabase
src/routes/objetos.js              -> rotas da API (somente mapeamento dos endpoints)
src/controllers/objetosController.js -> regras de negócio, validações, acesso ao banco e erros
api/index.js                       -> função serverless da Vercel (exporta o app Express)
public/index.html                  -> interface do usuário
public/style.css                   -> estilos da interface (layout desktop + responsivo)
public/script.js                   -> CRUD no front-end (fetch + JSON, com fallback local)
public/assets/logo.png             -> logotipo usado no cabeçalho e como favicon
banco.sql                          -> criação da tabela no Supabase
vercel.json                        -> rotas da Vercel (/api/* para a função e /index.html para /)
.vscode/settings.json              -> configura a raiz do Live Server como /public
```

> O `index.html` da raiz é apenas um redirecionamento para `public/index.html`, usado quando o Live Server serve a pasta do projeto como raiz. No Vercel, o `vercel.json` redireciona `/index.html` para `/`, onde o `public/index.html` é servido — não há conflito.

## Interface

- Cabeçalho com a logo enviada (`public/assets/logo.png`), título e botão **Novo objeto**.
- Painel de cadastro com descrição, categoria, data, local e situação.
- Painel de objetos com busca, filtros por situação com contadores e tabela de resultados.
- **Consulta individual:** clicar na descrição de um objeto abre um modal com todos os seus dados (usa `GET /api/objetos/:id`). No modal também é possível editar o objeto.
- Ações da tabela: devolver, editar e excluir (a situação também pode ser alterada nos dois sentidos pelo formulário de edição).
- **Responsivo:** até 980 px os painéis empilham; até 640 px os campos ficam em uma coluna e cada linha da tabela vira um cartão com rótulos.

## Requisitos da atividade atendidos

| Requisito | Onde está |
| --------- | --------- |
| Interface Front-End | `public/index.html`, `public/style.css` (layout da referência, logo e responsividade) |
| Servidor Back-End e API | `src/app.js`, `api/index.js`, `src/routes/objetos.js` |
| Banco de dados e persistência | `banco.sql` (Supabase) + `src/supabase.js` |
| Cadastro, consulta e consulta individual, alteração de situação e exclusão | CRUD completo na API + interface (modal de detalhes, botões Devolver/Editar/Excluir) |
| Comunicação Front-End ↔ Back-End com HTTP/JSON | `public/script.js` (`fetch`) |
| Validações básicas | `validar()` em `src/controllers/objetosController.js` + campos `required` no formulário |
| Tratamento de erros | mensagens na interface, respostas JSON com `erro`/`detalhes` e fallback local no Live Server |
| Segurança da informação | escape de HTML no front-end, validação no back-end, `CHECK` no banco e RLS configurado |
| Código organizado | separação entre routes, controllers, serviços e arquivos estáticos |

## Como executar localmente

### Com o servidor Node (dados reais no Supabase)

1. No **SQL Editor** do Supabase, rode o conteúdo de `banco.sql` (cria a tabela `objetos`).
2. Instale as dependências: `npm install`
3. Inicie: `npm start` (equivalente a `node server.js`)
4. Acesse: http://localhost:3001

### Com o Live Server do VS Code

O arquivo `.vscode/settings.json` já define `"liveServer.settings.root": "/public"`. Basta clicar em **Go Live** (ou botão direito em `public/index.html` → *Open with Live Server*) e abrir http://localhost:5501.

Se o Live Server **já estava rodando antes** dessa configuração, pare a sessão (clique em `Port: 5501` na barra de status do VS Code e em *Stop*) e clique em **Go Live** novamente. Mesmo que ele continue servindo a raiz do projeto, o `index.html` da raiz redireciona para `/public/index.html`, então http://localhost:5501/index.html também funciona.

Em outro servidor estático, aponte a raiz para a pasta `public` ou acesse diretamente `/public/index.html`.

**Dados no Live Server:** como ele não roda o backend, o front-end tenta usar a API em `http://localhost:3001` (deixe `node server.js` rodando junto, se quiser os dados do Supabase). Se o servidor Node não estiver ativo, o sistema entra automaticamente no **modo local** e salva os objetos no `localStorage` do navegador (chave `achados-perdidos-objetos`). Nada disso altera o comportamento no Vercel, onde a API está na mesma origem.

## API

| Método | Rota | Descrição |
| ------ | ---- | --------- |
| GET | `/api` | Teste da API |
| GET | `/api/objetos` | Lista objetos (filtros opcionais `?busca=` e `?situacao=`) |
| GET | `/api/objetos/:id` | Consulta um objeto específico |
| POST | `/api/objetos` | Cadastra um objeto |
| PUT | `/api/objetos/:id` | Atualiza todos os dados do objeto |
| PATCH | `/api/objetos/:id/situacao` | Altera apenas a situação (Disponível/Devolvido) |
| DELETE | `/api/objetos/:id` | Exclui um objeto |

Exemplo de JSON enviado no POST/PUT:

```json
{
  "descricao": "Mochila azul com cadernos",
  "categoria": "Mochilas e bolsas",
  "local": "Biblioteca",
  "data_registro": "2026-11-23",
  "situacao": "Disponível"
}
```

## Deploy na Vercel

O app Express é exportado em `api/index.js` e todas as rotas `/api/*` são direcionadas para ele pelo `vercel.json`. Os arquivos de `public/` (incluindo `assets/logo.png`) são servidos pela CDN na raiz do site. O `vercel.json` também redireciona `/index.html` para `/`, garantindo que o redirecionamento local não afete a URL publicada.

**Importante:** não configure `outputDirectory: public` na Vercel — isso publica somente o front-end e faz `/api/objetos` retornar 404 em HTML. Deixe **Output Directory vazio** e **Root Directory** na raiz do repositório.

1. Acesse https://vercel.com/new e importe o repositório.
2. Mantenha as configurações padrão e clique em **Deploy**.
3. A URL será `https://<nome-do-projeto>.vercel.app`.
4. Teste `https://<nome-do-projeto>.vercel.app/api` — deve responder `{"mensagem":"API de Achados e Perdidos funcionando"}`.

A URL e a chave do Supabase já estão como padrão em `src/supabase.js` (a chave é *publishable*, ou seja, pública). Se quiser, configure `SUPABASE_URL` e `SUPABASE_KEY` em **Settings > Environment Variables** da Vercel. Não configure `PORT`.

### Checklist antes do push

- [ ] `git add index.html public/index.html public/style.css public/script.js public/assets/logo.png api/index.js src vercel.json package.json package-lock.json banco.sql README.md`
- [ ] `vercel.json` continua com o rewrite de `/api/(.*)` para `/api/index` e o redirect de `/index.html` para `/`
- [ ] `.env` não vai no commit (já está no `.gitignore`)
- [ ] Pasta `.vscode/` é apenas configuração do editor — não influencia o deploy

Após o push e o deploy, valide na URL publicada:

1. `/` mostra o sistema com a logo e os dois painéis;
2. `/assets/logo.png` carrega a imagem;
3. `/api` e `/api/objetos` respondem JSON (não HTML);
4. Cadastrar, editar, devolver e excluir um objeto refletem no Supabase.

## Validações e tratamento de erros

- Campos obrigatórios: descrição, categoria, local, data e situação.
- Situação aceita somente: `Disponível` ou `Devolvido` (sem acento também funciona).
- ID inválido retorna `400`; objeto não encontrado retorna `404`; falha no banco retorna `500`.
- Erros da API são exibidos na interface; o modo local só é ativado quando a API está realmente inacessível (servidor estático sem backend).
