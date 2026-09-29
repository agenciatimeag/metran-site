# Site e Blog da Clínica Metran

## Estrutura
- `index.html`: site principal
- `/blog` e `/blog/nome-do-artigo`: blog, gerado no servidor (bom para o Google)
- `/admin`: painel da equipe para escrever e publicar artigos
- `/sitemap.xml`: mapa do site para o Google, atualizado sozinho

## Publicar na Vercel (uma vez)
1. Criar o projeto na Vercel com esta pasta.
2. Em **Storage**, criar um **Blob Store** e conectar ao projeto. Isso cria a variável `BLOB_READ_WRITE_TOKEN`, onde ficam os artigos e as fotos.
3. Em **Settings > Environment Variables**, criar:
   - `ADMIN_PASSWORD`: senha do painel da equipe (use uma senha forte)
   - `SITE_URL`: `https://metran.med.br`
4. Fazer um novo deploy.

## Usar o painel
Acesse `metran.med.br/admin`, entre com a senha e clique em **Novo artigo**.
Rascunhos só aparecem para quem está logado. Ao publicar, o artigo entra no blog e na página inicial em até 1 minuto.

## Testar no computador
`npm install` e depois `ADMIN_PASSWORD=teste node dev.js`, e abrir http://localhost:3000
