# Cloudflare Pages — segundo endereço, mantendo GitHub Pages

Solicitado: minhavitrine.pages.dev, se disponível, no plano gratuito. Estado: preparação de código concluída; conta Cloudflare não conectada e endereço ainda não reservado nem publicado. A ferramenta de navegação não conseguiu abrir esse nome; isso não prova que esteja livre.

## Preservação

O GitHub Pages atual continua em https://clara159321-glitch.github.io/minha-vitrine-shein/ . Não alterar nome de usuário, repositório, Pages ou CNAME e não criar redirecionamento do endereço atual.

Consulta de preparação confirmou OITO produtos ativos no Supabase, todos com foto e link. Esse catálogo vivo já foi ampliado pela proprietária. Não reimportar os três produtos de products.json, não reinicializar o banco, não apagar nem substituir os oito produtos. A cópia estática é uma recuperação antiga; a fonte pública ativa é o mesmo projeto Supabase em site-config.json. Ambos os sites devem consumir esse serviço, sem duplicar bases.

## Acesso e hospedagem

Não há ferramenta Cloudflare autenticada nesta conversa nem credenciais Cloudflare configuradas no ambiente. Não pedir token de API na conversa. A proprietária precisa entrar em https://dash.cloudflare.com/ e autorizar a integração oficial do GitHub para apenas clara159321-glitch/minha-vitrine-shein. Orientar uma tela por vez.

Configuração proposta no plano gratuito:
- Produto: Pages com integração Git, não comprar domínio nem plano.
- Repositório existente, branch main.
- Nome do projeto: minhavitrine. Confirmar domínio final mostrado pela plataforma; não prometer a disponibilidade do nome.
- Framework preset: None.
- Build command: exit 0.
- Build output directory: . (raiz onde está index.html).
- Sem variáveis secretas de build, sem Workers/Functions necessários.
- Não selecionar site-config.json ou products.json como diretório de saída: publicar os arquivos completos da raiz.
- Sem mudar configuração ou desativar a publicação do GitHub Pages.

Se a plataforma apresentar outro nome ou exigir opção paga, interromper essa escolha e avisar a proprietária antes de reservar alternativa ou assumir custo.

## Login

authRedirect() retorna admin.html no endereço HTTPS da aba atual, sem query nem fragmento. No GitHub Pages retorna /minha-vitrine-shein/admin.html; no domínio solicitado do Cloudflare retorna /admin.html. GitHub OAuth e Magic Link usam esse retorno. Senha usa a mesma autorização existente.

Antes do teste real, adicionar o endereço EXATO do novo painel no Supabase Authentication → URL Configuration → Redirect URLs:
https://minhavitrine.pages.dev/admin.html

Preservar o Site URL e os retornos atuais do GitHub Pages. Não usar wildcard amplo *.pages.dev. Se o Cloudflare fornecer outro domínio, usar o domínio realmente reservado, com autorização da proprietária.

O callback do OAuth App no GitHub continua sendo o do serviço Supabase, não o domínio da loja:
https://rwjelyrvhsecryqeqeik.supabase.co/auth/v1/callback

A configuração do provedor GitHub descrita em GITHUB-LOGIN.md pode continuar pendente; verificar antes de dizer que o login funciona. As ferramentas conectadas não permitem alterar o painel administrativo de Auth automaticamente. Credenciais de OAuth ficam somente no Supabase; não solicitar segredo por conversa ou imagem.

## Validação após publicar

- Confirmar status da implantação e URL retornada pelo Cloudflare.
- Abrir loja e painel nos dois endereços.
- Confirmar os oito produtos vivos do Supabase, fotos, preços e links exatamente iguais.
- Com a proprietária, testar login no novo endereço e verificar que retorna para o domínio correto, não para localhost nem para o domínio antigo.
- Testar cadastro de item claramente de teste, edição e exclusão; confirmar que os dois endereços leem o mesmo estado. Preservar os oito originais.
- Manter GitHub Pages operacional.

Dezenove testes locais simulados passaram, incluindo callbacks de ambos os hosts e rejeição de HTTP. Não houve teste real no Cloudflare: não foi reservado domínio ou provisionada hospedagem nesta etapa.

Fontes:
https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
https://developers.cloudflare.com/pages/platform/limits/
https://supabase.com/docs/guides/auth/redirect-urls

