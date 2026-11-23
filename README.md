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
.env                      -> URL e chave do Supabase
```

## Como executar

1. Garanta que a tabela `objetos` já exista no projeto Supabase.
2. Instale as dependências: `npm install`
3. Inicie: `npm start`
4. Acesse: http://localhost:3001

## Publicar na Vercel

1. Envie o projeto para um repositório Git e importe esse repositório na Vercel.
2. Em **Settings > Environment Variables** do projeto na Vercel, configure `SUPABASE_URL` e `SUPABASE_KEY` com os valores do seu projeto Supabase. Não configure `PORT`; a Vercel gerencia a porta.
3. Faça um novo deploy. A Vercel publicará os arquivos de `public/` e encaminhará as rotas `/api/*` para a aplicação Express.
4. Acesse o domínio gerado pela Vercel. A API estará disponível no mesmo domínio em `/api` e `/api/objetos`.

O arquivo `.env` é usado somente na execução local e não deve ser enviado ao repositório. Como ele já estava versionado, remova-o do controle de versão e troque/rotacione a chave do Supabase antes de publicar:

```powershell
git rm --cached .env
```

Mantenha o `.env` no computador e configure os valores diretamente no painel da Vercel.

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

## Validações e tratamento de erros

- Campos obrigatórios: descrição, categoria, local, data e situação.
- Situação aceita somente: `Disponível` ou `Devolvido`.
- ID inválido retorna `400`; objeto não encontrado retorna `404`; falha no banco retorna `500`.
