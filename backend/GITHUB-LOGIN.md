# Login gratuito com GitHub — configuração inicial pendente

Escolha para o painel de uma única proprietária, sem domínio próprio e sem depender do envio de links por SMTP. Login com GitHub pelo Supabase não precisa de um serviço de e-mails para cada entrada. A implementação do botão está pronta, mas o provedor ainda precisa ser configurado antes de certificar o login real.

## O que já está implementado

catalog-client.js verifica /auth/v1/settings antes de iniciar a navegação. Quando GitHub estiver habilitado, encaminha o navegador para /auth/v1/authorize com provider=github, scopes=user:email e retorno fixo ao admin.html da vitrine. Não solicita escopo repo nem acesso a arquivos do repositório.

O retorno usa o fluxo de navegador suportado pelo Supabase. resumeLogin remove o fragmento do endereço antes das consultas, verifica /auth/v1/user e is_vitrine_admin. Tokens de acesso ao provedor retornados no fragmento não são armazenados. A sessão da aplicação permanece em memória. Não ampliar a lista privada de proprietárias para aceitar contas desconhecidas.

Se o e-mail verificado do GitHub coincidir com o já autorizado, o Supabase pode vincular a identidade automaticamente. Se não coincidir, o painel deve rejeitar o acesso até revisão explícita da proprietária; não usar user_metadata como prova de autorização.

## Configuração guiada, uma tela por vez

1. A proprietária abre https://github.com/settings/applications/new com sua conta clara159321-glitch. Nesta tela ainda não há chave secreta a compartilhar.
2. Registrar OAuth App com:
   - Application name: Minha Vitrine SHEIN
   - Homepage URL: https://clara159321-glitch.github.io/minha-vitrine-shein/
   - Authorization callback URL: https://rwjelyrvhsecryqeqeik.supabase.co/auth/v1/callback
   - Enable Device Flow desmarcado.
3. Gerar Client Secret. Client ID é público; Client Secret deve ser copiado diretamente do GitHub para o campo privado do Supabase. Não enviar em conversa ou captura de tela, não salvar no repositório nem no navegador do site.
4. Supabase Authentication → Sign In / Providers → GitHub: habilitar e preencher Client ID e Client Secret. As ferramentas conectadas atuais não oferecem atualização de configurações do provedor Auth. Esta etapa exige a proprietária na interface oficial.
5. Manter Site URL/redirect allowlist apontando para https://clara159321-glitch.github.io/minha-vitrine-shein/admin.html .
6. Testar ENTRAR COM GITHUB no Chrome Android, conferir consentimento apenas para identidade/e-mail, retorno ao painel e autorização da proprietária. Se o provedor estiver desativado, a interface apresenta a pendência sem pedir e-mails.
7. Testar cadastro real com foto, edição e exclusão de um item claramente de teste e confirmar as três roupas originais. Só então afirmar que o problema de login foi resolvido.

## Fontes oficiais

- https://supabase.com/docs/guides/auth/social-login/auth-github
- https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app

Dezessete testes simulados passaram, incluindo encaminhamento correto, escopo restrito e bloqueio com provedor desativado. O teste real OAuth e a configuração do provedor ainda dependem das etapas acima. Nenhuma alteração foi realizada nos produtos ou no esquema de autorização para esta preparação.

