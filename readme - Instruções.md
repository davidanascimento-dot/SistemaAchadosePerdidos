# Sistema de Achados e Perdidos

CRUD completo (Node.js + Express + Supabase) para a atividade prática.

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

