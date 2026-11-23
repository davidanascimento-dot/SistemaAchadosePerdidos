# Sistema de Achados e Perdidos

CRUD completo (Node.js + Express + Supabase) para a atividade prática SA_03.

## Estrutura do projeto

```
server.js                 -> inicia o servidor na porta 3001
src/app.js                -> configura o Express (JSON, CORS, arquivos estáticos)
src/supabase.js           -> conexão com o banco Supabase
src/routes/objetos.js     -> rotas da API (somente mapeamento dos endpoints)
src/controllers/objetosController.js -> regras de negócio, validações, acesso ao banco e erros
public/index.html         -> interface do usuário
public/script.js          -> comunicação front-end com a API (fetch + JSON)
public/style.css          -> estilos da interface
banco.sql                 -> criação da tabela no Supabase
.env                      -> URL e chave do Supabase
```

## Como executar

1. No **SQL Editor** do Supabase, rode o conteúdo de `banco.sql` (cria a tabela `objetos`).
2. Instale as dependências: `npm install`
3. Inicie: `npm start`
4. Acesse: http://localhost:3001

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

O app Express é exportado em `api/index.js` e todas as rotas `/api/*` são direcionadas para ele pelo `vercel.json`. Os arquivos de `public/` (index.html, style.css, script.js) são servidos pela CDN da Vercel. Não use `outputDirectory: public` — isso publica só o front-end e faz a API retornar 404.

Opção 1 — pelo site:
1. Acesse https://vercel.com/new e importe o repositório `Santana73/CRUD---ATIVIDADE-PR-TICA`.
2. Mantenha as configurações padrão (Framework: Express/Other) e clique em **Deploy**.
3. A URL será `https://<nome-do-projeto>.vercel.app`.

Opção 2 — pela CLI:
```bash
npm install -g vercel
vercel login
vercel deploy --prod
```

A chave do Supabase usada é uma *publishable key* (pública) e já está no `.env`, que vai junto do deploy. Também é possível cadastrar `SUPABASE_URL` e `SUPABASE_KEY` como variáveis de ambiente no painel da Vercel.

## Validações e tratamento de erros

- Campos obrigatórios: descrição, categoria, local, data e situação.
- Situação aceita somente: `Disponível` ou `Devolvido`.
- ID inválido retorna `400`; objeto não encontrado retorna `404`; falha no banco retorna `500`.
