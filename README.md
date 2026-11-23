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

## Atividade feita pelos alunos: David de Araújo Nascimento Daniel Santana
